/**
 * NaturalLanguagePlanner
 * Converts conversational voice/text prompts into a strictly validated, executable AutomationDefinition.
 * Never executes raw natural language directly.
 * Validates all triggers, conditions, actions, and verification constraints before execution.
 */

import {
  Action,
  ActionType,
  AutomationDefinition,
  ExecutionState,
  RiskLevel,
  RuleCondition,
  TriggerConfig,
  TriggerType,
} from './types';
import { SafetyValidator } from './SafetyValidator';

export interface StructuredPlanSchema {
  automation: string;
  trigger: TriggerConfig;
  conditions: RuleCondition[];
  actions: Action[];
  verification: string[];
  confirmation_required: boolean;
  timeout_ms: number;
  max_retries: number;
}

export interface PlanParseResult {
  valid: boolean;
  plan?: AutomationDefinition;
  schema?: StructuredPlanSchema;
  errors: string[];
  rejectionReason?: string;
}

export class NaturalLanguagePlanner {
  /**
   * Translates natural language into a strict structured plan schema.
   */
  public static planFromNaturalLanguage(prompt: string): PlanParseResult {
    const raw = prompt.toLowerCase().trim();
    const errors: string[] = [];

    if (!raw || raw.length < 5) {
      return {
        valid: false,
        errors: ['Prompt is too brief to formulate a deterministic automation plan.'],
        rejectionReason: 'MALFORMED_INPUT',
      };
    }

    // Identify Trigger
    let trigger: TriggerConfig = {
      triggerId: `trig_${Date.now()}`,
      type: TriggerType.SCHEDULED_EVENT,
      parameters: {},
      enabled: true,
    };

    const conditions: RuleCondition[] = [];
    const actions: Action[] = [];
    const verification: string[] = [];
    let planTitle = 'Custom Automation';

    // 1. Detect Car / Bluetooth Intent
    if (raw.includes('car') && (raw.includes('bluetooth') || raw.includes('connect'))) {
      planTitle = 'Driving Assistant Mode';
      trigger = {
        triggerId: `trig_bt_${Date.now()}`,
        type: TriggerType.BLUETOOTH_STATE,
        parameters: { deviceClass: 'car', deviceName: 'Tesla' },
        enabled: true,
      };
      conditions.push({
        id: 'cond_bt_car',
        field: 'bluetooth_connected_car',
        operator: 'IS_TRUE',
        value: true,
      });

      // Actions: Navigation
      if (raw.includes('maps') || raw.includes('navigat')) {
        actions.push({
          actionId: `act_maps_${Date.now()}_1`,
          actionType: ActionType.APP_ACTION,
          title: 'Launch Google Maps',
          parameters: { packageName: 'com.google.android.apps.maps', appName: 'Google Maps' },
          timeout: 8000,
          retryCount: 2,
          requiredPermissions: [],
          executionState: ExecutionState.IDLE,
        });
        verification.push('Google Maps in foreground');
      }

      // Actions: Music / Media
      if (raw.includes('music') || raw.includes('spotify') || raw.includes('song') || raw.includes('play')) {
        actions.push({
          actionId: `act_media_${Date.now()}_2`,
          actionType: ActionType.APP_ACTION,
          title: 'Launch Spotify',
          parameters: { packageName: 'com.spotify.music', appName: 'Spotify' },
          timeout: 8000,
          retryCount: 1,
          requiredPermissions: [],
          executionState: ExecutionState.IDLE,
        });
        actions.push({
          actionId: `act_play_${Date.now()}_3`,
          actionType: ActionType.MEDIA_ACTION,
          title: 'Start Music Playback',
          parameters: { command: 'play' },
          timeout: 5000,
          retryCount: 1,
          requiredPermissions: [],
          executionState: ExecutionState.IDLE,
        });
        verification.push('Spotify playback active');
      }

      // Actions: Volume
      if (raw.includes('volume')) {
        actions.push({
          actionId: `act_vol_${Date.now()}_4`,
          actionType: ActionType.MEDIA_ACTION,
          title: 'Set Media Volume to 80%',
          parameters: { command: 'set_volume', volumePercent: 80 },
          timeout: 4000,
          retryCount: 1,
          requiredPermissions: [],
          executionState: ExecutionState.IDLE,
        });
        verification.push('Media volume set to 80%');
      }
    }
    // 2. Detect Morning / Time Intent
    else if (raw.includes('morning') || raw.includes('07:00') || raw.includes('7 am') || raw.includes('wake up')) {
      planTitle = 'Morning Routine';
      trigger = {
        triggerId: `trig_time_0700`,
        type: TriggerType.TIME,
        parameters: { timeString: '07:00' },
        enabled: true,
      };
      actions.push({
        actionId: `act_vol_${Date.now()}_1`,
        actionType: ActionType.SYSTEM_ACTION,
        title: 'Adjust Audio Volume (50%)',
        parameters: { streamType: 'media', volumePercent: 50 },
        timeout: 4000,
        retryCount: 1,
        requiredPermissions: [],
        executionState: ExecutionState.IDLE,
      });
      actions.push({
        actionId: `act_app_${Date.now()}_2`,
        actionType: ActionType.APP_ACTION,
        title: 'Launch Calendar',
        parameters: { packageName: 'com.google.android.calendar', appName: 'Google Calendar' },
        timeout: 8000,
        retryCount: 2,
        requiredPermissions: [],
        executionState: ExecutionState.IDLE,
      });
      verification.push('Volume set to 50%', 'Calendar in foreground');
    }
    // 3. Detect Media Command (e.g. "pause music", "next song", "set media volume to 50 percent")
    else if (raw.includes('pause music') || raw.includes('stop music')) {
      planTitle = 'Media Pause';
      actions.push({
        actionId: `act_media_pause_${Date.now()}`,
        actionType: ActionType.MEDIA_ACTION,
        title: 'Pause Music',
        parameters: { command: 'pause' },
        timeout: 4000,
        retryCount: 1,
        requiredPermissions: [],
        executionState: ExecutionState.IDLE,
      });
      verification.push('Playback paused');
    } else if (raw.includes('next song') || raw.includes('skip song')) {
      planTitle = 'Skip Track';
      actions.push({
        actionId: `act_media_next_${Date.now()}`,
        actionType: ActionType.MEDIA_ACTION,
        title: 'Next Track',
        parameters: { command: 'next' },
        timeout: 4000,
        retryCount: 1,
        requiredPermissions: [],
        executionState: ExecutionState.IDLE,
      });
      verification.push('Track changed');
    } else if (raw.includes('volume')) {
      const match = raw.match(/(\d+)\s*(percent|%)?/);
      const vol = match ? Math.min(100, Math.max(0, parseInt(match[1]))) : 50;
      planTitle = `Set Volume ${vol}%`;
      actions.push({
        actionId: `act_media_vol_${Date.now()}`,
        actionType: ActionType.MEDIA_ACTION,
        title: `Set Volume to ${vol}%`,
        parameters: { command: 'set_volume', volumePercent: vol },
        timeout: 4000,
        retryCount: 1,
        requiredPermissions: [],
        executionState: ExecutionState.IDLE,
      });
      verification.push(`Volume set to ${vol}%`);
    }
    // 4. Communication actions ("call John", "message Alice")
    else if (raw.includes('call ')) {
      const contactName = raw.replace(/^.*call\s+/i, '').trim();
      planTitle = `Call ${contactName}`;
      actions.push({
        actionId: `act_call_${Date.now()}`,
        actionType: ActionType.COMMUNICATION_ACTION,
        title: `Call ${contactName}`,
        parameters: { operation: 'call', contactName },
        timeout: 6000,
        retryCount: 1,
        requiredPermissions: ['android.permission.CALL_PHONE'],
        executionState: ExecutionState.IDLE,
      });
      verification.push('Call initiated');
    }
    // 5. Fallback generic app launch
    else {
      planTitle = 'Launch Requested App';
      const appName = raw.replace(/(open|launch|start)\s+/i, '').trim() || 'App';
      actions.push({
        actionId: `act_app_${Date.now()}`,
        actionType: ActionType.APP_ACTION,
        title: `Launch ${appName}`,
        parameters: { appName },
        timeout: 8000,
        retryCount: 2,
        requiredPermissions: [],
        executionState: ExecutionState.IDLE,
      });
      verification.push(`${appName} in foreground`);
    }

    // Strict Schema Construction
    const schema: StructuredPlanSchema = {
      automation: planTitle,
      trigger,
      conditions,
      actions,
      verification,
      confirmation_required: false,
      timeout_ms: 30000,
      max_retries: 2,
    };

    // Safety validation
    const safetyCheck = SafetyValidator.validatePlanSafety(actions);
    schema.confirmation_required = safetyCheck.requiresUserConfirmation;

    // Reject malformed schema
    if (schema.actions.length === 0) {
      return {
        valid: false,
        errors: ['Plan contains zero deterministic actions.'],
        rejectionReason: 'EMPTY_ACTION_LIST',
      };
    }

    const definition: AutomationDefinition = {
      id: `auto_nl_${Date.now()}`,
      name: schema.automation,
      description: `Formulated from natural language: "${prompt}"`,
      trigger: schema.trigger,
      conditions: schema.conditions,
      actions: schema.actions,
      verificationRules: schema.verification,
      confirmationPolicy: schema.confirmation_required ? 'always' : 'on_high_risk',
      riskLevel: safetyCheck.riskLevel,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      executionCount: 0,
      timeoutMs: schema.timeout_ms,
      maxRetries: schema.max_retries,
    };

    return {
      valid: true,
      plan: definition,
      schema,
      errors: [],
    };
  }
}
