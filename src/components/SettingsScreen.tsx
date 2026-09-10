import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Volume2,
  Key,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Code2,
  Copy,
  Sparkles,
  Info,
  Layers,
  MessageCircle,
  Users,
  Phone,
  ShieldCheck,
  RotateCcw,
  UserCheck,
  CircleDot,
  Cpu,
  Minimize2,
  Play,
  Square,
  Sparkle,
  Sliders,
  Languages,
  CheckCircle2,
  Zap,
  MousePointerClick,
  Lock,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { UserSettings, Contact, AvatarVisualMode, VoicePersona, SensitiveAppItem } from '../types';
import { KOTLIN_SCAFFOLD_FILES } from '../data/kotlinScaffold';
import { detectDeviceCapability, DeviceCapability } from '../services/hardwareDetector';
import { AVATAR_CONFIG } from '../config/avatarConfig';
import { naturalVoiceService } from '../services/naturalVoiceService';
import { AlwaysListeningCard } from './AlwaysListeningCard';
import { OwnerRecognitionCard } from './OwnerRecognitionCard';

interface SettingsScreenProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onClearHistory: () => void;
  onNavigateBack: () => void;
  totalMessagesCount: number;
  contacts?: Contact[];
  onResetContacts?: () => void;
  onRequestOverlayPermission?: () => void;
  onRequestAccessibilityPermission?: () => void;
  onRequestRecordAudioPermission?: () => void;
  onExecuteSimulatedCommand?: (command: string) => void;
  onNavigateToVoiceEnrollment?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onClearHistory,
  onNavigateBack,
  totalMessagesCount,
  contacts = [],
  onResetContacts,
  onRequestOverlayPermission,
  onRequestAccessibilityPermission,
  onRequestRecordAudioPermission,
  onExecuteSimulatedCommand,
  onNavigateToVoiceEnrollment,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(settings.customApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedScaffoldId, setSelectedScaffoldId] = useState<string | null>(null);
  const [copiedScaffold, setCopiedScaffold] = useState(false);
  const [showContactsList, setShowContactsList] = useState(false);
  const [hardwareInfo, setHardwareInfo] = useState<DeviceCapability | null>(null);
  const [isPlayingVoiceSample, setIsPlayingVoiceSample] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isAddingSensitiveApp, setIsAddingSensitiveApp] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppPkg, setNewAppPkg] = useState('');

  const handleToggleFullPhoneControl = (enabled: boolean) => {
    if (enabled && settings.accessibilityPermission !== 'granted') {
      onRequestAccessibilityPermission?.();
    }
    onUpdateSettings({
      ...settings,
      fullPhoneControlEnabled: enabled,
      accessibilityPermission: enabled ? 'granted' : settings.accessibilityPermission,
    });
  };

  const handleToggleVisionFallback = (enabled: boolean) => {
    onUpdateSettings({
      ...settings,
      visionFallbackEnabled: enabled,
    });
  };

  const handleRemoveSensitiveApp = (id: string) => {
    const updated = (settings.sensitiveAppsDenylist || []).filter((a) => a.id !== id);
    onUpdateSettings({
      ...settings,
      sensitiveAppsDenylist: updated,
    });
  };

  const handleAddSensitiveApp = () => {
    if (!newAppName.trim() || !newAppPkg.trim()) return;
    const newItem: SensitiveAppItem = {
      id: `custom-${Date.now()}`,
      name: newAppName.trim(),
      packageName: newAppPkg.trim().toLowerCase(),
      category: 'payment',
      description: 'Custom user-denylisted app',
    };
    onUpdateSettings({
      ...settings,
      sensitiveAppsDenylist: [...(settings.sensitiveAppsDenylist || []), newItem],
    });
    setNewAppName('');
    setNewAppPkg('');
    setIsAddingSensitiveApp(false);
  };

  useEffect(() => {
    setHardwareInfo(detectDeviceCapability());
    naturalVoiceService.getVoicesAsync().then((v) => {
      setAvailableVoices(v);
    });
  }, []);

  const handleTestVoice = async () => {
    if (isPlayingVoiceSample) {
      naturalVoiceService.stop();
      setIsPlayingVoiceSample(false);
      return;
    }

    setIsPlayingVoiceSample(true);
    await naturalVoiceService.testVoiceSample(
      settings.voicePersona,
      settings.voiceRate,
      settings.voicePitch,
      () => setIsPlayingVoiceSample(true),
      () => setIsPlayingVoiceSample(false)
    );
  };

  const handleSaveApiKey = () => {
    onUpdateSettings({
      ...settings,
      customApiKey: apiKeyInput.trim(),
    });
    setSavedKeySuccess(true);
    setTimeout(() => setSavedKeySuccess(false), 2000);
  };

  const handleToggleVoice = (enabled: boolean) => {
    onUpdateSettings({
      ...settings,
      voiceRepliesEnabled: enabled,
    });
  };

  const handleToggleAutoListen = (enabled: boolean) => {
    onUpdateSettings({
      ...settings,
      autoListenEnabled: enabled,
    });
  };

  const handleToggleWhatsAppInstalled = (installed: boolean) => {
    onUpdateSettings({
      ...settings,
      whatsAppInstalled: installed,
    });
  };

  const handleSetContactsPermission = (status: 'granted' | 'prompt' | 'denied') => {
    onUpdateSettings({
      ...settings,
      contactsPermission: status,
    });
  };

  const handleToggleAvatarMode = (mode: AvatarVisualMode) => {
    onUpdateSettings({
      ...settings,
      avatarVisualMode: mode,
    });
  };

  const handleToggleFloatingBubble = (enabled: boolean) => {
    onUpdateSettings({
      ...settings,
      floatingBubbleEnabled: enabled,
    });
  };

  const selectedScaffoldFile = KOTLIN_SCAFFOLD_FILES.find((f) => f.id === selectedScaffoldId);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedScaffold(true);
    setTimeout(() => setCopiedScaffold(false), 2000);
  };

  return (
    <div
      id="settings-screen"
      className="flex-1 flex flex-col h-full bg-[#0A0A0A] relative overflow-hidden"
    >
      {/* Top App Bar */}
      <div className="h-14 px-4 bg-[#0F0F0F] border-b border-teal-900/30 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            id="settings-back-btn"
            onClick={onNavigateBack}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-teal-400 hover:bg-white/5 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white">Nova Settings</h2>
        </div>
        <span className="text-[10px] font-mono font-bold text-teal-400 bg-white/5 px-2 py-0.5 rounded-md border border-teal-900/30">
          v1.0.0
        </span>
      </div>

      {/* Settings Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Section 1: Voice Conversation Settings */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-500 flex items-center gap-1.5 px-1">
            <Volume2 className="w-3.5 h-3.5" />
            Voice & Audio
          </div>

          <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 space-y-4">
            {/* Turbo Fast Response Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="text-amber-400">⚡</span>
                  Turbo Fast Response (Fast Answers)
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Sub-second streaming answers via Gemini Flash-Lite with zero thinking delay
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="turbo-mode-toggle"
                  checked={settings.turboMode ?? true}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      turboMode: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-black/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Persistent Always-Listening Foreground Service Card */}
            <AlwaysListeningCard
              enabled={settings.persistentListeningEnabled}
              onToggleEnabled={(enabled) => {
                if (enabled && settings.recordAudioPermission !== 'granted') {
                  onRequestRecordAudioPermission?.();
                }
                onUpdateSettings({
                  ...settings,
                  persistentListeningEnabled: enabled,
                });
              }}
              onRequestRecordAudioPermission={onRequestRecordAudioPermission}
              onExecuteSimulatedCommand={onExecuteSimulatedCommand}
            />

            <div className="h-[1px] bg-white/5" />

            {/* Voice Replies Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Spoken Voice Replies</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Nova reads responses aloud when you speak or type
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="voice-toggle"
                  checked={settings.voiceRepliesEnabled}
                  onChange={(e) => handleToggleVoice(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-black/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Instant Voice vs Cloud Delay */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="text-teal-400">⚡</span>
                  Instant Zero-Lag Voice (<span className="font-mono text-teal-400">&lt;20ms</span>)
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {settings.useCloudTts
                    ? 'Cloud server TTS (higher latency, 2-4s wait)'
                    : 'Instant neural voice engine with immediate playback'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="instant-voice-toggle"
                  checked={!settings.useCloudTts}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      useCloudTts: !e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-black/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Auto Listen Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Hands-Free Follow-up</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Automatically listen again after Nova finishes speaking
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="auto-listen-toggle"
                  checked={settings.autoListenEnabled}
                  onChange={(e) => handleToggleAutoListen(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-black/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Natural Voice Persona Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkle className="w-3.5 h-3.5 text-teal-400" />
                    Natural Voice Persona
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Select natural vocal style and emotional resonance
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  {
                    id: 'natural_warm' as VoicePersona,
                    label: 'Natural Warm',
                    desc: 'Human cadence & soft warmth',
                    badge: 'Recommended',
                  },
                  {
                    id: 'crystal_clear' as VoicePersona,
                    label: 'Crystal Clear',
                    desc: 'High presence studio vocal',
                    badge: 'Studio EQ',
                  },
                  {
                    id: 'indian_bilingual' as VoicePersona,
                    label: 'Bilingual (Hindi/Eng)',
                    desc: 'Fluent Hindi & Indian English',
                    badge: 'Natural Accent',
                  },
                  {
                    id: 'calm_relaxed' as VoicePersona,
                    label: 'Calm & Relaxed',
                    desc: 'Serene, slower cadence',
                    badge: 'Peaceful',
                  },
                ].map((persona) => {
                  const isSelected = settings.voicePersona === persona.id;
                  return (
                    <button
                      key={persona.id}
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          voicePersona: persona.id,
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'bg-teal-500/10 border-teal-500/60 shadow-[0_0_12px_rgba(20,184,166,0.15)]'
                          : 'bg-black/30 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white">{persona.label}</div>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 leading-tight">{persona.desc}</div>
                      <div className="mt-1.5 inline-block text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-teal-300 font-mono">
                        {persona.badge}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Studio Clarity & Markdown Cleaner Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  Studio Clarity & Clean Speech
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Auto-removes markdown tags, code noise, and expands abbreviations
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="clarity-enhancer-toggle"
                  checked={settings.speechClarityEnhancer}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      speechClarityEnhancer: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-black/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Voice Pace & Pitch Sliders */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-teal-400" />
                  Voice Cadence (Speed):
                </span>
                <span className="font-mono text-teal-400 bg-teal-950/40 px-1.5 py-0.5 rounded text-[11px]">
                  {settings.voiceRate.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.02"
                value={settings.voiceRate}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    voiceRate: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-teal-400 bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Language Selection */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-teal-400" />
                  Language Detection
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Language routing for natural pronunciation
                </div>
              </div>
              <select
                value={settings.voiceLanguage}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    voiceLanguage: e.target.value as 'auto' | 'en' | 'hi',
                  })
                }
                className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-teal-300 focus:outline-none focus:border-teal-400"
              >
                <option value="auto">Auto (Hindi & English)</option>
                <option value="en">English (Neural)</option>
                <option value="hi">Hindi (हिन्दी)</option>
              </select>
            </div>

            {/* Live Voice Sample Tester */}
            <div className="pt-2">
              <button
                id="test-voice-sample-btn"
                onClick={handleTestVoice}
                className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                  isPlayingVoiceSample
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                    : 'bg-teal-500/15 border-teal-500/30 text-teal-300 hover:bg-teal-500/25 hover:border-teal-400'
                }`}
              >
                {isPlayingVoiceSample ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    Playing Natural Audio... (Click to Stop)
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Test Natural Voice (Play Sample)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section: WhatsApp & Contacts Module (Phase 2) */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-500 flex items-center gap-1.5 px-1">
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp & Contacts (Phase 2)
          </div>

          <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 space-y-4">
            {/* Contacts Permission Status */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Contacts Permission</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Required to look up recipient phone numbers
                </div>
              </div>
              <select
                value={settings.contactsPermission}
                onChange={(e) =>
                  handleSetContactsPermission(e.target.value as 'granted' | 'prompt' | 'denied')
                }
                className="bg-black/50 border border-white/10 text-xs font-bold uppercase tracking-wider rounded-xl px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-teal-500"
              >
                <option value="granted" className="bg-[#161616] text-white">Granted (Auto)</option>
                <option value="prompt" className="bg-[#161616] text-white">Ask Each Time</option>
                <option value="denied" className="bg-[#161616] text-white">Denied</option>
              </select>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* WhatsApp App Installed Simulation Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">WhatsApp App Installed</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Simulate whether `com.whatsapp` package is detected
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.whatsAppInstalled}
                  onChange={(e) => handleToggleWhatsAppInstalled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-black/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Device Contacts List toggle & viewer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowContactsList(!showContactsList)}
                  className="text-xs font-bold uppercase tracking-wider text-teal-400 hover:text-teal-300 flex items-center gap-1.5 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {showContactsList ? 'Hide Phone Contacts' : `View Device Contacts (${contacts.length})`}
                  </span>
                </button>
                {onResetContacts && (
                  <button
                    onClick={onResetContacts}
                    className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                    title="Reset sample contacts"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Contacts</span>
                  </button>
                )}
              </div>

              {showContactsList && (
                <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${contact.avatarColor} flex items-center justify-center text-white text-[10px] font-bold`}
                        >
                          {contact.initials}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{contact.name}</div>
                          <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-teal-400" />
                            <span>{contact.phone}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                        {contact.label || 'Mobile'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section: 3D Character Avatar & Graphics (Phase 3) */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-500 flex items-center gap-1.5 px-1">
            <UserCheck className="w-3.5 h-3.5" />
            3D Avatar & Graphics (Phase 3)
          </div>

          <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 space-y-4">
            {/* Visualizer Mode Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Visualizer Interface</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Choose between the 3D female avatar and the energetic Orb
                </div>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleToggleAvatarMode('avatar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    settings.avatarVisualMode === 'avatar'
                      ? 'bg-teal-500 text-black shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3 h-3" />
                  <span>3D Avatar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAvatarMode('orb')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    settings.avatarVisualMode === 'orb'
                      ? 'bg-teal-500 text-black shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <CircleDot className="w-3 h-3" />
                  <span>Orb</span>
                </button>
              </div>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Hardware capability detection status */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-teal-400" />
                  <span>Hardware & GPU Detection</span>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    hardwareInfo?.isLowEnd
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                      : 'bg-teal-950/60 text-teal-300 border border-teal-800/60'
                  }`}
                >
                  {hardwareInfo?.isLowEnd ? 'Low Power Fallback' : '60 FPS Hardware Ready'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono">
                {hardwareInfo?.gpuRenderer || 'Standard WebGL Accelerator'}
              </p>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                {hardwareInfo?.reason || 'Hardware acceleration detected for real-time 3D animation.'}
              </p>
            </div>

            {/* Swappable 3D Model file notice */}
            <div className="p-3 rounded-xl bg-teal-950/20 border border-teal-900/30 text-[11px] text-teal-300/90 leading-relaxed">
              <div className="font-bold text-teal-400 uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Single-Line Model Swap Architecture</span>
              </div>
              <p className="mt-1 text-gray-300">
                To substitute the 3D model, change <code className="text-teal-300 font-mono bg-white/5 px-1 py-0.5 rounded">modelUrl</code> in <code className="text-teal-300 font-mono bg-white/5 px-1 py-0.5 rounded">src/config/avatarConfig.ts</code>. (Per instructions, the user is consulted prior to selecting licensed assets).
              </p>
            </div>
          </div>
        </div>

        {/* Section: Floating Chat Head Bubble (Phase 3) */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-500 flex items-center gap-1.5 px-1">
            <Minimize2 className="w-3.5 h-3.5" />
            Floating Bubble (Chat Head)
          </div>

          <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 space-y-4">
            {/* Enable Floating Bubble */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Floating Assistant Bubble</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Keep Nova accessible over other apps when minimized
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.floatingBubbleEnabled}
                  onChange={(e) => handleToggleFloatingBubble(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-black/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Display Over Other Apps Special Permission */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Display Over Other Apps</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  SYSTEM_ALERT_WINDOW special access
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onRequestOverlayPermission) onRequestOverlayPermission();
                }}
                className="px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-900/40 text-teal-400 text-xs font-bold uppercase tracking-wider hover:bg-teal-500/20 transition-colors"
              >
                {settings.overlayPermission === 'granted' ? 'Granted ✓' : 'Configure'}
              </button>
            </div>

            {/* Floating Bubble Quick Gesture Guide */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-gray-400 space-y-1">
              <div className="font-bold text-white uppercase text-[10px] tracking-wider">
                Chat Head Gestures
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-gray-400 text-[10px]">
                <li><strong className="text-teal-300">Tap:</strong> Expands Nova full-screen.</li>
                <li><strong className="text-teal-300">Long Press:</strong> Starts mic listening directly from bubble.</li>
                <li><strong className="text-teal-300">Drag:</strong> Snaps to nearest edge on release.</li>
                <li><strong className="text-rose-300">Drag to bottom:</strong> Drops on trash zone to dismiss.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section: Full Phone Control & Complete Automation */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-400 flex items-center gap-1.5 px-1">
            <MousePointerClick className="w-3.5 h-3.5" />
            Full Phone Control &amp; Automation
          </div>

          <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 space-y-4">
            {/* Main Toggle: OFF by default */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Full Phone Control</span>
                  {settings.fullPhoneControlEnabled && (
                    <span className="text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/40 px-1.5 py-0.5 rounded font-mono">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 max-w-[240px]">
                  Allows Nova to tap, type, scroll, and chain multi-step voice automations across apps
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="full-phone-control-toggle"
                  checked={settings.fullPhoneControlEnabled}
                  onChange={(e) => handleToggleFullPhoneControl(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-black/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Accessibility Service Permission */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Accessibility Service</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Required to read UI element trees and dispatch touch gestures
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onRequestAccessibilityPermission?.();
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  settings.accessibilityPermission === 'granted'
                    ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                }`}
              >
                {settings.accessibilityPermission === 'granted' ? 'Granted ✓' : 'Grant Access'}
              </button>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Vision Fallback Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Vision Fallback (MediaProjection)</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5 max-w-[240px]">
                  Use screenshot vision when an app does not expose an Accessibility tree
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="vision-fallback-toggle"
                  checked={settings.visionFallbackEnabled}
                  onChange={(e) => handleToggleVisionFallback(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-black/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>

            <div className="h-[1px] bg-white/5" />

            {/* Sensitive Apps Denylist */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>Sensitive Apps Denylist</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Nova strictly refuses autonomous screen manipulation on these apps
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingSensitiveApp(!isAddingSensitiveApp)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-teal-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Add New App Form */}
              {isAddingSensitiveApp && (
                <div className="p-3 rounded-xl bg-black/60 border border-teal-500/30 space-y-2">
                  <div className="text-xs font-bold text-teal-300">Add Protected App</div>
                  <input
                    type="text"
                    placeholder="App Name (e.g., Robinhood)"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-400"
                  />
                  <input
                    type="text"
                    placeholder="Package (e.g., com.robinhood.android)"
                    value={newAppPkg}
                    onChange={(e) => setNewAppPkg(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-400"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingSensitiveApp(false)}
                      className="px-3 py-1 text-xs text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddSensitiveApp}
                      className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold rounded-lg"
                    >
                      Save App
                    </button>
                  </div>
                </div>
              )}

              {/* App List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(settings.sensitiveAppsDenylist || []).map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs"
                  >
                    <div className="truncate pr-2">
                      <div className="text-white font-medium flex items-center gap-1.5">
                        <span>{app.name}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          {app.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono truncate">
                        {app.packageName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSensitiveApp(app.id)}
                      className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove from denylist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Voice-Based Owner Recognition */}
        <OwnerRecognitionCard
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onNavigateToVoiceEnrollment={onNavigateToVoiceEnrollment}
        />

        {/* Section 2: Gemini API Key */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-500 flex items-center gap-1.5 px-1">
            <Key className="w-3.5 h-3.5" />
            Gemini API Configuration
          </div>

          <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Gemini 3.6 / 3.1 Flash</div>
                <div className="text-xs text-gray-400">
                  Pre-configured via Cloud Run environment secrets
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-950/60 border border-teal-800/60 text-teal-300 px-2 py-0.5 rounded-lg flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Active
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs text-gray-400 block font-medium">
                Custom API Key Override (Optional)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="api-key-input"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy... (leave blank for default)"
                    className="w-full bg-black/50 text-white text-xs rounded-xl px-3 py-2 pr-9 border border-white/10 focus:outline-none focus:border-teal-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  id="save-api-key-btn"
                  onClick={handleSaveApiKey}
                  className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-teal-500 hover:bg-teal-400 text-black transition-colors shrink-0 flex items-center gap-1"
                >
                  {savedKeySuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <span>Update</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Chat History & Storage */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-500 flex items-center gap-1.5 px-1">
            <Trash2 className="w-3.5 h-3.5" />
            Chat Storage
          </div>

          <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span className="font-bold">Saved Messages in Session</span>
              <span className="font-mono text-teal-400 font-bold">{totalMessagesCount}</span>
            </div>

            {showClearConfirm ? (
              <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 space-y-2">
                <div className="text-xs text-rose-200 font-medium">
                  Are you sure you want to clear all conversation history?
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="confirm-clear-history-btn"
                    onClick={() => {
                      onClearHistory();
                      setShowClearConfirm(false);
                    }}
                    className="flex-1 py-1.5 text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors"
                  >
                    Yes, Clear All
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-1.5 text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="clear-chat-history-btn"
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/50 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Chat History
              </button>
            )}
          </div>
        </div>

        {/* Section 4: Kotlin & Jetpack Compose Scaffolding Inspector */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-500 flex items-center gap-1.5 px-1">
            <Code2 className="w-3.5 h-3.5" />
            Android Kotlin & Compose Code
          </div>

          <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="text-xs text-gray-300">
              Inspect the scaffolded Android source files for Phase 1 & 2:
            </div>

            <div className="space-y-1.5">
              {KOTLIN_SCAFFOLD_FILES.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setSelectedScaffoldId(file.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 hover:border-teal-900/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Layers className="w-4 h-4 text-teal-400 shrink-0" />
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white group-hover:text-teal-300">
                        {file.title}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">{file.description}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-teal-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                    Kotlin
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5: System Personality & Guidelines */}
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 text-xs text-gray-400 space-y-2">
          <div className="flex items-center gap-1.5 text-white font-bold uppercase tracking-wider text-[11px]">
            <Info className="w-3.5 h-3.5 text-teal-400" />
            Nova System Persona
          </div>
          <p className="leading-relaxed">
            Nova is programmed to be friendly, conversational, and naturally multilingual in English
            and Hinglish. Responses are concise by default for phone screens and voice replies,
            expanding into structured breakdowns with code or lists whenever prompted.
          </p>
        </div>
      </div>

      {/* Kotlin Scaffold Code Modal */}
      {selectedScaffoldFile && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex flex-col p-4 animate-in fade-in duration-200">
          <div className="flex-1 flex flex-col bg-[#0F0F0F] border border-teal-900/40 rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-3.5 px-4 bg-[#161616] border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-teal-400" />
                  {selectedScaffoldFile.title}
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">
                  {selectedScaffoldFile.filePath}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyCode(selectedScaffoldFile.code)}
                  className="px-2.5 py-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  {copiedScaffold ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedScaffoldId(null)}
                  className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-4 bg-black/80 font-mono">
              <pre className="text-xs text-teal-300/90 leading-relaxed font-mono">
                <code>{selectedScaffoldFile.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
