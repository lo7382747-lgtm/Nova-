import {
  Action,
  ActionType,
  ExecutionState,
  ActionResult,
  VerificationResult,
  AutomationPlan,
  AutomationDefinition,
  AutomationLogEntry,
  RiskLevel,
} from './types';
import { ActionValidator } from './ActionValidator';
import { AppControlExecutor } from './AppControlExecutor';
import { UIActionExecutor } from './UIActionExecutor';
import { GestureExecutor } from './GestureExecutor';
import { TextExecutor } from './TextExecutor';
import { MediaControlExecutor } from './MediaControlExecutor';
import { SystemAutomationExecutor } from './SystemAutomationExecutor';
import { CommunicationExecutor } from './CommunicationExecutor';
import { notificationAutomationService } from './NotificationAutomationService';
import { ruleEngine } from './RuleEngine';
import { SafetyValidator } from './SafetyValidator';
import { confirmationManager } from './ConfirmationManager';
import { LoopProtection } from './LoopProtection';
import { automationLogService } from './AutomationLogService';
import { automationRepository } from './AutomationRepository';
import { AutomationAccessibilityService } from './AutomationAccessibilityService';
import { AutomationPermissionManager } from './AutomationPermissionManager';

export interface AutomationEngineState {
  engineState: ExecutionState;
  currentPlanTitle: string;
  currentActionIndex: number;
  totalActions: number;
  currentAction: Action | null;
  history: Action[];
  queue: Action[];
  isEmergencyStopped: boolean;
  activeError: string | null;
  lastCompletedAt: number | null;
}

export class AutomationEngine {
  private static instance: AutomationEngine;

  private state: AutomationEngineState = {
    engineState: ExecutionState.IDLE,
    currentPlanTitle: '',
    currentActionIndex: -1,
    totalActions: 0,
    currentAction: null,
    history: [],
    queue: [],
    isEmergencyStopped: false,
    activeError: null,
    lastCompletedAt: null,
  };

  private abortController: AbortController | null = null;
  private stateListeners: ((state: AutomationEngineState) => void)[] = [];
  private permissionManager = AutomationPermissionManager.getInstance();
  private accessibilityService = AutomationAccessibilityService.getInstance();

  public static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  public getState(): AutomationEngineState {
    return { ...this.state };
  }

  public onStateChange(listener: (state: AutomationEngineState) => void): () => void {
    this.stateListeners.push(listener);
    listener(this.getState());
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const s = this.getState();
    this.stateListeners.forEach((l) => l(s));
  }

  /**
   * EMERGENCY STOP: Immediately cancels all currently running and queued actions.
   * Can be invoked via voice/text "STOP AUTOMATION" or explicit red UI button.
   */
  public emergencyStop(reason: string = 'User triggered emergency stop'): void {
    this.state.isEmergencyStopped = true;
    this.state.activeError = reason;
    this.state.engineState = ExecutionState.CANCELLED;

    if (this.abortController) {
      this.abortController.abort(reason);
      this.abortController = null;
    }

    if (this.state.currentAction) {
      this.state.currentAction.executionState = ExecutionState.CANCELLED;
      this.state.currentAction.error = reason;
      this.state.history.push({ ...this.state.currentAction });
      this.state.currentAction = null;
    }

    // Drain remaining queue as cancelled
    while (this.state.queue.length > 0) {
      const remaining = this.state.queue.shift()!;
      remaining.executionState = ExecutionState.CANCELLED;
      remaining.error = reason;
      this.state.history.push(remaining);
    }

    this.notify();
  }

  /**
   * Resets the emergency stop latch to allow new actions.
   */
  public resetEmergencyStop(): void {
    this.state.isEmergencyStopped = false;
    this.state.activeError = null;
    this.state.engineState = ExecutionState.IDLE;
    this.notify();
  }

  /**
   * Executes a structured automation plan sequentially with verification, retries, and timeouts.
   */
  public async executePlan(
    title: string,
    rawActions: Partial<Action>[],
    sensitiveAppsDenylist: string[] = []
  ): Promise<{ success: boolean; executedCount: number; message: string }> {
    if (this.state.isEmergencyStopped) {
      return {
        success: false,
        executedCount: 0,
        message: 'Engine is in Emergency Stopped state. Reset required.',
      };
    }

    this.state.engineState = ExecutionState.PLANNING;
    this.state.currentPlanTitle = title;
    this.state.activeError = null;
    this.notify();

    // 1. Validation Phase
    this.state.engineState = ExecutionState.VALIDATING;
    this.notify();

    const validatedActions: Action[] = [];
    for (const raw of rawActions) {
      const validation = ActionValidator.validate(raw, sensitiveAppsDenylist);
      if (!validation.valid || !validation.sanitizedAction) {
        this.state.engineState = ExecutionState.FAILED;
        this.state.activeError = `Validation failed: ${validation.errors.join('; ')}`;
        this.notify();
        return {
          success: false,
          executedCount: 0,
          message: this.state.activeError,
        };
      }
      validatedActions.push(validation.sanitizedAction);
    }

    // Sort by priority if applicable
    validatedActions.sort((a, b) => (b.priority ?? 1) - (a.priority ?? 1));

    this.state.queue = [...validatedActions];
    this.state.totalActions = validatedActions.length;
    this.state.currentActionIndex = 0;
    this.abortController = new AbortController();

    let completedCount = 0;

    // 2. Sequential Execution Loop
    for (let i = 0; i < validatedActions.length; i++) {
      if (this.state.isEmergencyStopped || !this.abortController || this.abortController.signal?.aborted) {
        this.state.engineState = ExecutionState.CANCELLED;
        this.notify();
        return {
          success: false,
          executedCount: completedCount,
          message: 'Automation cancelled.',
        };
      }

      const action = this.state.queue.shift()!;
      this.state.currentAction = action;
      this.state.currentActionIndex = i;

      // Permission Check
      const permCheck = this.permissionManager.checkPermissionsForAction(action.requiredPermissions);
      if (!permCheck.allGranted) {
        this.state.engineState = ExecutionState.WAITING_PERMISSION;
        action.executionState = ExecutionState.WAITING_PERMISSION;
        action.error = `Missing permissions: ${permCheck.missing.join(', ')}`;
        this.notify();
        return {
          success: false,
          executedCount: completedCount,
          message: `Permission denied: ${permCheck.missing.join(', ')}`,
        };
      }

      // Execute Single Action with Timeout and Retries
      const executionResult = await this.executeActionWithRetry(action, sensitiveAppsDenylist);

      action.result = executionResult.result;
      action.verificationResult = executionResult.verification;
      action.executionState = executionResult.finalState;
      action.error = executionResult.error;

      this.state.history.push({ ...action });

      if (executionResult.finalState === ExecutionState.COMPLETED) {
        completedCount++;
      } else {
        this.state.engineState = executionResult.finalState;
        this.state.activeError = executionResult.error || 'Action failed.';
        this.notify();
        return {
          success: false,
          executedCount: completedCount,
          message: executionResult.error || 'Action failed.',
        };
      }
    }

    this.state.engineState = ExecutionState.COMPLETED;
    this.state.currentAction = null;
    this.state.lastCompletedAt = Date.now();
    this.notify();

    return {
      success: true,
      executedCount: completedCount,
      message: `Successfully completed ${completedCount} actions for "${title}".`,
    };
  }

  /**
   * Executes an action with timeout race and failure retry handling (reinspects UI on retry).
   */
  private async executeActionWithRetry(
    action: Action,
    sensitiveDenylist: string[]
  ): Promise<{
    finalState: ExecutionState;
    result?: ActionResult;
    verification?: VerificationResult;
    error?: string;
  }> {
    let attempts = 0;
    const maxRetries = action.retryCount ?? 2;

    while (attempts <= maxRetries) {
      if (this.state.isEmergencyStopped || !this.abortController || this.abortController.signal?.aborted) {
        return { finalState: ExecutionState.CANCELLED, error: 'Cancelled by emergency stop' };
      }

      if (attempts > 0) {
        this.state.engineState = ExecutionState.RETRYING;
        action.executionState = ExecutionState.RETRYING;
        action.retriesAttempted = attempts;
        this.notify();
        // Failure recovery step: wait and reinspect UI
        await new Promise((r) => setTimeout(r, 500));
        this.accessibilityService.getRootInActiveWindow();
      }

      this.state.engineState = ExecutionState.EXECUTING;
      action.executionState = ExecutionState.EXECUTING;
      this.notify();

      try {
        // Enforce Timeout with Promise.race
        const timeoutPromise = new Promise<{ isTimeout: true }>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), action.timeout)
        );

        const executionPromise = this.dispatchToExecutor(action, sensitiveDenylist);
        const { result, verification } = await Promise.race([executionPromise, timeoutPromise]) as any;

        // 3. Verification Phase
        this.state.engineState = ExecutionState.VERIFYING;
        action.executionState = ExecutionState.VERIFYING;
        this.notify();

        if (result.success && verification?.verified) {
          return {
            finalState: ExecutionState.COMPLETED,
            result,
            verification,
          };
        }

        // Action or verification failed, increment attempt
        attempts++;
        if (attempts > maxRetries) {
          return {
            finalState: ExecutionState.FAILED,
            result,
            verification,
            error: result.message || verification?.failureReason || 'Action failed verification after max retries.',
          };
        }
      } catch (err: any) {
        if (err.message === 'TIMEOUT') {
          return {
            finalState: ExecutionState.TIMEOUT,
            error: `Action exceeded timeout limit of ${action.timeout}ms.`,
          };
        }

        attempts++;
        if (attempts > maxRetries) {
          return {
            finalState: ExecutionState.FAILED,
            error: err.message || 'Execution failed unexpectedly.',
          };
        }
      }
    }

    return {
      finalState: ExecutionState.FAILED,
      error: 'Max retries exhausted.',
    };
  }

  /**
   * Dispatches an action to its specific specialized Android executor.
   */
  private async dispatchToExecutor(
    action: Action,
    sensitiveDenylist: string[]
  ): Promise<{ result: ActionResult; verification: VerificationResult }> {
    const params = action.parameters || {};

    switch (action.actionType) {
      case ActionType.APP_ACTION:
        if (params.operation === 'deep_link' && params.uri) {
          return await AppControlExecutor.openDeepLink(params.uri);
        }
        if (params.operation === 'send_intent') {
          return await AppControlExecutor.sendIntent(params.mimeType || 'text/plain', params.content || '', params.targetPkg);
        }
        if (params.operation === 'system_settings' && params.settingPanel) {
          return await AppControlExecutor.openSystemSetting(params.settingPanel);
        }
        if (params.operation === 'back') {
          return await AppControlExecutor.navigateBack();
        }
        return await AppControlExecutor.launchApp(params.appName || params.packageName, sensitiveDenylist);

      case ActionType.UI_ACTION:
        const query = {
          resourceId: params.resourceId,
          contentDescription: params.contentDescription,
          text: params.text,
          isClickable: params.isClickable,
          isEditable: params.isEditable,
          structuralIndex: params.structuralIndex,
        };

        if (params.operation === 'long_click') {
          return await UIActionExecutor.longClick(query);
        }
        if (params.operation === 'focus') {
          return await UIActionExecutor.focus(query);
        }
        if (params.operation === 'scroll') {
          return await UIActionExecutor.scroll(params.direction || 'forward');
        }
        if (params.operation === 'back') {
          return await AppControlExecutor.navigateBack();
        }
        if (params.operation === 'wait') {
          const waitRes = await UIActionExecutor.waitForElement(query, params.timeoutMs || 5000);
          return {
            result: {
              success: waitRes.verified,
              message: waitRes.verified ? 'Target element appeared.' : 'Wait for element timed out.',
              executionTimeMs: waitRes.waitTimeMs,
            },
            verification: {
              verified: waitRes.verified,
              observedState: waitRes.verified ? 'ELEMENT_APPEARED' : 'ELEMENT_NOT_APPEARED',
            },
          };
        }
        return await UIActionExecutor.click(query);

      case ActionType.GESTURE_ACTION:
        return await GestureExecutor.executeGesture(params.gesture, params.coords);

      case ActionType.TEXT_ACTION:
        const tQuery = {
          resourceId: params.resourceId,
          text: params.targetText,
          isEditable: true,
        };
        if (params.operation === 'submit') {
          return await TextExecutor.submitText(tQuery);
        }
        return await TextExecutor.enterText(tQuery, params.text || '', params.operation || 'enter');

      case ActionType.DELAY_ACTION:
        const duration = Number(params.durationMs) || 1000;
        await new Promise((r) => setTimeout(r, duration));
        return {
          result: {
            success: true,
            message: `Waited for ${duration}ms delay.`,
            executionTimeMs: duration,
          },
          verification: {
            verified: true,
            observedState: 'DELAY_COMPLETED',
          },
        };

      case ActionType.MEDIA_ACTION:
        if (params.command === 'set_volume') {
          return await MediaControlExecutor.setMediaVolume(params.volumePercent ?? 50);
        }
        return await MediaControlExecutor.executeMediaCommand(params.command || 'play', params.targetApp);

      case ActionType.SYSTEM_ACTION:
        if (params.operation === 'brightness') {
          return await SystemAutomationExecutor.setBrightness(params.brightnessPercent ?? 50);
        }
        if (params.operation === 'settings') {
          return await SystemAutomationExecutor.openSettingsPanel(params.panel || 'wifi');
        }
        return await SystemAutomationExecutor.setSystemVolume(params.streamType || 'media', params.volumePercent ?? 50);

      case ActionType.COMMUNICATION_ACTION:
        if (params.operation === 'dial') {
          return await CommunicationExecutor.openDialer(params.phoneNumber || '');
        }
        if (params.operation === 'call') {
          return await CommunicationExecutor.makePhoneCall(params.phoneNumber || params.contactName || '');
        }
        if (params.operation === 'sms') {
          return await CommunicationExecutor.composeSms(params.phoneNumber || '', params.messageBody || '');
        }
        if (params.operation === 'share') {
          return await CommunicationExecutor.shareContent(params.text || '', params.title);
        }
        return await CommunicationExecutor.openDialer(params.phoneNumber || '');

      case ActionType.NOTIFICATION_ACTION:
        if (params.operation === 'dismiss' && params.notificationId) {
          const dismissed = notificationAutomationService.dismissNotification(params.notificationId);
          return {
            result: {
              success: dismissed,
              message: dismissed ? 'Notification dismissed.' : 'Notification not found.',
              executionTimeMs: 40,
            },
            verification: {
              verified: dismissed,
              observedState: dismissed ? 'NOTIF_DISMISSED' : 'NOTIF_FAILED',
            },
          };
        }
        if (params.operation === 'open' && params.notificationId) {
          const opened = await notificationAutomationService.openNotificationApp(params.notificationId);
          return {
            result: {
              success: opened,
              message: opened ? 'Notification app opened.' : 'Failed to open notification app.',
              executionTimeMs: 150,
            },
            verification: {
              verified: opened,
              observedState: opened ? 'NOTIF_APP_OPENED' : 'NOTIF_APP_FAILED',
            },
          };
        }
        return {
          result: { success: true, message: 'Notification action processed', executionTimeMs: 20 },
          verification: { verified: true, observedState: 'NOTIF_PROCESSED' },
        };

      default:
        return {
          result: {
            success: true,
            message: `Dispatched action ${action.actionType}`,
            executionTimeMs: 50,
          },
          verification: {
            verified: true,
            observedState: 'DISPATCHED',
          },
        };
    }
  }

  /**
   * Executes a saved or newly configured AutomationDefinition with preconditions, safety check,
   * loop protection, verification rules, and execution logging.
   */
  public async executeAutomationDefinition(
    def: AutomationDefinition,
    options: { skipConfirmation?: boolean } = {}
  ): Promise<{ success: boolean; executedCount: number; message: string }> {
    const loopProtection = new LoopProtection(def.actions.length + 10, def.timeoutMs || 60000);
    const recursionCheck = loopProtection.checkRecursion(def.id);
    if (!recursionCheck.safe) {
      return { success: false, executedCount: 0, message: recursionCheck.reason! };
    }

    // 1. Evaluate Conditions via RuleEngine
    if (def.conditions && def.conditions.length > 0) {
      const condEval = ruleEngine.evaluateConditions(def.conditions);
      if (!condEval.satisfied) {
        return {
          success: false,
          executedCount: 0,
          message: `Preconditions not met: ${condEval.summary}`,
        };
      }
    }

    // 2. Safety & Confirmation Gate
    const safetyCheck = SafetyValidator.validatePlanSafety(def.actions, options.skipConfirmation, def.confirmationPolicy);
    if (safetyCheck.requiresUserConfirmation) {
      const firstSensitive = def.actions.find((a) => SafetyValidator.classifyActionRisk(a) !== RiskLevel.LOW_RISK) || def.actions[0];
      const approved = await confirmationManager.requestConfirmation(
        def.name,
        firstSensitive,
        safetyCheck.riskLevel,
        safetyCheck.reasons.join(' ') || 'This automation contains actions requiring user consent.'
      );
      if (!approved) {
        return {
          success: false,
          executedCount: 0,
          message: 'Automation execution cancelled by user: Confirmation denied.',
        };
      }
    }

    // 3. Execute Actions
    const startTime = Date.now();
    const planResult = await this.executePlan(def.name, def.actions);
    const duration = Date.now() - startTime;

    // 4. Record to Log Service & Repository
    const logEntry: AutomationLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      automationId: def.id,
      automationName: def.name,
      startTime,
      endTime: Date.now(),
      durationMs: duration,
      totalActions: def.actions.length,
      successfulActions: planResult.executedCount,
      failedActions: planResult.success ? 0 : 1,
      failureReason: planResult.success ? undefined : planResult.message,
      finalStatus: planResult.success ? 'SUCCESS' : 'FAILED',
      stepDetails: this.state.history.slice(-def.actions.length).map((a) => ({
        actionTitle: a.title,
        status: a.executionState === ExecutionState.COMPLETED ? 'success' : 'failed',
        durationMs: a.result?.executionTimeMs || 0,
        error: a.error,
      })),
    };

    automationLogService.recordLog(logEntry);
    automationRepository.recordExecution(def.id, planResult.success ? 'success' : 'failure');

    return planResult;
  }
}
export const automationEngine = AutomationEngine.getInstance();
