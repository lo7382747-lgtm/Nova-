import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScreenType,
  NovaState,
  ChatMessage,
  UserSettings,
  FunctionCallData,
  Contact,
  ActivityLogItem,
  WhatsAppConfirmationState,
  ForegroundAppType,
  SystemSettingsState,
  AutomationExecutionState,
  UniversalMessageConfirmationState,
  MessagingApp,
  AutomationStep,
} from './types';
import { GeminiRepository } from './services/geminiRepository';
import { ContactsService } from './services/contactsService';
import { ActivityLogService } from './services/activityLogService';
import { AutomationService } from './services/automationService';
import { AndroidFrame } from './components/AndroidFrame';
import { HomeScreen } from './components/HomeScreen';
import { ChatScreen } from './components/ChatScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { VoiceEnrollmentScreen } from './components/VoiceEnrollmentScreen';
import { AutomationScreen } from './components/AutomationScreen';
import { ActivityScreen } from './components/ActivityScreen';
import { BottomNavBar } from './components/BottomNavBar';
import { ContactsPermissionDialog } from './components/ContactsPermissionDialog';
import { FloatingBubble } from './components/FloatingBubble';
import { OverlayPermissionDialog } from './components/OverlayPermissionDialog';
import { AndroidHomeScreen } from './components/AndroidHomeScreen';
import { ActionLogOverlay } from './components/ActionLogOverlay';
import { AccessibilityPermissionDialog } from './components/AccessibilityPermissionDialog';
import { UniversalMessageConfirmationModal } from './components/UniversalMessageConfirmationModal';
import { SensitiveAppWarningModal } from './components/SensitiveAppWarningModal';
import { SimulatedChrome } from './components/simulated/SimulatedChrome';
import { SimulatedInstagram } from './components/simulated/SimulatedInstagram';
import { SimulatedMessages } from './components/simulated/SimulatedMessages';
import { SimulatedPhoneCall } from './components/simulated/SimulatedPhoneCall';
import { SimulatedQuickSettings } from './components/simulated/SimulatedQuickSettings';
import { detectDeviceCapability } from './services/hardwareDetector';
import { matchLocalCommandIntent } from './utils/localIntent';
import { NovaAssistantService } from './services/novaAssistantService';
import { RecordAudioPermissionDialog } from './components/RecordAudioPermissionDialog';
import { automationEngine, ActionType as EngineActionType } from './automation';

export default function App() {
  const repo = GeminiRepository.getInstance();
  const contactsService = ContactsService.getInstance();
  const activityLogService = ActivityLogService.getInstance();

  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [novaState, setNovaState] = useState<NovaState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>(() => repo.loadMessages());
  const [settings, setSettings] = useState<UserSettings>(() => repo.loadSettings());
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Phase 3: Floating Bubble and Minimized state
  const [isMinimized, setIsMinimized] = useState(false);
  const [showOverlayPermissionDialog, setShowOverlayPermissionDialog] = useState(false);
  const screenBoundsRef = useRef<HTMLDivElement | null>(null);

  // Phase 4: Full Phone Control & Automation state
  const automationService = AutomationService.getInstance();
  const [foregroundApp, setForegroundApp] = useState<ForegroundAppType>(() => automationService.getForegroundApp());
  const [systemSettings, setSystemSettings] = useState<SystemSettingsState>(() => automationService.getSystemSettings());
  const [executionState, setExecutionState] = useState<AutomationExecutionState>(() => automationService.getExecutionState());
  const [showAccessibilityPermissionDialog, setShowAccessibilityPermissionDialog] = useState(false);
  const [showScreenshotFlash, setShowScreenshotFlash] = useState(false);
  const [, setForceRender] = useState(0);

  // References for non-blocking permission and command resumption
  const pendingAutomationRef = useRef<FunctionCallData | null>(null);
  const hasDismissedAccessibilityPromptRef = useRef<boolean>(false);

  // Phase 2: Contacts & Activity Log state
  const [contacts, setContacts] = useState<Contact[]>(() => contactsService.getAllContacts());
  const [activities, setActivities] = useState<ActivityLogItem[]>(() =>
    activityLogService.getActivities()
  );

  // Universal Message Confirmation Modal State
  const [universalMessageModalState, setUniversalMessageModalState] = useState<UniversalMessageConfirmationState>({
    isOpen: false,
    app: 'whatsapp',
    contactName: '',
    recipient: '',
    message: '',
    phone: '',
    mode: 'confirm',
  });
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [pendingUniversalMessageCommand, setPendingUniversalMessageCommand] = useState<{
    app: MessagingApp;
    recipient: string;
    message: string;
  } | null>(null);

  // Persistent Always-Listening & One-time Audio Permission
  const [showRecordAudioPermissionDialog, setShowRecordAudioPermissionDialog] = useState(false);
  const handleSendMessageRef = useRef<(text: string, isVoice?: boolean) => void>(() => {});

  const recognitionRef = useRef<any>(null);
  const cancelStreamRef = useRef<(() => void) | null>(null);
  const universalMessageModalStateRef = useRef(universalMessageModalState);
  universalMessageModalStateRef.current = universalMessageModalState;

  // Subscribe to AutomationService events
  useEffect(() => {
    const unsubApp = automationService.onForegroundAppChange((app) => {
      setForegroundApp(app);
      setIsMinimized(app !== 'nova');
      setForceRender((c) => c + 1);
    });
    const unsubSettings = automationService.onSystemSettingsChange((s) => {
      setSystemSettings(s);
      setForceRender((c) => c + 1);
    });
    const unsubExec = automationService.onExecutionChange((e) => {
      setExecutionState(e);
      setForceRender((c) => c + 1);
    });
    const unsubScreenshot = automationService.onScreenshotTaken(() => {
      setShowScreenshotFlash(true);
      setTimeout(() => setShowScreenshotFlash(false), 350);
    });

    return () => {
      unsubApp();
      unsubSettings();
      unsubExec();
      unsubScreenshot();
    };
  }, [automationService]);

  // Subscribe to NovaAssistantService (Persistent Background Always-Listening)
  useEffect(() => {
    const service = NovaAssistantService.getInstance();
    service.initialize(settings.persistentListeningEnabled, settings.recordAudioPermission);

    const unsubCmd = service.onCommand((cmd) => {
      console.log('[NovaAssistantService] Real speech command captured:', cmd);
      handleSendMessageRef.current(cmd, true);
    });

    const unsubSpeech = service.onSpeechStateChange((isSpeaking) => {
      if (isSpeaking) {
        setNovaState('listening');
      } else {
        setNovaState((prev) => (prev === 'listening' ? 'idle' : prev));
      }
    });

    return () => {
      unsubCmd();
      unsubSpeech();
    };
  }, [settings.persistentListeningEnabled, settings.recordAudioPermission]);

  // Auto-detect hardware capability on mount if not already calibrated
  useEffect(() => {
    const capability = detectDeviceCapability();
    if (capability.isLowEnd && settings.avatarVisualMode === 'avatar') {
      // Auto fallback to orb on low-end hardware
      setSettings((prev) => ({
        ...prev,
        avatarVisualMode: 'orb',
        hardwareCapability: {
          isLowEnd: true,
          gpuRenderer: capability.gpuRenderer,
          recommendation: 'orb',
        },
      }));
    }
  }, []);

  // Sync messages to local persistence whenever they change
  useEffect(() => {
    repo.saveMessages(messages);
  }, [messages, repo]);

  // Sync settings whenever they change
  useEffect(() => {
    repo.saveSettings(settings);
  }, [settings, repo]);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      repo.stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [repo]);

  // Handle Speech Recognition
  const startListening = useCallback(() => {
    repo.stopSpeaking();
    setSpeechError(null);
    setLiveTranscript('');

    // Temporarily pause background continuous listening during manual foreground turn
    NovaAssistantService.getInstance().pauseForManualSession();

    const speechLang =
      settings.voiceLanguage === 'hi'
        ? 'hi-IN'
        : settings.voiceLanguage === 'en'
        ? 'en-US'
        : 'en-IN';

    const recognition = repo.createSpeechRecognizer(
      (transcript: string, isFinal: boolean) => {
        setLiveTranscript(transcript);

        // Check if a Universal Message confirmation modal is currently open and waiting for voice response
        if (universalMessageModalStateRef.current.isOpen) {
          const lower = transcript.toLowerCase();
          if (
            lower.includes('send') ||
            lower.includes('confirm') ||
            lower.includes('yes') ||
            lower.includes('bhej do') ||
            lower.includes('haan')
          ) {
            stopListening();
            handleConfirmSendUniversalMessage(
              universalMessageModalStateRef.current.message,
              universalMessageModalStateRef.current.matchedContact
            );
            return;
          } else if (
            lower.includes('cancel') ||
            lower.includes('no') ||
            lower.includes('mat bhejo') ||
            lower.includes('nahi')
          ) {
            stopListening();
            handleCancelUniversalMessage();
            return;
          }
        }

        if (isFinal && transcript.trim()) {
          stopListening();
          // Dispatch recognized speech to Gemini
          handleSendMessage(transcript.trim(), true);
        }
      },
      (error: string) => {
        // 'aborted' and 'no-speech' are benign lifecycle events and must not show an error banner
        if (error !== 'no-speech' && error !== 'aborted') {
          console.warn('Speech recognition notice:', error);
          setSpeechError(`Voice input: ${error}`);
          setTimeout(() => setSpeechError(null), 3500);
        }
        setNovaState('idle');
        NovaAssistantService.getInstance().resumeFromManualSession();
      },
      () => {
        // Recognition ended
        setNovaState((prev) => (prev === 'listening' ? 'idle' : prev));
        NovaAssistantService.getInstance().resumeFromManualSession();
      },
      speechLang
    );

    if (!recognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please type your message.');
      setTimeout(() => setSpeechError(null), 3500);
      NovaAssistantService.getInstance().resumeFromManualSession();
      return;
    }

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setNovaState('listening');
    } catch (e) {
      console.error('Failed to start speech recognition', e);
      setNovaState('idle');
      NovaAssistantService.getInstance().resumeFromManualSession();
    }
  }, [repo]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setNovaState('idle');
    setTimeout(() => {
      NovaAssistantService.getInstance().resumeFromManualSession();
    }, 600);
  }, []);

  const stopSpeaking = useCallback(() => {
    repo.stopSpeaking();
    setNovaState('idle');
  }, [repo]);

  // Speak assistant response with Natural Voice Engine
  const speakAssistantResponse = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!settings.voiceRepliesEnabled) {
        if (onEnd) onEnd();
        return;
      }

      repo.speakText(
        text,
        settings.customApiKey,
        () => setNovaState('speaking'),
        () => {
          setNovaState('idle');
          if (onEnd) {
            onEnd();
          } else if (settings.autoListenEnabled) {
            setTimeout(() => {
              startListening();
            }, 600);
          }
        },
        {
          persona: settings.voicePersona,
          rate: settings.voiceRate,
          pitch: settings.voicePitch,
          clarityEnhancer: settings.speechClarityEnhancer,
          language: settings.voiceLanguage,
          preferredVoiceName: settings.preferredVoice,
          useCloudTts: settings.useCloudTts,
        }
      );
    },
    [settings, repo, startListening]
  );

  // Universal messaging flow (WhatsApp, SMS, Instagram, Telegram)
  const initiateUniversalMessageFlow = useCallback(
    (app: MessagingApp, recipient: string, message: string) => {
      // Step 1: Check contacts permission
      if (settings.contactsPermission !== 'granted') {
        setPendingUniversalMessageCommand({ app, recipient, message });
        setShowPermissionDialog(true);
        speakAssistantResponse('Nova needs Contacts permission to look up the recipient.');
        return;
      }

      // Step 2: Search contact
      const matches = contactsService.searchContacts(recipient);

      if (matches.length === 1) {
        const contact = matches[0];
        setUniversalMessageModalState({
          isOpen: true,
          app,
          contactName: contact.name,
          recipient: contact.name,
          message,
          phone: contact.phone,
          matchedContact: contact,
          mode: 'confirm',
        });
        const appLabel = app === 'whatsapp' ? 'WhatsApp' : app.toUpperCase();
        speakAssistantResponse(
          `Send ${appLabel} to ${contact.name}: "${message}" — Confirm?`,
          () => {
            if (settings.autoListenEnabled || true) {
              setTimeout(() => startListening(), 400);
            }
          }
        );
      } else if (matches.length > 1) {
        setUniversalMessageModalState({
          isOpen: true,
          app,
          contactName: recipient,
          recipient,
          message,
          candidateMatches: matches,
          mode: 'pick_contact',
        });
        speakAssistantResponse(
          `I found multiple contacts matching ${recipient}. Which one should I message?`
        );
      } else {
        setUniversalMessageModalState({
          isOpen: true,
          app,
          contactName: recipient,
          recipient,
          message,
          phone: '+91 ',
          mode: 'no_contact',
        });
        speakAssistantResponse(
          `I could not find ${recipient} in your contacts. Please enter a phone number to proceed.`
        );
      }
    },
    [settings, contactsService, speakAssistantResponse, startListening]
  );

  // Backward-compatible WhatsApp flow alias
  const initiateWhatsAppFlow = useCallback(
    (contactName: string, message: string) => {
      initiateUniversalMessageFlow('whatsapp', contactName, message);
    },
    [initiateUniversalMessageFlow]
  );

  // User confirms sending universal message
  const handleConfirmSendUniversalMessage = useCallback(
    (finalMessage: string, chosenContact?: Contact) => {
      const app = universalMessageModalState.app || 'whatsapp';
      const contactName = chosenContact?.name || universalMessageModalState.contactName || universalMessageModalState.recipient;
      const phone = chosenContact?.phone || universalMessageModalState.phone || '+91 98765 00000';
      const cleanPhone = phone.replace(/[^0-9]/g, '');

      if (app === 'sms') {
        // Switch to SMS Messages screen
        automationService.openApp('Messages');
        activityLogService.addActivity({
          actionType: 'sms_message',
          contactName,
          contactPhone: phone,
          message: finalMessage,
          status: 'sent',
          intentData: {
            action: 'android.intent.action.SENDTO',
            packageName: 'com.google.android.apps.messaging',
            url: `sms:${cleanPhone}?body=${encodeURIComponent(finalMessage)}`,
          },
        });
      } else {
        // WhatsApp or other app
        const encodedMsg = encodeURIComponent(finalMessage);
        const whatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
        try {
          window.open(whatsAppUrl, '_blank');
        } catch (err) {
          console.warn('Failed to open external link:', err);
        }

        activityLogService.addActivity({
          actionType: 'whatsapp_message',
          contactName,
          contactPhone: phone,
          message: finalMessage,
          status: 'sent',
          intentData: {
            action: 'android.intent.action.SEND',
            packageName: 'com.whatsapp',
            jid: `${cleanPhone}@s.whatsapp.net`,
            url: whatsAppUrl,
          },
        });
      }

      setActivities(activityLogService.getActivities());
      setUniversalMessageModalState((prev) => ({ ...prev, isOpen: false }));

      const appLabel = app === 'whatsapp' ? 'WhatsApp' : app.toUpperCase();
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-sent-${Date.now()}`,
          role: 'assistant',
          content: `✅ **${appLabel} message sent** to **${contactName}** (${phone}):\n\n> *"${finalMessage}"*`,
          timestamp: Date.now(),
          statusText: `Sent via ${appLabel}`,
        },
      ]);

      speakAssistantResponse(`Sent to ${contactName}.`);
    },
    [universalMessageModalState, activityLogService, automationService, speakAssistantResponse]
  );

  const handleCancelUniversalMessage = useCallback(() => {
    const app = universalMessageModalState.app || 'whatsapp';
    const contactName = universalMessageModalState.contactName || universalMessageModalState.recipient || 'Contact';

    activityLogService.addActivity({
      actionType: app === 'sms' ? 'sms_message' : 'whatsapp_message',
      contactName,
      contactPhone: universalMessageModalState.phone || '',
      message: universalMessageModalState.message,
      status: 'cancelled',
    });
    setActivities(activityLogService.getActivities());

    setUniversalMessageModalState((prev) => ({ ...prev, isOpen: false }));

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-cancel-${Date.now()}`,
        role: 'assistant',
        content: `❌ Cancelled message to **${contactName}**.`,
        timestamp: Date.now(),
        statusText: 'Cancelled',
      },
    ]);

    speakAssistantResponse('Message cancelled.');
  }, [universalMessageModalState, activityLogService, speakAssistantResponse]);

  // Backward-compatible handlers for WhatsApp modal
  const handleConfirmSendWhatsApp = handleConfirmSendUniversalMessage;
  const handleCancelWhatsApp = handleCancelUniversalMessage;

  // Handle Contacts Permission Dialog response
  const handleGrantPermission = () => {
    setShowPermissionDialog(false);
    setSettings((prev) => ({ ...prev, contactsPermission: 'granted' }));
    if (pendingUniversalMessageCommand) {
      const { app, recipient, message } = pendingUniversalMessageCommand;
      setPendingUniversalMessageCommand(null);
      setTimeout(() => {
        initiateUniversalMessageFlow(app, recipient, message);
      }, 200);
    }
  };

  const handleDenyPermission = () => {
    setShowPermissionDialog(false);
    setSettings((prev) => ({ ...prev, contactsPermission: 'denied' }));
    setPendingUniversalMessageCommand(null);
    speakAssistantResponse('Contacts permission was denied.');
  };

  // Handle Accessibility Permission Dialog
  const handleGrantAccessibilityPermission = () => {
    setShowAccessibilityPermissionDialog(false);
    const updated = {
      ...settings,
      accessibilityPermission: 'granted' as const,
      fullPhoneControlEnabled: true,
    };
    setSettings(updated);
    repo.saveSettings(updated);
    speakAssistantResponse('Accessibility permission granted. Full Phone Control is now active.');

    // Resume any pending automation seamlessly
    if (pendingAutomationRef.current) {
      const pending = pendingAutomationRef.current;
      pendingAutomationRef.current = null;
      setTimeout(() => {
        executeAutomationTool(pending);
      }, 300);
    }
  };

  const handleDenyAccessibilityPermission = () => {
    setShowAccessibilityPermissionDialog(false);
    hasDismissedAccessibilityPromptRef.current = true;
    speakAssistantResponse('Understood. Running in simulation mode.');

    // Continue action simulation without blocking or re-prompting
    if (pendingAutomationRef.current) {
      const pending = pendingAutomationRef.current;
      pendingAutomationRef.current = null;
      setTimeout(() => {
        executeAutomationTool(pending);
      }, 300);
    }
  };

  // Core Automation Tool Executor
  const executeAutomationTool = async (
    fc: FunctionCallData,
    skipSpeech: boolean = false
  ): Promise<{ success: boolean; message: string }> => {
    const name = fc.name;
    const args = fc.args || {};
    let result = { success: true, message: '' };

    switch (name) {
      case 'emergencyStopAutomation': {
        const reason = String(args.reason || 'User Emergency Stop');
        automationEngine.emergencyStop(reason);
        automationService.abortChain();
        result = {
          success: true,
          message: 'EMERGENCY STOP ACTIVATED: All phone automation actions halted immediately.',
        };
        if (!skipSpeech) speakAssistantResponse('Emergency stop activated. All automation stopped.');
        break;
      }

      case 'sendWhatsAppMessage': {
        const contactName = String(args.contactName || '');
        const draftedMsg = String(args.message || '');
        initiateUniversalMessageFlow('whatsapp', contactName, draftedMsg);
        result = { success: true, message: `Drafted WhatsApp message for ${contactName}` };
        break;
      }

      case 'sendUniversalMessage': {
        const app = (args.app as MessagingApp) || 'sms';
        const recipient = String(args.recipient || args.contactName || '');
        const draftedMsg = String(args.message || '');
        initiateUniversalMessageFlow(app, recipient, draftedMsg);
        result = { success: true, message: `Drafted ${app.toUpperCase()} for ${recipient}` };
        break;
      }

      case 'chainPhoneActions': {
        const title = String(args.title || 'Multi-step Automation');
        const rawSteps = Array.isArray(args.steps) ? args.steps : [];
        const steps: AutomationStep[] = rawSteps.map((st: any, idx: number) => {
          let actionType: AutomationStep['actionType'] = 'open_app';
          let stepTitle = st.description || `Step ${idx + 1}`;
          switch (st.action) {
            case 'openApp':
              actionType = 'open_app';
              stepTitle = `Open ${st.appName || 'app'}`;
              break;
            case 'goHome':
              actionType = 'go_home';
              stepTitle = 'Go to Home Screen';
              break;
            case 'goBack':
              actionType = 'go_back';
              stepTitle = 'Go Back';
              break;
            case 'scrollScreen':
              actionType = 'scroll';
              stepTitle = `Scroll ${st.direction || 'down'}`;
              break;
            case 'tapElement':
              actionType = 'tap';
              stepTitle = `Tap ${st.description || 'element'}`;
              break;
            case 'typeText':
              actionType = 'type';
              stepTitle = `Type "${st.text || ''}"`;
              break;
            case 'doubleTap':
              actionType = 'double_tap';
              stepTitle = `Double-tap ${st.description || 'element'}`;
              break;
            case 'longPress':
              actionType = 'long_press';
              stepTitle = `Long-press ${st.description || 'element'}`;
              break;
            case 'toggleSystemSetting':
              actionType = 'toggle_setting';
              stepTitle = `Toggle ${st.setting || 'setting'}`;
              break;
            case 'makeCall':
              actionType = 'make_call';
              stepTitle = `Call ${st.contactName || 'contact'}`;
              break;
            case 'endCall':
              actionType = 'end_call';
              stepTitle = 'End call';
              break;
            case 'playMedia':
              actionType = 'play_media';
              stepTitle = `Play ${st.query || 'music'}`;
              break;
            case 'pauseMedia':
              actionType = 'pause_media';
              stepTitle = 'Pause media';
              break;
            case 'setAlarm':
              actionType = 'set_alarm';
              stepTitle = `Set Alarm for ${st.time || '7:00 AM'}`;
              break;
            case 'setTimer':
              actionType = 'set_timer';
              stepTitle = `Set Timer for ${st.minutes || st.time || '5'}m`;
              break;
            case 'takeScreenshot':
              actionType = 'take_screenshot';
              stepTitle = 'Take Screenshot';
              break;
            case 'deviceControl':
            case 'deviceHardwareControl':
              actionType = 'device_control';
              stepTitle = `Hardware: ${st.action || 'device control'}`;
              break;
            default:
              actionType = 'tap';
              stepTitle = st.description || 'Action';
              break;
          }

          return {
            id: `step-${idx}-${Date.now()}`,
            actionType,
            title: stepTitle,
            status: 'pending',
            appName: st.appName,
            description: st.description,
            params: st,
          };
        });

        const res = await automationService.executeChain(title, steps, settings.sensitiveAppsDenylist);
        setActivities(activityLogService.getActivities());
        result = res;
        if (!skipSpeech && res.message) speakAssistantResponse(res.message);
        break;
      }

      case 'openApp': {
        const appName = String(args.appName || '');
        const res = automationService.openApp(appName, settings.sensitiveAppsDenylist);
        result = res;
        if (!skipSpeech && res.message) speakAssistantResponse(res.message);
        activityLogService.addActivity({
          actionType: 'open_app',
          message: `Opened ${appName}`,
          status: res.success ? 'sent' : 'failed',
          failureReason: !res.success ? res.message : undefined,
        });
        setActivities(activityLogService.getActivities());
        break;
      }

      case 'systemNavigation': {
        const action = String(args.action || 'goHome');
        let res = { success: true, message: '' };
        if (action === 'goHome') res = automationService.goHome();
        else if (action === 'goBack') res = automationService.goBack();
        else if (action === 'openQuickSettings') res = automationService.openQuickSettings();
        else if (action === 'openRecentApps') res = automationService.openRecentApps();
        else if (action === 'openNotifications') res = automationService.openNotifications();
        else if (action === 'openAutomation') {
          automationService.setForegroundApp('nova');
          setCurrentScreen('automation');
          res = { success: true, message: 'Opening Android Automation Hub.' };
        }
        else if (action === 'greet' || action === 'identify' || action === 'checkWeather') {
          return { success: true, message: '' };
        }
        else res = { success: true, message: `Executed navigation: ${action}` };

        result = res;
        if (!skipSpeech && res.message) speakAssistantResponse(res.message);
        activityLogService.addActivity({
          actionType: 'system_navigation',
          message: res.message,
          status: 'sent',
        });
        setActivities(activityLogService.getActivities());
        break;
      }

      case 'interactScreen': {
        const action = String(args.action || 'tapElement');
        let res = { success: true, message: '' };
        if (action === 'scrollScreen') {
          res = automationService.scrollScreen(args.direction || 'down', args.amount || 'medium');
        } else if (action === 'tapElement') {
          res = automationService.tapElement(args.description || 'element', settings.visionFallbackEnabled);
        } else if (action === 'typeText') {
          res = automationService.typeText(args.text || '', args.description);
        } else if (action === 'doubleTap') {
          res = automationService.doubleTap(args.description || 'element');
        } else if (action === 'longPress') {
          res = automationService.longPress(args.description || 'element');
        }

        result = res;
        if (!skipSpeech && res.message) speakAssistantResponse(res.message);
        activityLogService.addActivity({
          actionType: 'screen_interaction',
          message: res.message,
          status: 'sent',
        });
        setActivities(activityLogService.getActivities());
        break;
      }

      case 'toggleSystemSetting': {
        const setting = args.setting as any;
        const res = automationService.toggleSystemSetting(setting, args.value);
        result = res;
        if (!skipSpeech && res.message) speakAssistantResponse(res.message);
        activityLogService.addActivity({
          actionType: 'system_setting',
          message: res.message,
          status: 'sent',
        });
        setActivities(activityLogService.getActivities());
        break;
      }

      case 'callAndMedia': {
        const action = String(args.action || 'makeCall');
        let res = { success: true, message: '' };
        if (action === 'makeCall') res = automationService.makeCall(args.contactName || 'Contact');
        else if (action === 'endCall') res = automationService.endCall();
        else if (action === 'playMedia') res = automationService.playMedia(args.appName, args.query);
        else if (action === 'pauseMedia') res = automationService.pauseMedia();

        result = res;
        if (!skipSpeech && res.message) speakAssistantResponse(res.message);
        activityLogService.addActivity({
          actionType: 'call_or_media',
          message: res.message,
          status: 'sent',
        });
        setActivities(activityLogService.getActivities());
        break;
      }

      case 'setAlarmOrTimer': {
        const type = args.type || 'alarm';
        let res = { success: true, message: '' };
        if (type === 'alarm') {
          res = automationService.setAlarm(args.time || '07:00 AM', args.label || 'Morning Alarm');
        } else {
          res = automationService.setTimer(Number(args.minutes) || 5, args.label || 'Timer');
        }
        result = res;
        if (!skipSpeech && res.message) speakAssistantResponse(res.message);
        activityLogService.addActivity({
          actionType: 'alarm_or_timer',
          message: res.message,
          status: 'sent',
        });
        setActivities(activityLogService.getActivities());
        break;
      }

      case 'deviceHardwareControl': {
        const action = String(args.action || 'takeScreenshot');
        const res = automationService.deviceHardwareControl(action, args.value);
        result = res;
        if (!skipSpeech && res.message) speakAssistantResponse(res.message);
        activityLogService.addActivity({
          actionType: action.toLowerCase().includes('screenshot') ? 'screenshot' : 'device_control',
          message: res.message,
          status: 'sent',
        });
        setActivities(activityLogService.getActivities());
        break;
      }

      case 'getBatteryStatus': {
        const res = automationService.getBatteryStatus();
        result = res;
        if (!skipSpeech && res.message) speakAssistantResponse(res.message);
        activityLogService.addActivity({
          actionType: 'system_setting',
          message: res.message,
          status: 'sent',
        });
        setActivities(activityLogService.getActivities());
        break;
      }

      default:
        break;
    }

    return result;
  };

  // Automation Tool Call Dispatcher with non-blocking permission guard
  const handleAutomationToolCall = async (
    fc: FunctionCallData,
    skipSpeech: boolean = false
  ): Promise<{ success: boolean; message: string }> => {
    const name = fc.name;

    // Check if permission is needed and not yet granted or dismissed
    if (['chainPhoneActions', 'openApp', 'interactScreen', 'systemNavigation', 'toggleSystemSetting'].includes(name)) {
      if (settings.accessibilityPermission !== 'granted' && !hasDismissedAccessibilityPromptRef.current) {
        pendingAutomationRef.current = fc;
        setShowAccessibilityPermissionDialog(true);
        speakAssistantResponse('Nova needs Accessibility permission to control screen actions. Please grant it in settings.');
        return { success: false, message: 'Accessibility permission required' };
      }
    }

    return await executeAutomationTool(fc, skipSpeech);
  };

  // Send message to Gemini and stream response
  const handleSendMessage = useCallback(
    async (text: string, isVoice = false) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
        isVoice,
      };

      const assistantMsgId = `assistant-${Date.now() + 1}`;
      const placeholderAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now() + 1,
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, placeholderAssistantMsg]);
      setNovaState('thinking');
      setLiveTranscript('');

      // Check instant local command intent for 0-latency execution!
      const localMatch = matchLocalCommandIntent(text);
      if (localMatch) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: localMatch.companionText,
                  isStreaming: false,
                  functionCall: localMatch.toolCall,
                  statusText: localMatch.toolCall ? `Executed ${localMatch.toolCall.name}` : undefined,
                }
              : msg
          )
        );
        speakAssistantResponse(localMatch.companionText);
        setNovaState('idle');
        if (localMatch.toolCall) {
          handleAutomationToolCall(localMatch.toolCall, true);
        }
        return;
      }

      // Prepare conversation payload for multi-turn chat
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      historyPayload.push({ role: 'user', content: text.trim() });

      let fullAccumulated = '';
      let functionCallTriggered: FunctionCallData | null = null;

      const cancel = await repo.streamChat(
        historyPayload,
        settings.customApiKey,
        (chunkText: string) => {
          fullAccumulated += chunkText;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: fullAccumulated } : msg
            )
          );
        },
        (completedText: string) => {
          cancelStreamRef.current = null;
          setNovaState('idle');

          // If a function call was intercepted, execute through the automation dispatcher
          if (functionCallTriggered) {
            const fc = functionCallTriggered;
            const hadText = Boolean(completedText.trim());
            handleAutomationToolCall(fc, hadText).then((res) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        content: hadText ? completedText : (res?.message || `Executed ${fc.name}`),
                        isStreaming: false,
                        statusText: `Executed ${fc.name}`,
                      }
                    : msg
                )
              );
            });
            if (hadText) {
              speakAssistantResponse(completedText);
            }
          } else if (completedText.trim()) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, content: completedText, isStreaming: false }
                  : msg
              )
            );
            // Standard conversational voice response
            speakAssistantResponse(completedText);
          }
        },
        (error: Error) => {
          console.warn('Chat stream notice:', error);
          const localFallback = matchLocalCommandIntent(text);
          if (localFallback) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? {
                      ...msg,
                      content: localFallback.companionText,
                      isStreaming: false,
                      functionCall: localFallback.toolCall,
                      statusText: localFallback.toolCall ? `Executed ${localFallback.toolCall.name}` : undefined,
                    }
                  : msg
              )
            );
            speakAssistantResponse(localFallback.companionText);
            if (localFallback.toolCall) {
              handleAutomationToolCall(localFallback.toolCall, true);
            }
          } else {
            const fallbackResponse = "Nova is online. I can open apps (Chrome, Instagram, WhatsApp), control Wi-Fi and flashlight, navigate home, and draft messages.";
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? {
                      ...msg,
                      content: fallbackResponse,
                      isStreaming: false,
                    }
                  : msg
              )
            );
            speakAssistantResponse(fallbackResponse);
          }
          setNovaState('idle');
          cancelStreamRef.current = null;
        },
        (fc: FunctionCallData) => {
          functionCallTriggered = fc;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    functionCall: fc,
                    statusText: `Executed ${fc.name}`,
                  }
                : msg
            )
          );
        }
      );

      cancelStreamRef.current = cancel;
    },
    [messages, settings, repo, speakAssistantResponse, handleAutomationToolCall]
  );

  const handleClearHistory = () => {
    repo.clearMessages();
    setMessages([
      {
        id: 'welcome-fresh',
        role: 'assistant',
        content: "History cleared. I'm ready for a new conversation!",
        timestamp: Date.now(),
      },
    ]);
  };

  const handleClearActivities = () => {
    activityLogService.clearActivities();
    setActivities([]);
  };

  // Phase 3: Avatar and Floating Bubble Handlers
  // Keep ref up to date for background service callbacks
  handleSendMessageRef.current = handleSendMessage;

  const handleGrantRecordAudioPermission = () => {
    setShowRecordAudioPermissionDialog(false);
    const updated: UserSettings = {
      ...settings,
      recordAudioPermission: 'granted',
      persistentListeningEnabled: true,
    };
    setSettings(updated);
    repo.saveSettings(updated);
    NovaAssistantService.getInstance().setEnabled(true);
  };

  const handleDenyRecordAudioPermission = () => {
    setShowRecordAudioPermissionDialog(false);
    const updated: UserSettings = {
      ...settings,
      recordAudioPermission: 'denied',
      persistentListeningEnabled: false,
    };
    setSettings(updated);
    repo.saveSettings(updated);
    NovaAssistantService.getInstance().setEnabled(false);
  };

  const handleToggleAvatarMode = () => {
    setSettings((prev) => ({
      ...prev,
      avatarVisualMode: prev.avatarVisualMode === 'avatar' ? 'orb' : 'avatar',
    }));
  };

  const handleMinimizeToBubble = () => {
    if (settings.overlayPermission !== 'granted') {
      setShowOverlayPermissionDialog(true);
    } else {
      setIsMinimized(true);
      NovaAssistantService.getInstance().simulateAppSwipeAway();
    }
  };

  const handleHomePress = () => {
    NovaAssistantService.getInstance().simulateAppSwipeAway();
    if (!isMinimized && settings.floatingBubbleEnabled) {
      handleMinimizeToBubble();
    } else if (isMinimized) {
      // Already on simulated Android Home
    } else {
      setCurrentScreen('home');
    }
  };

  const handleExpandFromBubble = () => {
    setIsMinimized(false);
  };

  const handleDismissBubble = () => {
    setIsMinimized(false);
    setCurrentScreen('home');
  };

  const handleGrantOverlayPermission = () => {
    setShowOverlayPermissionDialog(false);
    setSettings((prev) => ({
      ...prev,
      overlayPermission: 'granted',
      floatingBubbleEnabled: true,
    }));
    setIsMinimized(true);
  };

  const handleDenyOverlayPermission = () => {
    setShowOverlayPermissionDialog(false);
    setSettings((prev) => ({
      ...prev,
      overlayPermission: 'denied',
      floatingBubbleEnabled: false,
    }));
  };

  return (
    <AndroidFrame
      activeScreenTitle={foregroundApp === 'nova' ? currentScreen.toUpperCase() : foregroundApp.toUpperCase()}
      onHomePress={handleHomePress}
    >
      {/* Speech warning toast if mic is not allowed/supported */}
      {speechError && !speechError.toLowerCase().includes('aborted') && !speechError.toLowerCase().includes('no-speech') && (
        <div className="absolute top-12 left-4 right-4 z-40 bg-amber-950/90 border border-amber-700/80 text-amber-200 text-xs px-3 py-2 rounded-xl flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <span>{speechError}</span>
          <button
            onClick={() => setSpeechError(null)}
            className="text-amber-400 hover:text-white font-bold ml-2 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Screen Router & Simulated Android Container */}
      <div ref={screenBoundsRef} className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {/* Android Screenshot Camera Flash FX */}
        {showScreenshotFlash && (
          <div className="absolute inset-0 z-50 bg-white/90 pointer-events-none flex items-center justify-center transition-all duration-300">
            <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-white text-xs font-semibold flex items-center gap-2 shadow-2xl">
              <span>📸 Screenshot Captured</span>
            </div>
          </div>
        )}

        {foregroundApp === 'home' && (
          <AndroidHomeScreen
            onOpenNova={handleExpandFromBubble}
            onOpenWhatsApp={() => {
              automationService.openApp('WhatsApp');
              initiateWhatsAppFlow('Rahul Sharma', 'Hey Rahul, are you free for the sync?');
            }}
            onOpenApp={(name) => automationService.openApp(name, settings.sensitiveAppsDenylist)}
            onOpenQuickSettings={() => automationService.openQuickSettings()}
            onOpenAutomation={() => {
              automationService.setForegroundApp('nova');
              setCurrentScreen('automation');
            }}
          />
        )}

        {foregroundApp === 'chrome' && (
          <SimulatedChrome
            searchQuery={automationService.chromeSearchQuery}
            isScrolled={automationService.chromeScrolled}
            onSearchChange={(q) => {
              automationService.chromeSearchQuery = q;
              setForceRender((c) => c + 1);
            }}
          />
        )}

        {foregroundApp === 'instagram' && (
          <SimulatedInstagram
            isLiked={automationService.instagramLiked}
            scrollOffset={automationService.instagramScrollOffset}
            onToggleLike={() => {
              automationService.instagramLiked = !automationService.instagramLiked;
              setForceRender((c) => c + 1);
            }}
          />
        )}

        {foregroundApp === 'messages' && (
          <SimulatedMessages
            contactName={universalMessageModalState.contactName || 'Rahul Sharma'}
            phone={universalMessageModalState.phone || '+91 98765 43210'}
            draftMessage={universalMessageModalState.message || "I'm on my way"}
            onBack={() => automationService.goHome()}
          />
        )}

        {foregroundApp === 'phone_call' && (
          <SimulatedPhoneCall
            contactName={automationService.activeCallContact || 'Rahul Sharma'}
            onEndCall={() => automationService.endCall()}
          />
        )}

        {foregroundApp === 'quick_settings' && (
          <SimulatedQuickSettings
            settings={systemSettings}
            onToggleSetting={(setting) => automationService.toggleSystemSetting(setting)}
            onChangeSlider={(setting, val) => automationService.toggleSystemSetting(setting, val)}
            onClose={() => automationService.goBack()}
          />
        )}

        {foregroundApp === 'denied_sensitive' && (
          <SensitiveAppWarningModal
            appName="Protected Financial App"
            onDismiss={() => automationService.goHome()}
            onGoHome={() => automationService.goHome()}
          />
        )}

        {foregroundApp === 'nova' && (
          <>
            {currentScreen === 'home' && (
              <HomeScreen
                state={novaState}
                onStartListening={startListening}
                onStopListening={stopListening}
                onStopSpeaking={stopSpeaking}
                onNavigateToChat={() => setCurrentScreen('chat')}
                onNavigateToSettings={() => setCurrentScreen('settings')}
                recentMessages={messages}
                settings={settings}
                liveTranscript={liveTranscript}
                onSendMessage={(text) => handleSendMessage(text, true)}
                onSelectSuggestion={(text) => handleSendMessage(text, false)}
                onToggleAvatarMode={handleToggleAvatarMode}
                onMinimizeToBubble={handleMinimizeToBubble}
              />
            )}

            {currentScreen === 'chat' && (
              <ChatScreen
                messages={messages}
                state={novaState}
                onSendMessage={(text) => handleSendMessage(text, false)}
                onStartListening={startListening}
                onStopListening={stopListening}
                onSpeakText={(text) => speakAssistantResponse(text)}
                onStopSpeaking={stopSpeaking}
                onNavigateBack={() => setCurrentScreen('home')}
                onNavigateToSettings={() => setCurrentScreen('settings')}
                liveTranscript={liveTranscript}
                settings={settings}
              />
            )}

            {currentScreen === 'automation' && (
              <AutomationScreen
                settings={settings}
                onUpdateSettings={setSettings}
                onRequestAccessibilityPermission={() => setShowAccessibilityPermissionDialog(true)}
                onExecuteSimulatedCommand={(cmd) => handleSendMessage(cmd, true)}
                onSpeak={(text) => speakAssistantResponse(text)}
                foregroundApp={foregroundApp}
                onOpenApp={(appName) => automationService.openApp(appName, settings.sensitiveAppsDenylist)}
              />
            )}

            {currentScreen === 'activity' && (
              <ActivityScreen
                activities={activities}
                onClearActivities={handleClearActivities}
                onNavigateBack={() => setCurrentScreen('home')}
                onRepeatAction={(activity) => {
                  setCurrentScreen('chat');
                  initiateUniversalMessageFlow('whatsapp', activity.contactName, activity.message);
                }}
              />
            )}

            {currentScreen === 'settings' && (
              <SettingsScreen
                settings={settings}
                onUpdateSettings={setSettings}
                onClearHistory={handleClearHistory}
                onNavigateBack={() => setCurrentScreen('home')}
                totalMessagesCount={messages.length}
                contacts={contacts}
                onResetContacts={() => {
                  contactsService.resetToDefaults();
                  setContacts(contactsService.getAllContacts());
                }}
                onRequestOverlayPermission={() => setShowOverlayPermissionDialog(true)}
                onRequestAccessibilityPermission={() => setShowAccessibilityPermissionDialog(true)}
                onRequestRecordAudioPermission={() => setShowRecordAudioPermissionDialog(true)}
                onExecuteSimulatedCommand={(cmd) => handleSendMessage(cmd, true)}
                onNavigateToVoiceEnrollment={() => setCurrentScreen('voice_enrollment')}
              />
            )}

            {currentScreen === 'voice_enrollment' && (
              <VoiceEnrollmentScreen
                onBack={() => setCurrentScreen('settings')}
                onEnrollmentComplete={(profile) => {
                  setSettings((prev) => ({
                    ...prev,
                    ownerVoiceProfile: profile,
                  }));
                  setCurrentScreen('settings');
                }}
              />
            )}

            {/* Persistent Bottom Navigation Bar */}
            <BottomNavBar
              currentScreen={currentScreen}
              onNavigate={setCurrentScreen}
              activityCount={activities.length}
            />
          </>
        )}

        {/* Real-time Automation Execution Overlay */}
        <ActionLogOverlay
          executionState={executionState}
          onAbort={() => automationService.abortChain()}
          onDismiss={() => automationService.abortChain()}
        />

        {/* Phase 3: System-Wide Floating Chat Head Bubble */}
        <FloatingBubble
          isVisible={foregroundApp !== 'nova' && settings.floatingBubbleEnabled}
          state={novaState}
          onExpand={handleExpandFromBubble}
          onDismiss={handleDismissBubble}
          onStartListening={startListening}
          onStopListening={stopListening}
          liveTranscript={liveTranscript}
          lastAssistantResponse={
            messages
              .filter((m) => m.role === 'assistant')
              .slice(-1)[0]?.content
          }
          boundsRef={screenBoundsRef}
        />
      </div>

      {/* Phase 3: SYSTEM_ALERT_WINDOW Overlay Permission Dialog */}
      <OverlayPermissionDialog
        isOpen={showOverlayPermissionDialog}
        onAllow={handleGrantOverlayPermission}
        onDeny={handleDenyOverlayPermission}
      />

      {/* Phase 4: Universal Message Confirmation Safety Guardrail Modal */}
      <UniversalMessageConfirmationModal
        state={universalMessageModalState}
        onConfirm={handleConfirmSendUniversalMessage}
        onCancel={handleCancelUniversalMessage}
        onSelectContact={(contact) => {
          setUniversalMessageModalState({
            ...universalMessageModalState,
            contactName: contact.name,
            recipient: contact.name,
            phone: contact.phone,
            matchedContact: contact,
            mode: 'confirm',
          });
          const appLabel = universalMessageModalState.app === 'whatsapp' ? 'WhatsApp' : universalMessageModalState.app.toUpperCase();
          speakAssistantResponse(`Send ${appLabel} to ${contact.name}: "${universalMessageModalState.message}" — Confirm?`);
        }}
      />

      {/* Phase 4: Accessibility Service Permission Dialog */}
      <AccessibilityPermissionDialog
        isOpen={showAccessibilityPermissionDialog}
        onGrant={handleGrantAccessibilityPermission}
        onDeny={handleDenyAccessibilityPermission}
      />

      {/* Phase 2: Contacts Permission Dialog */}
      <ContactsPermissionDialog
        isOpen={showPermissionDialog}
        onGrant={handleGrantPermission}
        onDeny={handleDenyPermission}
      />

      {/* Persistent Always-Listening: One-time RECORD_AUDIO Permission Dialog */}
      <RecordAudioPermissionDialog
        isOpen={showRecordAudioPermissionDialog}
        onGrant={handleGrantRecordAudioPermission}
        onDeny={handleDenyRecordAudioPermission}
      />
    </AndroidFrame>
  );
}

