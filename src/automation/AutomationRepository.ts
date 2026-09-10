/**
 * AutomationRepository
 * Storage and memory management for reusable multi-step automations.
 * Seeds standard presets: Driving Mode, Morning Routine, Work Mode, Study Mode, Night Mode.
 * Supports: save, load, enable, disable, run, delete, duplicate.
 */

import {
  Action,
  ActionType,
  AutomationDefinition,
  ExecutionState,
  RiskLevel,
  TriggerType,
} from './types';

const STORAGE_KEY = 'nova_automation_definitions_v2';

export class AutomationRepository {
  private static instance: AutomationRepository;
  private automations: Map<string, AutomationDefinition> = new Map();

  private constructor() {
    this.loadFromStorage();
    if (this.automations.size === 0) {
      this.seedDefaultAutomations();
    }
  }

  public static getInstance(): AutomationRepository {
    if (!AutomationRepository.instance) {
      AutomationRepository.instance = new AutomationRepository();
    }
    return AutomationRepository.instance;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AutomationDefinition[] = JSON.parse(stored);
        parsed.forEach((auto) => this.automations.set(auto.id, auto));
      }
    } catch (e) {
      console.error('Failed to load automations from storage', e);
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      const list = Array.from(this.automations.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save automations to storage', e);
    }
  }

  private seedDefaultAutomations(): void {
    const defaults: AutomationDefinition[] = [
      {
        id: 'auto_driving_mode',
        name: 'Driving Mode',
        description: 'Auto-launches navigation and resumes music playback with safe highway volume when connected to Car Bluetooth.',
        trigger: {
          triggerId: 'trig_bt_car',
          type: TriggerType.BLUETOOTH_STATE,
          parameters: { deviceClass: 'car', deviceName: 'Tesla' },
          enabled: true,
        },
        conditions: [
          {
            id: 'cond_bt_connected',
            field: 'bluetooth_connected_car',
            operator: 'IS_TRUE',
            value: true,
          },
        ],
        actions: [
          {
            actionId: 'act_launch_maps',
            actionType: ActionType.APP_ACTION,
            title: '1. Launch Google Maps Navigation',
            parameters: { packageName: 'com.google.android.apps.maps', appName: 'Google Maps' },
            timeout: 8000,
            retryCount: 2,
            requiredPermissions: [],
            executionState: ExecutionState.IDLE,
          },
          {
            actionId: 'act_launch_media',
            actionType: ActionType.APP_ACTION,
            title: '2. Open Spotify Player',
            parameters: { packageName: 'com.spotify.music', appName: 'Spotify' },
            timeout: 8000,
            retryCount: 1,
            requiredPermissions: [],
            executionState: ExecutionState.IDLE,
          },
          {
            actionId: 'act_start_playback',
            actionType: ActionType.MEDIA_ACTION,
            title: '3. Start Audio Playback',
            parameters: { command: 'play' },
            timeout: 5000,
            retryCount: 2,
            requiredPermissions: [],
            executionState: ExecutionState.IDLE,
          },
          {
            actionId: 'act_set_vol',
            actionType: ActionType.MEDIA_ACTION,
            title: '4. Set Driving Volume to 80%',
            parameters: { command: 'set_volume', volumePercent: 80 },
            timeout: 5000,
            retryCount: 1,
            requiredPermissions: [],
            executionState: ExecutionState.IDLE,
          },
        ],
        verificationRules: [
          'Google Maps in foreground',
          'Media playback state is ACTIVE',
          'Media volume adjusted to 80%',
        ],
        confirmationPolicy: 'on_high_risk',
        riskLevel: RiskLevel.LOW_RISK,
        enabled: true,
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now() - 86400000 * 3,
        executionCount: 8,
        lastResult: 'success',
        lastExecution: Date.now() - 3600000 * 4,
      },
      {
        id: 'auto_morning_routine',
        name: 'Morning Routine',
        description: 'Fires daily at 07:00 to adjust audio volume, read morning schedule, and launch daily briefing news.',
        trigger: {
          triggerId: 'trig_daily_0700',
          type: TriggerType.TIME,
          parameters: { timeString: '07:00' },
          enabled: true,
        },
        conditions: [],
        actions: [
          {
            actionId: 'act_morning_vol',
            actionType: ActionType.SYSTEM_ACTION,
            title: '1. Set Gentle Morning Volume (50%)',
            parameters: { streamType: 'media', volumePercent: 50 },
            timeout: 5000,
            retryCount: 1,
            requiredPermissions: [],
            executionState: ExecutionState.IDLE,
          },
          {
            actionId: 'act_launch_calendar',
            actionType: ActionType.APP_ACTION,
            title: '2. Launch Google Calendar',
            parameters: { packageName: 'com.google.android.calendar', appName: 'Calendar' },
            timeout: 8000,
            retryCount: 2,
            requiredPermissions: [],
            executionState: ExecutionState.IDLE,
          },
          {
            actionId: 'act_morning_music',
            actionType: ActionType.MEDIA_ACTION,
            title: '3. Resume Morning Focus Playlist',
            parameters: { command: 'play' },
            timeout: 5000,
            retryCount: 1,
            requiredPermissions: [],
            executionState: ExecutionState.IDLE,
          },
        ],
        verificationRules: ['Calendar active', 'Media playback started'],
        confirmationPolicy: 'never',
        riskLevel: RiskLevel.LOW_RISK,
        enabled: true,
        createdAt: Date.now() - 86400000 * 5,
        updatedAt: Date.now() - 86400000 * 5,
        executionCount: 14,
        lastResult: 'success',
        lastExecution: Date.now() - 3600000 * 18,
      },
      {
        id: 'auto_work_mode',
        name: 'Work Mode',
        description: 'Mutes notifications and media, launches Slack, and opens work calendar when connecting to Office Wi-Fi.',
        trigger: {
          triggerId: 'trig_office_wifi',
          type: TriggerType.NETWORK_STATE,
          parameters: { type: 'wifi', ssid: 'Office' },
          enabled: true,
        },
        conditions: [
          {
            id: 'cond_office_wifi',
            field: 'network.wifiSsid',
            operator: 'CONTAINS',
            value: 'Office',
          },
        ],
        actions: [
          {
            actionId: 'act_mute_vol',
            actionType: ActionType.SYSTEM_ACTION,
            title: '1. Silence Ring & Notification Audio',
            parameters: { streamType: 'ring', volumePercent: 0 },
            timeout: 5000,
            retryCount: 1,
            requiredPermissions: [],
            executionState: ExecutionState.IDLE,
          },
          {
            actionId: 'act_open_slack',
            actionType: ActionType.APP_ACTION,
            title: '2. Open Slack Workspace',
            parameters: { packageName: 'com.Slack', appName: 'Slack' },
            timeout: 8000,
            retryCount: 2,
            requiredPermissions: [],
            executionState: ExecutionState.IDLE,
          },
        ],
        verificationRules: ['Volume silenced', 'Slack opened'],
        confirmationPolicy: 'never',
        riskLevel: RiskLevel.LOW_RISK,
        enabled: true,
        createdAt: Date.now() - 86400000 * 7,
        updatedAt: Date.now() - 86400000 * 7,
        executionCount: 5,
        lastResult: 'success',
      },
      {
        id: 'auto_study_mode',
        name: 'Study Mode',
        description: 'Suppresses background distractions, opens notes scratchpad, and sets a 25-minute Pomodoro study block.',
        trigger: {
          triggerId: 'trig_study_manual',
          type: TriggerType.SCHEDULED_EVENT,
          parameters: { label: 'Manual or Focus' },
          enabled: true,
        },
        conditions: [
          {
            id: 'cond_battery_adequate',
            field: 'battery.level',
            operator: 'GREATER_THAN',
            value: 20,
          },
        ],
        actions: [
          {
            actionId: 'act_notes_open',
            actionType: ActionType.APP_ACTION,
            title: '1. Launch Google Keep Notes',
            parameters: { packageName: 'com.google.android.keep', appName: 'Keep Notes' },
            timeout: 8000,
            retryCount: 2,
            requiredPermissions: [],
            executionState: ExecutionState.IDLE,
          },
          {
            actionId: 'act_study_delay',
            actionType: ActionType.DELAY_ACTION,
            title: '2. Initialize Focus Timer Block',
            parameters: { durationMs: 1500 },
            timeout: 5000,
            retryCount: 0,
            requiredPermissions: [],
            executionState: ExecutionState.IDLE,
          },
        ],
        verificationRules: ['Keep Notes launched'],
        confirmationPolicy: 'never',
        riskLevel: RiskLevel.LOW_RISK,
        enabled: true,
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
        executionCount: 3,
        lastResult: 'success',
      },
      {
        id: 'auto_night_mode',
        name: 'Night Mode',
        description: 'Automatically dims brightness to 10%, sets media volume to 0%, and verifies charging state when connected to charger after 23:00.',
        trigger: {
          triggerId: 'trig_charging_night',
          type: TriggerType.CHARGING_STATE,
          parameters: { isCharging: true },
          enabled: true,
        },
        conditions: [
          {
            id: 'cond_is_charging',
            field: 'battery.isCharging',
            operator: 'IS_TRUE',
            value: true,
          },
        ],
        actions: [
          {
            actionId: 'act_dim_display',
            actionType: ActionType.SYSTEM_ACTION,
            title: '1. Dim Screen Brightness to 10%',
            parameters: { operation: 'brightness', brightnessPercent: 10 },
            timeout: 5000,
            retryCount: 1,
            requiredPermissions: [],
            executionState: ExecutionState.IDLE,
          },
          {
            actionId: 'act_silence_all',
            actionType: ActionType.SYSTEM_ACTION,
            title: '2. Mute All System Media Audio',
            parameters: { streamType: 'media', volumePercent: 0 },
            timeout: 5000,
            retryCount: 1,
            requiredPermissions: [],
            executionState: ExecutionState.IDLE,
          },
        ],
        verificationRules: ['Brightness <= 10%', 'Media Volume 0%'],
        confirmationPolicy: 'never',
        riskLevel: RiskLevel.LOW_RISK,
        enabled: true,
        createdAt: Date.now() - 86400000 * 4,
        updatedAt: Date.now() - 86400000 * 4,
        executionCount: 11,
        lastResult: 'success',
      },
    ];

    defaults.forEach((d) => this.automations.set(d.id, d));
    this.persist();
  }

  public getAll(): AutomationDefinition[] {
    return Array.from(this.automations.values());
  }

  public getById(id: string): AutomationDefinition | undefined {
    return this.automations.get(id);
  }

  public save(automation: AutomationDefinition): void {
    automation.updatedAt = Date.now();
    this.automations.set(automation.id, { ...automation });
    this.persist();
  }

  public delete(id: string): boolean {
    const deleted = this.automations.delete(id);
    if (deleted) this.persist();
    return deleted;
  }

  public setEnabled(id: string, enabled: boolean): boolean {
    const auto = this.automations.get(id);
    if (!auto) return false;
    auto.enabled = enabled;
    auto.updatedAt = Date.now();
    this.automations.set(id, auto);
    this.persist();
    return true;
  }

  public recordExecution(id: string, result: 'success' | 'failure' | 'cancelled'): void {
    const auto = this.automations.get(id);
    if (auto) {
      auto.lastExecution = Date.now();
      auto.executionCount = (auto.executionCount || 0) + 1;
      auto.lastResult = result;
      this.automations.set(id, auto);
      this.persist();
    }
  }

  public duplicate(id: string): AutomationDefinition | null {
    const original = this.automations.get(id);
    if (!original) return null;

    const copy: AutomationDefinition = {
      ...JSON.parse(JSON.stringify(original)),
      id: `auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${original.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      executionCount: 0,
      lastExecution: undefined,
      lastResult: undefined,
    };

    this.automations.set(copy.id, copy);
    this.persist();
    return copy;
  }
}

export const automationRepository = AutomationRepository.getInstance();
