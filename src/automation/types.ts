/**
 * Core Automation Action Types and State Machine Definitions
 * Advanced Android Automation Module — Part 1
 */

export enum ActionType {
  APP_ACTION = 'APP_ACTION',
  UI_ACTION = 'UI_ACTION',
  GESTURE_ACTION = 'GESTURE_ACTION',
  TEXT_ACTION = 'TEXT_ACTION',
  MEDIA_ACTION = 'MEDIA_ACTION',
  SYSTEM_ACTION = 'SYSTEM_ACTION',
  COMMUNICATION_ACTION = 'COMMUNICATION_ACTION',
  NOTIFICATION_ACTION = 'NOTIFICATION_ACTION',
  DELAY_ACTION = 'DELAY_ACTION',
  CONDITION_ACTION = 'CONDITION_ACTION',
  AUTOMATION_CHAIN = 'AUTOMATION_CHAIN',
}

export enum RiskLevel {
  LOW_RISK = 'LOW_RISK',
  MEDIUM_RISK = 'MEDIUM_RISK',
  HIGH_RISK = 'HIGH_RISK',
}

export enum TriggerType {
  TIME = 'TIME',
  DATE = 'DATE',
  SCHEDULED_EVENT = 'SCHEDULED_EVENT',
  BLUETOOTH_STATE = 'BLUETOOTH_STATE',
  NETWORK_STATE = 'NETWORK_STATE',
  CHARGING_STATE = 'CHARGING_STATE',
  BATTERY_LEVEL = 'BATTERY_LEVEL',
  NOTIFICATION_ARRIVED = 'NOTIFICATION_ARRIVED',
  APP_EVENT = 'APP_EVENT',
  BOOT_COMPLETED = 'BOOT_COMPLETED',
}

export type RuleOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'BETWEEN'
  | 'CONTAINS'
  | 'IS_TRUE'
  | 'IS_FALSE';

export type LogicalOperator = 'AND' | 'OR' | 'NOT';

export interface RuleCondition {
  id: string;
  field: string; // e.g., 'device.bluetooth.connected', 'device.battery.level', 'time.currentHour'
  operator: RuleOperator;
  value: any;
  secondaryValue?: any; // For BETWEEN operator (e.g. min/max or startTime/endTime)
}

export interface TriggerConfig {
  triggerId: string;
  type: TriggerType;
  parameters: Record<string, any>;
  conditions?: RuleCondition[];
  enabled: boolean;
  lastExecution?: number;
  executionResult?: string;
}

export interface AutomationStep {
  stepId: string;
  title: string;
  preconditions?: RuleCondition[];
  action: Action;
  expectedVerification: string;
  timeoutMs: number;
  failureHandling: 'abort' | 'continue' | 'retry' | 'fallback';
  fallbackAction?: Action;
}

export interface AutomationDefinition {
  id: string;
  name: string;
  description: string;
  trigger: TriggerConfig;
  conditions: RuleCondition[];
  actions: Action[];
  steps?: AutomationStep[];
  verificationRules: string[];
  confirmationPolicy: 'always' | 'on_high_risk' | 'never';
  riskLevel: RiskLevel;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
  lastExecution?: number;
  executionCount?: number;
  lastResult?: 'success' | 'failure' | 'cancelled';
  timeoutMs?: number;
  maxRetries?: number;
}

export interface DeviceStateSnapshot {
  battery: {
    level: number;
    isCharging: boolean;
    chargeSource: 'ac' | 'usb' | 'wireless' | 'none';
  };
  network: {
    isConnected: boolean;
    type: 'wifi' | 'cellular' | 'none';
    wifiSsid?: string;
    signalStrengthPercent: number;
  };
  bluetooth: {
    isEnabled: boolean;
    connectedDevices: Array<{
      id: string;
      name: string;
      address: string;
      deviceClass: 'car' | 'audio' | 'computer' | 'phone' | 'other';
    }>;
  };
  media: {
    isPlaying: boolean;
    trackTitle: string;
    artist: string;
    volumePercent: number;
    isMuted: boolean;
    activeApp?: string;
  };
  time: {
    currentHour: number;
    currentMinute: number;
    dayOfWeek: number; // 0 = Sunday, 6 = Saturday
    timeString: string; // e.g. "08:30"
    dateString: string; // e.g. "2026-09-09"
  };
  foregroundApp?: {
    packageName: string;
    appName: string;
  };
  lastNotification?: {
    id: string;
    packageName: string;
    appName: string;
    title: string;
    text: string;
    timestamp: number;
  };
}

export interface SchedulerJob {
  jobId: string;
  automationId: string;
  automationName: string;
  scheduleType: 'one_time' | 'recurring_interval' | 'daily' | 'weekly';
  targetTimestamp?: number;
  intervalMinutes?: number;
  targetHour?: number;
  targetMinute?: number;
  targetDays?: number[]; // [1, 2, 3, 4, 5] for Mon-Fri
  enabled: boolean;
  nextRunTimestamp: number;
  lastRunTimestamp?: number;
  status: 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
}

export interface AutomationLogEntry {
  id: string;
  automationId?: string;
  automationName: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  failureReason?: string;
  finalStatus: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REJECTED';
  stepDetails: Array<{
    actionTitle: string;
    status: 'success' | 'failed' | 'skipped' | 'retried';
    durationMs: number;
    error?: string;
  }>;
}

export enum ExecutionState {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING',
  VALIDATING = 'VALIDATING',
  WAITING_PERMISSION = 'WAITING_PERMISSION',
  WAITING_CONFIRMATION = 'WAITING_CONFIRMATION',
  EXECUTING = 'EXECUTING',
  VERIFYING = 'VERIFYING',
  RETRYING = 'RETRYING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  TIMEOUT = 'TIMEOUT',
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: Record<string, any>;
  executionTimeMs: number;
}

export interface VerificationResult {
  verified: boolean;
  observedState: string;
  failureReason?: string;
}

export interface UIElementQuery {
  resourceId?: string;
  contentDescription?: string;
  text?: string;
  isClickable?: boolean;
  isEditable?: boolean;
  structuralIndex?: number;
  matchType?: 'resource_id' | 'content_desc' | 'exact_text' | 'normalized_text' | 'partial_text' | 'structural';
}

export interface Action {
  actionId: string;
  actionType: ActionType;
  title: string;
  parameters: Record<string, any>;
  timeout: number; // in milliseconds, default 10000
  retryCount: number; // max retries on failure, default 2
  retriesAttempted?: number;
  requiredPermissions: string[];
  executionState: ExecutionState;
  result?: ActionResult;
  error?: string;
  verificationResult?: VerificationResult;
  priority?: number; // Higher number = higher priority
}

export interface AccessibilityNodeInfo {
  id: string;
  resourceId?: string;
  contentDescription?: string;
  text?: string;
  className?: string;
  packageName?: string;
  clickable: boolean;
  longClickable?: boolean;
  editable: boolean;
  enabled: boolean;
  scrollable?: boolean;
  bounds: { x: number; y: number; width: number; height: number };
  children?: AccessibilityNodeInfo[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedAction?: Action;
}

export interface AutomationPlan {
  planId: string;
  title: string;
  description?: string;
  actions: Action[];
  createdAt: number;
}
