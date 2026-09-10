import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  Settings,
  Sparkles,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  MessageCircle,
  Smartphone,
  Flashlight,
  Wifi,
  PhoneCall,
  Play,
  Clock,
  BatteryCharging,
  Navigation,
  Sliders,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage, NovaState, UserSettings, FunctionCallData } from '../types';

function renderFunctionCallCard(fc: FunctionCallData, statusText?: string) {
  const { name, args = {} } = fc;

  if (name === 'sendWhatsAppMessage' || name === 'sendUniversalMessage') {
    const appName = name === 'sendWhatsAppMessage' ? 'WhatsApp' : String(args.app || 'SMS').toUpperCase();
    const contact = String(args.contactName || args.recipient || 'Contact');
    const msg = String(args.message || '');
    return (
      <div className="mt-2.5 p-3 rounded-xl bg-[#0d221f] border border-teal-800/50 text-xs text-gray-200 space-y-1.5">
        <div className="flex items-center justify-between text-teal-400 font-bold uppercase tracking-wider text-[10px]">
          <span className="flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-teal-400" />
            <span>{appName} Action</span>
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-teal-900/60 text-teal-300 border border-teal-700/50">
            {statusText || 'Action Prepared'}
          </span>
        </div>
        <div className="text-[11px] text-gray-300">
          <span className="text-gray-400">To:</span> <strong className="text-white">{contact}</strong>
        </div>
        {msg && (
          <div className="text-[11px] text-gray-200 italic bg-black/40 p-2.5 rounded-lg border border-teal-900/40 font-mono">
            "{msg}"
          </div>
        )}
      </div>
    );
  }

  if (name === 'toggleSystemSetting') {
    const setting = String(args.setting || 'Setting');
    const val = String(args.value || 'toggle');
    return (
      <div className="mt-2.5 p-3 rounded-xl bg-[#0e1f1c] border border-teal-700/40 text-xs text-gray-200 space-y-1.5">
        <div className="flex items-center justify-between text-teal-400 font-bold uppercase tracking-wider text-[10px]">
          <span className="flex items-center gap-1.5">
            {setting === 'wifi' ? <Wifi className="w-3.5 h-3.5 text-teal-400" /> :
             setting === 'flashlight' ? <Flashlight className="w-3.5 h-3.5 text-amber-400" /> :
             setting === 'volume' ? <Volume2 className="w-3.5 h-3.5 text-teal-400" /> :
             <Sliders className="w-3.5 h-3.5 text-teal-400" />}
            <span>System Setting</span>
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-teal-900/60 text-teal-300 border border-teal-700/50">
            {statusText || 'Executed'}
          </span>
        </div>
        <div className="text-[11px] text-gray-200 font-medium">
          {setting.toUpperCase()} &rarr; <span className="text-teal-300 font-bold capitalize">{val}</span>
        </div>
      </div>
    );
  }

  if (name === 'openApp') {
    const appName = String(args.appName || 'Application');
    return (
      <div className="mt-2.5 p-3 rounded-xl bg-[#0e1f1c] border border-teal-700/40 text-xs text-gray-200 space-y-1.5">
        <div className="flex items-center justify-between text-teal-400 font-bold uppercase tracking-wider text-[10px]">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-teal-400" />
            <span>Launch App</span>
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-teal-900/60 text-teal-300 border border-teal-700/50">
            {statusText || 'Launched'}
          </span>
        </div>
        <div className="text-[11px] text-gray-200 font-medium">
          Opened <span className="text-white font-bold">{appName}</span>
        </div>
      </div>
    );
  }

  if (name === 'callAndMedia') {
    const action = String(args.action || '');
    const isCall = action === 'makeCall' || action === 'endCall';
    return (
      <div className="mt-2.5 p-3 rounded-xl bg-[#0e1f1c] border border-teal-700/40 text-xs text-gray-200 space-y-1.5">
        <div className="flex items-center justify-between text-teal-400 font-bold uppercase tracking-wider text-[10px]">
          <span className="flex items-center gap-1.5">
            {isCall ? <PhoneCall className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-teal-400" />}
            <span>{isCall ? 'Phone Call' : 'Media Playback'}</span>
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-teal-900/60 text-teal-300 border border-teal-700/50">
            {statusText || 'Executed'}
          </span>
        </div>
        <div className="text-[11px] text-gray-200 font-medium">
          {action === 'makeCall' && <>Calling <strong className="text-white">{String(args.contactName || 'Contact')}</strong></>}
          {action === 'endCall' && <>Call ended</>}
          {action === 'playMedia' && <>Playing <strong className="text-white">{String(args.query || 'music')}</strong></>}
          {action === 'pauseMedia' && <>Playback paused</>}
        </div>
      </div>
    );
  }

  if (name === 'setAlarmOrTimer') {
    const type = String(args.type || 'alarm');
    return (
      <div className="mt-2.5 p-3 rounded-xl bg-[#0e1f1c] border border-teal-700/40 text-xs text-gray-200 space-y-1.5">
        <div className="flex items-center justify-between text-teal-400 font-bold uppercase tracking-wider text-[10px]">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="capitalize">{type}</span>
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-teal-900/60 text-teal-300 border border-teal-700/50">
            {statusText || 'Scheduled'}
          </span>
        </div>
        <div className="text-[11px] text-gray-200 font-medium">
          {type === 'alarm' ? `Alarm for ${args.time || '07:00 AM'}` : `${args.minutes || 5} minute timer running`}
        </div>
      </div>
    );
  }

  if (name === 'getBatteryStatus') {
    return (
      <div className="mt-2.5 p-3 rounded-xl bg-[#0e1f1c] border border-teal-700/40 text-xs text-gray-200 space-y-1.5">
        <div className="flex items-center justify-between text-teal-400 font-bold uppercase tracking-wider text-[10px]">
          <span className="flex items-center gap-1.5">
            <BatteryCharging className="w-3.5 h-3.5 text-teal-400" />
            <span>Battery Status</span>
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-teal-900/60 text-teal-300 border border-teal-700/50">
            {statusText || '85%'}
          </span>
        </div>
        <div className="text-[11px] text-gray-200 font-medium">
          85% charged &bull; Optimal battery health
        </div>
      </div>
    );
  }

  if (name === 'systemNavigation') {
    const act = String(args.action || 'Navigation');
    return (
      <div className="mt-2.5 p-3 rounded-xl bg-[#0e1f1c] border border-teal-700/40 text-xs text-gray-200 space-y-1.5">
        <div className="flex items-center justify-between text-teal-400 font-bold uppercase tracking-wider text-[10px]">
          <span className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-teal-400" />
            <span>Navigation</span>
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-teal-900/60 text-teal-300 border border-teal-700/50">
            {statusText || 'Executed'}
          </span>
        </div>
        <div className="text-[11px] text-gray-200 font-medium capitalize">
          {act.replace(/([A-Z])/g, ' $1')}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2.5 p-3 rounded-xl bg-[#0e1f1c] border border-teal-700/40 text-xs text-gray-200 space-y-1.5">
      <div className="flex items-center justify-between text-teal-400 font-bold uppercase tracking-wider text-[10px]">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>Action</span>
        </span>
        <span className="text-[9px] px-2 py-0.5 rounded-md bg-teal-900/60 text-teal-300 border border-teal-700/50">
          {statusText || 'Executed'}
        </span>
      </div>
      <div className="text-[11px] text-gray-200 font-mono">
        {name}
      </div>
    </div>
  );
}

interface ChatScreenProps {
  messages: ChatMessage[];
  state: NovaState;
  onSendMessage: (text: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onSpeakText: (text: string) => void;
  onStopSpeaking: () => void;
  onNavigateBack: () => void;
  onNavigateToSettings: () => void;
  liveTranscript: string;
  settings: UserSettings;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  state,
  onSendMessage,
  onStartListening,
  onStopListening,
  onSpeakText,
  onStopSpeaking,
  onNavigateBack,
  onNavigateToSettings,
  liveTranscript,
  settings,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isListening = state === 'listening';
  const isThinking = state === 'thinking';
  const isSpeaking = state === 'speaking';

  // Auto-scroll to bottom on messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, liveTranscript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;
    onSendMessage(trimmed);
    setInput('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    'Send a WhatsApp message to Rahul asking about the project updates',
    'Priya ko WhatsApp par message bhejo',
    'What features are in Nova Phase 2?',
    'Hey Nova, kaise ho?',
  ];

  return (
    <div
      id="chat-screen"
      className="flex-1 flex flex-col h-full bg-[#0A0A0A] relative overflow-hidden"
    >
      {/* Top App Bar */}
      <div className="h-14 px-4 bg-[#0F0F0F] border-b border-teal-900/30 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            id="chat-back-btn"
            onClick={onNavigateBack}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-teal-400 hover:bg-white/5 transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-400 p-[1.5px] shadow-sm shadow-teal-500/20">
              <div className="w-full h-full bg-[#0A0A0A] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-teal-400" />
              </div>
              {/* Dynamic live status badge */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0A0A0A] ${
                  isSpeaking
                    ? 'bg-teal-400 animate-pulse'
                    : isListening
                    ? 'bg-teal-300 animate-ping'
                    : isThinking
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-teal-500'
                }`}
              />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-white">Nova Chat</div>
              <div className="text-[10px] font-mono text-teal-500 uppercase tracking-wider">
                {isListening
                  ? 'Listening...'
                  : isSpeaking
                  ? 'Speaking...'
                  : isThinking
                  ? 'Thinking...'
                  : 'Gemini 3.6 Flash'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onNavigateToSettings}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-teal-400 hover:bg-white/5 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Message Bubble Container */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3.5 text-sm relative group ${
                  isUser
                    ? 'bg-[#142623] text-teal-50 border border-teal-800/40 rounded-br-sm shadow-md'
                    : 'bg-[#161616] text-gray-100 border border-white/5 rounded-bl-sm shadow-md'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/5">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-teal-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-teal-400" />
                      Nova
                    </span>
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className="p-1 hover:text-teal-400 text-gray-400 transition-colors rounded"
                        title="Copy message"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3 h-3 text-teal-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      {settings.voiceRepliesEnabled && (
                        <button
                          onClick={() => {
                            if (isSpeaking) onStopSpeaking();
                            else onSpeakText(message.content);
                          }}
                          className="p-1 hover:text-teal-400 text-gray-400 transition-colors rounded"
                          title="Read aloud"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Content Rendering */}
                {isUser ? (
                  <div className="whitespace-pre-wrap leading-relaxed font-medium">{message.content}</div>
                ) : (
                  <div className="space-y-2">
                    {message.content && (
                      <div className="markdown-body leading-relaxed prose prose-invert prose-sm max-w-none text-gray-100 font-normal">
                        <Markdown>{message.content}</Markdown>
                        {message.isStreaming && (
                          <span className="inline-block w-2 h-4 ml-1 bg-teal-400 animate-pulse align-middle rounded-sm" />
                        )}
                      </div>
                    )}
                    {!message.content && message.isStreaming && (
                      <div className="flex items-center gap-2 text-xs text-teal-400 italic py-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                        <span>Processing action...</span>
                      </div>
                    )}

                    {message.functionCall && renderFunctionCallCard(message.functionCall, message.statusText)}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] font-mono text-gray-500 mt-1 px-1">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </motion.div>
          );
        })}

        {/* Live speech transcription preview */}
        {isListening && liveTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-end"
          >
            <div className="max-w-[85%] rounded-2xl p-3 bg-teal-950/40 border border-teal-800/40 text-teal-200 text-sm italic">
              <span className="text-[10px] uppercase tracking-wider block text-teal-400 font-bold mb-1">
                Transcribing...
              </span>
              "{liveTranscript}"
            </div>
          </motion.div>
        )}

        {/* Thinking Indicator */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 max-w-[120px] rounded-2xl bg-[#161616] border border-white/5"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-teal-300 animate-bounce [animation-delay:0.4s]" />
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts if few messages */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSendMessage(prompt)}
              className="text-xs whitespace-nowrap bg-[#161616] hover:bg-white/10 text-gray-300 px-3.5 py-1.5 rounded-xl border border-white/5 hover:border-teal-500/40 transition-all shrink-0 font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Input Bar */}
      <div className="p-3 bg-[#0F0F0F] border-t border-teal-900/30 shrink-0 z-20">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Mic Button */}
          <button
            type="button"
            id="chat-mic-btn"
            onClick={() => {
              if (isListening) onStopListening();
              else onStartListening();
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              isListening
                ? 'bg-teal-400 text-black animate-pulse shadow-md shadow-teal-400/40'
                : 'bg-white/5 text-gray-300 hover:text-teal-400 hover:bg-white/10 border border-white/10'
            }`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Nova or send WhatsApp..."
              className="w-full bg-[#161616] text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:outline-none focus:border-teal-400/70 focus:ring-1 focus:ring-teal-400/50 transition-all"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            id="chat-send-btn"
            disabled={!input.trim() || isThinking}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              input.trim() && !isThinking
                ? 'bg-teal-500 text-black font-bold shadow-md shadow-teal-500/30 hover:bg-teal-400 active:scale-95'
                : 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
            }`}
            title="Send"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
