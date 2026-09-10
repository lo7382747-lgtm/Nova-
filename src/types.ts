export type NovaState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type ScreenType = 'home' | 'chat' | 'automation' | 'activity' | 'settings' | 'voice_enrollment';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  isVoice?: boolean;
  functionCall?: FunctionCallData;
  activityId?: string;
  statusText?: string;
}

export interface FunctionCallData {
  name: string;
  args: {
    contactName?: string;
    message?: string;
    [key: string]: any;
  };
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  initials: string;
  avatarColor: string;
  label?: string;
}

export type ContactsPermissionStatus = 'prompt' | 'granted' | 'denied';

export type ActivityStatus = 'sent' | 'cancelled' | 'failed' | 'refused_unauthorized';

export type ActivityLogActionType =
  | 'whatsapp_message'
  | 'sms_message'
  | 'instagram_dm'
  | 'telegram_message'
  | 'phone_automation'
  | 'system_navigation'
  | 'call'
  | 'media'
  | 'system_setting'
  | 'screen_interaction'
  | 'open_app'
  | 'chained_automation'
  | 'call_or_media'
  | 'alarm_or_timer'
  | 'device_control'
  | 'screenshot'
  | 'unauthorized_attempt';

export type SensitiveActionType =
  | 'messaging'
  | 'phone_control'
  | 'calls'
  | 'alarms_timers'
  | 'unlock'
  | 'payments';

export interface VoiceprintEmbedding {
  vector: number[]; // 16-dimensional normalized acoustic frequency & cepstral embedding
  spectralCentroid: number;
  pitchEstimateHz: number;
  spectralRollOff: number;
  zeroCrossingRate: number;
  createdAt: number;
}

export interface TrustedVoicePermissions {
  messaging: boolean;
  phoneControl: boolean;
  calls: boolean;
  alarmsTimers: boolean;
  unlock: boolean;
  payments: boolean;
}

export interface EnrolledVoiceProfile {
  id: string;
  name: string;
  role: 'owner' | 'trusted_voice';
  enrolledAt: number;
  samplePhrasesCount: number;
  embedding: VoiceprintEmbedding;
  allowedPermissions?: TrustedVoicePermissions;
}

export interface SpeakerVerificationResult {
  isAuthorized: boolean;
  isOwner: boolean;
  isTrusted: boolean;
  speakerName: string;
  confidence: number;
  threshold: number;
  refusalReason?: string;
  timestamp: number;
  actionType: SensitiveActionType;
}

export interface ActivityLogItem {
  id: string;
  actionType: ActivityLogActionType;
  contactName?: string;
  contactPhone?: string;
  message?: string;
  status: ActivityStatus;
  timestamp: number;
  failureReason?: string;
  intentData?: {
    action: string;
    packageName: string;
    jid?: string;
    url?: string;
  };
  automationTrace?: {
    appName?: string;
    actionSummary?: string;
    steps?: { title: string; status: 'completed' | 'failed' | 'skipped'; detail?: string }[];
  };
}

export type MessagingApp = 'whatsapp' | 'sms' | 'instagram' | 'telegram';

export interface UniversalMessageConfirmationState {
  isOpen: boolean;
  app: MessagingApp;
  contactName: string;
  recipient?: string;
  message: string;
  phone?: string;
  resolvedContact?: Contact;
  matchedContact?: Contact;
  candidateMatches?: Contact[];
  mode: 'confirm' | 'pick_contact' | 'no_contact';
  isEditingMessage?: boolean;
}

export interface WhatsAppConfirmationState {
  isOpen: boolean;
  contactName: string;
  message: string;
  phone?: string;
  resolvedContact?: Contact;
  matchedContact?: Contact;
  candidateMatches?: Contact[];
  mode: 'confirm' | 'pick_contact' | 'no_contact';
  isEditingMessage?: boolean;
}

export type AvatarVisualMode = 'avatar' | 'orb';
export type OverlayPermissionStatus = 'prompt' | 'granted' | 'denied';
export type AccessibilityPermissionStatus = 'prompt' | 'granted' | 'denied';
export type VoicePersona = 'natural_warm' | 'crystal_clear' | 'indian_bilingual' | 'calm_relaxed';

export interface SensitiveAppItem {
  id: string;
  name: string;
  packageName: string;
  category: 'banking' | 'crypto' | 'payment' | 'security';
  description: string;
}

export interface SystemSettingsState {
  wifi: boolean;
  bluetooth: boolean;
  flashlight: boolean;
  volume: number; // 0 - 100
  brightness: number; // 0 - 100
  dnd: boolean;
  hotspot: boolean;
  batterySaver: boolean;
  airplaneMode: boolean;
  autoRotate: boolean;
  location: boolean;
  ringerMode: 'normal' | 'vibrate' | 'silent';
  screenTimeoutSec?: number;
  recentScreenshot?: {
    id: string;
    timestamp: number;
    appName: string;
  };
}

export type ForegroundAppType =
  | 'nova'
  | 'home'
  | 'chrome'
  | 'instagram'
  | 'messages'
  | 'phone_call'
  | 'spotify'
  | 'camera'
  | 'quick_settings'
  | 'denied_sensitive';

export type AutomationActionType =
  | 'open_app'
  | 'close_app'
  | 'switch_app'
  | 'go_home'
  | 'go_back'
  | 'open_recents'
  | 'open_notifications'
  | 'open_quick_settings'
  | 'lock_screen'
  | 'scroll'
  | 'tap'
  | 'type'
  | 'long_press'
  | 'double_tap'
  | 'swipe'
  | 'send_message'
  | 'make_call'
  | 'end_call'
  | 'play_media'
  | 'pause_media'
  | 'toggle_setting'
  | 'inspect_screen'
  | 'set_alarm'
  | 'set_timer'
  | 'take_screenshot'
  | 'device_control';

export interface AutomationStep {
  id: string;
  title: string;
  actionType: AutomationActionType;
  appName?: string;
  description?: string;
  params?: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  latencyMs?: number;
}

export interface AutomationRoutine {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'daily' | 'social' | 'system' | 'productivity' | 'custom';
  voiceTriggers: string[];
  steps: AutomationStep[];
  isCustom?: boolean;
}

export interface AutomationExecutionState {
  isActive: boolean;
  title: string;
  steps: AutomationStep[];
  currentStepIndex: number;
  status: 'idle' | 'running' | 'completed' | 'aborted' | 'error';
  targetApp?: string;
  startTime?: number;
}

export type RecordAudioPermissionStatus = 'prompt' | 'granted' | 'denied';

export interface PersistentNotificationData {
  id: string;
  title: string;
  subtitle: string;
  priority: 'LOW' | 'DEFAULT' | 'HIGH';
  isOngoing: boolean;
  timestamp: number;
}

export interface NovaAssistantServiceState {
  isServiceRunning: boolean;
  isListening: boolean;
  isPassive: boolean;
  vadState: 'silent' | 'noise_filtered' | 'speech_active';
  lastNoiseLevel: number; // 0 - 100 dB
  batteryLevel: number; // 0 - 100
  isCharging: boolean;
  isBatteryPaused: boolean;
  isScreenLocked: boolean;
  isAppMinimized: boolean;
  serviceUptimeSeconds: number;
  notification: PersistentNotificationData;
  lastEvent?: {
    type: string;
    message: string;
    timestamp: number;
  };
}

export interface UserSettings {
  voiceRepliesEnabled: boolean;
  autoListenEnabled: boolean;
  customApiKey?: string;
  preferredVoice: string;
  voicePersona: VoicePersona;
  voiceRate: number;
  voicePitch: number;
  speechClarityEnhancer: boolean;
  voiceLanguage: 'auto' | 'en' | 'hi';
  contactsPermission: ContactsPermissionStatus;
  whatsAppInstalled: boolean;
  avatarVisualMode: AvatarVisualMode;
  floatingBubbleEnabled: boolean;
  overlayPermission: OverlayPermissionStatus;
  hardwareCapability?: {
    isLowEnd: boolean;
    gpuRenderer: string;
    recommendation: AvatarVisualMode;
  };
  turboMode: boolean;
  useCloudTts: boolean;
  // Full Phone Control & Automation settings
  fullPhoneControlEnabled: boolean;
  accessibilityPermission: AccessibilityPermissionStatus;
  sensitiveAppsDenylist: SensitiveAppItem[];
  visionFallbackEnabled: boolean;
  // Persistent Always-Listening Mode
  persistentListeningEnabled: boolean;
  recordAudioPermission: RecordAudioPermissionStatus;
  batteryLevel: number;
  isCharging: boolean;
  // Voice-Based Owner Recognition
  ownerRecognitionEnabled: boolean;
  ownerVoiceprint?: EnrolledVoiceProfile;
  trustedVoices?: EnrolledVoiceProfile[];
  voiceVerificationThreshold?: number;
  activeSpeakerSimulated?: 'owner' | 'guest' | 'trusted';
}

export interface KotlinScaffoldItem {
  id: string;
  title: string;
  filePath: string;
  language: string;
  description: string;
  code: string;
}
