import { ChatMessage, UserSettings, FunctionCallData } from '../types';
import { naturalVoiceService, NaturalSpeechOptions } from './naturalVoiceService';
import { DEFAULT_SENSITIVE_APPS } from '../data/defaultSensitiveApps';

const STORAGE_KEY_MESSAGES = 'nova_chat_history_v1';
const STORAGE_KEY_SETTINGS = 'nova_user_settings_v1';

export class GeminiRepository {
  private static instance: GeminiRepository;

  public static getInstance(): GeminiRepository {
    if (!GeminiRepository.instance) {
      GeminiRepository.instance = new GeminiRepository();
    }
    return GeminiRepository.instance;
  }

  // Local SQLite / Room DB equivalent storage
  public loadMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load messages from storage', e);
    }
    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: "Good day, Sir. Nova online and standing by. All systems are operational. You may converse with me, or issue commands like *\"Send a WhatsApp message to Rahul regarding the project briefing\"*.",
        timestamp: Date.now(),
      },
    ];
  }

  public saveMessages(messages: ChatMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save messages to storage', e);
    }
  }

  public clearMessages(): void {
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
  }

  public loadSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          voiceRepliesEnabled: parsed.voiceRepliesEnabled ?? true,
          autoListenEnabled: parsed.autoListenEnabled ?? false,
          customApiKey: parsed.customApiKey ?? '',
          preferredVoice: parsed.preferredVoice ?? 'Aoede',
          voicePersona: parsed.voicePersona ?? 'calm_relaxed',
          voiceRate: parsed.voiceRate ?? 0.92,
          voicePitch: parsed.voicePitch ?? 1.0,
          speechClarityEnhancer: parsed.speechClarityEnhancer ?? true,
          voiceLanguage: parsed.voiceLanguage ?? 'auto',
          contactsPermission: 'granted',
          whatsAppInstalled: parsed.whatsAppInstalled ?? true,
          avatarVisualMode: parsed.avatarVisualMode ?? 'avatar',
          floatingBubbleEnabled: parsed.floatingBubbleEnabled ?? true,
          overlayPermission: 'granted',
          turboMode: parsed.turboMode ?? true,
          useCloudTts: parsed.useCloudTts ?? false,
          fullPhoneControlEnabled: true,
          accessibilityPermission: 'granted',
          sensitiveAppsDenylist: parsed.sensitiveAppsDenylist ?? DEFAULT_SENSITIVE_APPS,
          visionFallbackEnabled: parsed.visionFallbackEnabled ?? true,
          persistentListeningEnabled: parsed.persistentListeningEnabled ?? true,
          recordAudioPermission: 'granted',
          batteryLevel: parsed.batteryLevel ?? 85,
          isCharging: parsed.isCharging ?? false,
          ownerRecognitionEnabled: parsed.ownerRecognitionEnabled ?? true,
          voiceVerificationThreshold: parsed.voiceVerificationThreshold ?? 0.72,
        };
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return {
      voiceRepliesEnabled: true,
      autoListenEnabled: false,
      customApiKey: '',
      preferredVoice: 'Aoede',
      voicePersona: 'calm_relaxed',
      voiceRate: 0.92,
      voicePitch: 1.0,
      speechClarityEnhancer: true,
      voiceLanguage: 'auto',
      contactsPermission: 'granted',
      whatsAppInstalled: true,
      avatarVisualMode: 'avatar',
      floatingBubbleEnabled: true,
      overlayPermission: 'granted',
      turboMode: true,
      useCloudTts: false,
      fullPhoneControlEnabled: true,
      accessibilityPermission: 'granted',
      sensitiveAppsDenylist: DEFAULT_SENSITIVE_APPS,
      visionFallbackEnabled: true,
      persistentListeningEnabled: true,
      recordAudioPermission: 'granted',
      batteryLevel: 85,
      isCharging: false,
      ownerRecognitionEnabled: true,
      voiceVerificationThreshold: 0.72,
    };
  }

  public saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  // Stream chat messages word-by-word with tool-call interception
  public async streamChat(
    messages: { role: string; content: string }[],
    customApiKey: string | undefined,
    onChunk: (chunkText: string) => void,
    onComplete: (fullText: string) => void,
    onError: (err: Error) => void,
    onFunctionCall?: (fc: FunctionCallData) => void
  ): Promise<() => void> {
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            apiKey: customApiKey || undefined,
            turboMode: true,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with ${response.status}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6).trim();
              if (dataStr === '[DONE]') {
                continue;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  if (!accumulatedText) {
                    throw new Error(parsed.error);
                  } else {
                    console.warn('Stream received warning/error:', parsed.error);
                    break;
                  }
                }
                if (parsed.functionCall) {
                  onFunctionCall?.(parsed.functionCall);
                }
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  onChunk(parsed.text);
                }
              } catch (e: any) {
                if (e.message && !accumulatedText) throw e;
              }
            }
          }
        }

        onComplete(accumulatedText);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        onError(err);
      }
    })();

    return () => controller.abort();
  }

  // Speech-to-Text via Web Speech Recognition (Chrome/Android WebView supported) with fast silence auto-commit
  public createSpeechRecognizer(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void,
    lang: string = 'en-IN'
  ) {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    let silenceTimer: any = null;
    let latestTranscript = '';
    let hasDispatched = false;

    const clearSilenceTimer = () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeText = finalTranscript || interimTranscript;
      if (activeText) {
        latestTranscript = activeText;
      }

      if (finalTranscript) {
        clearSilenceTimer();
        hasDispatched = true;
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);

        // Fast silence auto-commit: if user stops speaking for 850ms, auto-commit
        clearSilenceTimer();
        silenceTimer = setTimeout(() => {
          if (!hasDispatched && latestTranscript.trim()) {
            hasDispatched = true;
            try {
              recognition.stop();
            } catch {}
            onResult(latestTranscript.trim(), true);
          }
        }, 850);
      }
    };

    recognition.onerror = (event: any) => {
      clearSilenceTimer();
      const err = event.error || 'Speech recognition error';
      // Suppress benign non-actionable speech recognition lifecycle events
      if (err === 'aborted' || err === 'no-speech') {
        return;
      }
      onError(err);
    };

    recognition.onend = () => {
      clearSilenceTimer();
      onEnd();
    };

    return recognition;
  }

  // Text-to-Speech: Instant low-latency voice playback
  public async speakText(
    text: string,
    customApiKey: string | undefined,
    onStart: () => void,
    onEnd: () => void,
    speechOptions?: NaturalSpeechOptions
  ): Promise<void> {
    this.stopSpeaking();

    const cleanText = naturalVoiceService.sanitizeForSpeech(
      text,
      speechOptions?.clarityEnhancer !== false
    );

    if (!cleanText) {
      onEnd();
      return;
    }

    onStart();

    // 1. If cloud TTS is explicitly enabled, try server endpoint
    if (speechOptions?.useCloudTts) {
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            apiKey: customApiKey || undefined,
            voiceName: speechOptions?.preferredVoiceName || 'Aoede',
          }),
        });

        if (response.ok && response.status === 200) {
          const data = await response.json();
          if (data.audio) {
            await naturalVoiceService.playPcmWithClarityEq(data.audio, onEnd);
            return;
          }
        }
      } catch {
        // Fall back to Instant Natural Voice Engine
      }
    }

    // 2. High-Fidelity Natural Voice Engine: Instant playback (<20ms latency), neural voices, studio clarity
    await naturalVoiceService.speak(
      cleanText,
      speechOptions || {},
      () => {},
      onEnd
    );
  }

  public stopSpeaking(): void {
    naturalVoiceService.stop();
  }
}
