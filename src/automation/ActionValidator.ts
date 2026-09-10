import { Action, ActionType, ValidationResult } from './types';

export class ActionValidator {
  private static readonly VALID_ACTION_TYPES = new Set<ActionType>(Object.values(ActionType));
  private static readonly MIN_TIMEOUT_MS = 100;
  private static readonly MAX_TIMEOUT_MS = 60000;
  private static readonly MAX_RETRY_COUNT = 5;

  private static readonly RESTRICTED_PACKAGES = new Set([
    'com.google.android.apps.nfc',
    'com.android.settings.security',
    'com.google.android.apps.walletnfcrel',
    'com.phonepe.app',
    'net.one97.paytm',
    'com.google.android.apps.authenticator2',
  ]);

  /**
   * Validates an AI-generated Action object before execution.
   * Guarantees that malformed output will never crash the system.
   */
  public static validate(rawAction: Partial<Action>, sensitiveAppsDenylist: string[] = []): ValidationResult {
    const errors: string[] = [];

    if (!rawAction) {
      return { valid: false, errors: ['Action object is null or undefined'] };
    }

    // 1. Validate Action ID
    const actionId = typeof rawAction.actionId === 'string' && rawAction.actionId.trim().length > 0
      ? rawAction.actionId.trim()
      : `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 2. Validate Action Type
    if (!rawAction.actionType || !this.VALID_ACTION_TYPES.has(rawAction.actionType)) {
      errors.push(`Invalid actionType: "${rawAction.actionType}". Supported: ${Array.from(this.VALID_ACTION_TYPES).join(', ')}`);
    }

    // 3. Validate Parameters
    const parameters = typeof rawAction.parameters === 'object' && rawAction.parameters !== null
      ? { ...rawAction.parameters }
      : {};

    // 4. Validate Specific Action Type Requirements
    if (rawAction.actionType === ActionType.APP_ACTION) {
      const appName = parameters.appName || parameters.packageName;
      if (!appName || typeof appName !== 'string') {
        errors.push('APP_ACTION requires "appName" or "packageName" in parameters');
      } else {
        const lowerApp = appName.toLowerCase();
        if (
          this.RESTRICTED_PACKAGES.has(lowerApp) ||
          sensitiveAppsDenylist.some((s) => lowerApp.includes(s.toLowerCase()))
        ) {
          errors.push(`Target application "${appName}" is restricted by Android security policy`);
        }
      }
    } else if (rawAction.actionType === ActionType.UI_ACTION) {
      const operation = parameters.operation;
      const validOps = ['click', 'long_click', 'focus', 'select', 'scroll', 'back', 'find', 'wait'];
      if (!operation || !validOps.includes(operation)) {
        errors.push(`UI_ACTION requires valid "operation" (${validOps.join(', ')}), got: ${operation}`);
      }
    } else if (rawAction.actionType === ActionType.GESTURE_ACTION) {
      const gesture = parameters.gesture;
      const validGestures = ['tap', 'long_press', 'double_tap', 'swipe_up', 'swipe_down', 'swipe_left', 'swipe_right', 'drag', 'scroll'];
      if (!gesture || !validGestures.includes(gesture)) {
        errors.push(`GESTURE_ACTION requires valid "gesture" (${validGestures.join(', ')}), got: ${gesture}`);
      }
    } else if (rawAction.actionType === ActionType.TEXT_ACTION) {
      const operation = parameters.operation;
      const validTextOps = ['enter', 'replace', 'append', 'clear', 'submit', 'focus'];
      if (!operation || !validTextOps.includes(operation)) {
        errors.push(`TEXT_ACTION requires valid "operation" (${validTextOps.join(', ')}), got: ${operation}`);
      }
      if (['enter', 'replace', 'append'].includes(operation) && typeof parameters.text !== 'string') {
        errors.push(`TEXT_ACTION with operation "${operation}" requires a "text" string parameter`);
      }
    } else if (rawAction.actionType === ActionType.DELAY_ACTION) {
      const ms = Number(parameters.durationMs);
      if (isNaN(ms) || ms < 0 || ms > 30000) {
        errors.push('DELAY_ACTION requires "durationMs" between 0 and 30000ms');
      }
    }

    // 5. Validate Timeout
    let timeout = Number(rawAction.timeout);
    if (isNaN(timeout) || timeout < this.MIN_TIMEOUT_MS) {
      timeout = 10000; // Default 10s
    } else if (timeout > this.MAX_TIMEOUT_MS) {
      timeout = this.MAX_TIMEOUT_MS;
    }

    // 6. Validate Retry Count
    let retryCount = Number(rawAction.retryCount);
    if (isNaN(retryCount) || retryCount < 0) {
      retryCount = 2; // Default 2 retries
    } else if (retryCount > this.MAX_RETRY_COUNT) {
      retryCount = this.MAX_RETRY_COUNT;
    }

    // 7. Validate Permissions
    const requiredPermissions = Array.isArray(rawAction.requiredPermissions)
      ? rawAction.requiredPermissions.filter((p) => typeof p === 'string')
      : ['android.permission.BIND_ACCESSIBILITY_SERVICE'];

    // Sanitized action result
    const sanitizedAction: Action = {
      actionId,
      actionType: rawAction.actionType as ActionType,
      title: rawAction.title || `${rawAction.actionType} execution`,
      parameters,
      timeout,
      retryCount,
      retriesAttempted: 0,
      requiredPermissions,
      executionState: rawAction.executionState || (errors.length === 0 ? ('VALIDATING' as any) : ('FAILED' as any)),
      priority: typeof rawAction.priority === 'number' ? rawAction.priority : 1,
    };

    return {
      valid: errors.length === 0,
      errors,
      sanitizedAction: errors.length === 0 ? sanitizedAction : undefined,
    };
  }
}
