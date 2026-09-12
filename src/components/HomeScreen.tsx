import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Settings, MessageSquare, Volume2, VolumeX, Sparkles, ArrowRight, Minimize2, UserCheck, CircleDot, Zap, Globe } from 'lucide-react';
import { NovaState, ChatMessage, UserSettings } from '../types';
import { NovaOrb } from './NovaOrb';
import { Nova3DAvatar } from './Nova3DAvatar';
import { AudioWaveVisualizer } from './AudioWaveVisualizer';
import { SmartActionChips } from './SmartActionChips';

interface HomeScreenProps {
  state: NovaState;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onNavigateToChat: () => void;
  onNavigateToSettings: () => void;
  recentMessages: ChatMessage[];
  settings: UserSettings;
  liveTranscript: string;
  onSendMessage?: (text: string) => void;
  onSelectSuggestion?: (text: string) => void;
  onToggleAvatarMode?: () => void;
  onMinimizeToBubble?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  state,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onNavigateToChat,
  onNavigateToSettings,
  recentMessages,
  settings,
  liveTranscript,
  onSendMessage,
  onSelectSuggestion,
  onToggleAvatarMode,
  onMinimizeToBubble,
}) => {
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking';
  const is3DAvatar = (settings.avatarVisualMode ?? 'avatar') === 'avatar';

  // Last message from Nova or user to preview
  const lastMessage = recentMessages[recentMessages.length - 1];

  const getStatusText = () => {
    if (isListening) {
      return liveTranscript ? `"${liveTranscript}"` : 'Listening... Speak now';
    }
    if (isThinking) {
      return 'Nova is thinking...';
    }
    if (isSpeaking) {
      return 'Nova is speaking...';
    }
    return 'Tap avatar or mic to speak with Nova';
  };

  return (
    <div
      id="home-screen"
      className="flex-1 flex flex-col justify-between p-5 sm:p-6 bg-[#0A0A0A] relative overflow-hidden"
    >
      {/* Background ambient lighting from Design */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Header - Bold Typography NOVA title */}
      <div className="flex items-start justify-between z-10 w-full">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-teal-900/30 uppercase">
            NOVA
          </h1>
          <p className="text-teal-400 text-[10px] sm:text-[11px] tracking-[0.35em] font-bold mt-1.5 uppercase">
            Core Assistant v1.0
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400">
              Gemini 3.6 Connected
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/30">
              🇮🇳 EN + HI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Minimize to Floating Bubble Button */}
          {onMinimizeToBubble && (
            <button
              id="minimize-bubble-btn"
              onClick={onMinimizeToBubble}
              className="w-8 h-8 rounded-xl bg-[#0F0F0F] border border-teal-900/30 flex items-center justify-center text-teal-400 hover:bg-teal-500/10 transition-colors"
              title="Minimize to Floating Bubble"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}

          {/* Turbo Mode Pill */}
          {settings.turboMode && (
            <button
              onClick={() => onNavigateToSettings()}
              className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1.5 rounded-xl shadow-[0_0_8px_rgba(245,158,11,0.15)]"
              title="Turbo Low-Latency Engine Enabled"
            >
              <Zap className="w-3 h-3 fill-amber-400" />
              <span>Turbo</span>
            </button>
          )}

          {/* Voice status pill */}
          <button
            onClick={() => onNavigateToSettings()}
            className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1.5 rounded-xl border transition-colors ${
              settings.voiceRepliesEnabled
                ? 'bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-[0_0_8px_rgba(20,184,166,0.15)]'
                : 'bg-white/5 text-gray-400 border-white/10'
            }`}
            title="Configure Natural Voice & Clarity"
          >
            {settings.voiceRepliesEnabled ? (
              <>
                <Volume2 className="w-3 h-3 text-teal-400 animate-pulse" />
                <span>
                  {settings.voicePersona === 'calm_relaxed'
                    ? 'Calm & Measured'
                    : settings.voicePersona === 'indian_bilingual'
                    ? 'Bilingual Voice'
                    : settings.voicePersona === 'crystal_clear'
                    ? 'Clear Studio'
                    : 'Natural Voice'}
                </span>
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3 text-gray-400" />
                <span>Muted</span>
              </>
            )}
          </button>

          <button
            id="settings-btn"
            onClick={onNavigateToSettings}
            className="w-8 h-8 rounded-xl bg-[#0F0F0F] border border-teal-900/30 flex items-center justify-center text-gray-400 hover:text-teal-400 hover:border-teal-400/50 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Section: 3D Female Avatar or Animated Nova Orb */}
      <div className="flex flex-col items-center justify-center my-auto z-10 py-1">
        {is3DAvatar ? (
          <Nova3DAvatar
            state={state}
            onClick={() => {
              if (isListening) onStopListening();
              else if (isSpeaking) onStopSpeaking();
              else onStartListening();
            }}
            size={280}
            onFallbackToOrb={onToggleAvatarMode}
          />
        ) : (
          <NovaOrb
            state={state}
            onClick={() => {
              if (isListening) onStopListening();
              else if (isSpeaking) onStopSpeaking();
              else onStartListening();
            }}
          />
        )}

        {/* Quick Toggle between 3D Avatar and Orb */}
        {onToggleAvatarMode && (
          <div className="mt-3 flex items-center gap-1 p-1 rounded-xl bg-[#121212] border border-white/5">
            <button
              onClick={() => {
                if (!is3DAvatar) onToggleAvatarMode();
              }}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                is3DAvatar
                  ? 'bg-teal-500 text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3 h-3" />
              <span>3D Avatar</span>
            </button>
            <button
              onClick={() => {
                if (is3DAvatar) onToggleAvatarMode();
              }}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                !is3DAvatar
                  ? 'bg-teal-500 text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CircleDot className="w-3 h-3" />
              <span>Orb</span>
            </button>
          </div>
        )}

        {/* Dynamic Status Text - Monospace tracked uppercase */}
        <div className="mt-3 text-center px-4 max-w-xs min-h-[36px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={getStatusText()}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`text-xs font-mono uppercase tracking-widest ${
                isListening
                  ? 'text-teal-400 font-bold'
                  : isSpeaking
                  ? 'text-teal-300 font-semibold'
                  : isThinking
                  ? 'text-gray-300 animate-pulse'
                  : 'text-teal-500 font-bold'
              }`}
            >
              {getStatusText()}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Audio Waveform visualizer when listening or speaking */}
        {state !== 'idle' && (
          <div className="w-full max-w-xs flex justify-center py-1">
            <AudioWaveVisualizer state={state} />
          </div>
        )}

        {/* Dynamic Categorized Smart Suggestion Chips */}
        {state === 'idle' && onSelectSuggestion && (
          <SmartActionChips onSelectSuggestion={onSelectSuggestion} />
        )}

        {/* Interrupt button if Nova is speaking */}
        {isSpeaking && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onStopSpeaking}
            className="mt-2 text-[10px] font-bold uppercase tracking-widest bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 px-4 py-1.5 rounded-xl border border-teal-500/30 transition-colors shadow-sm"
          >
            Tap to interrupt
          </motion.button>
        )}
      </div>

      {/* Bottom Section: Tap-to-Talk Action Bar from Design HTML */}
      <div className="flex flex-col items-center gap-3 z-10">
        <div className="w-full max-w-md flex items-center gap-3 bg-[#161616] p-3 rounded-3xl border border-white/5 shadow-2xl">
          {/* Mic Action Button */}
          <div className="relative flex items-center justify-center">
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-2xl bg-teal-400/30"
                animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
              />
            )}

            <motion.button
              id="tap-to-talk-btn"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (isListening) onStopListening();
                else onStartListening();
              }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isListening
                  ? 'bg-teal-400 text-black shadow-lg shadow-teal-400/50'
                  : 'bg-teal-500 text-black hover:bg-teal-400 shadow-md shadow-teal-500/25'
              }`}
              title={isListening ? 'Stop listening' : 'Tap to talk'}
            >
              {isListening ? (
                <MicOff className="w-5 h-5 animate-pulse" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          {/* Quick Chat Snippet or Active Live Voice Feedback */}
          <div
            onClick={isListening ? undefined : onNavigateToChat}
            className={`flex-1 overflow-hidden ${isListening ? '' : 'cursor-pointer group'}`}
          >
            {isListening ? (
              <p className="text-xs text-teal-300 font-medium truncate flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping inline-block flex-shrink-0" />
                <span className="truncate">
                  {liveTranscript ? `"${liveTranscript}"` : 'Listening... speak now'}
                </span>
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic truncate group-hover:text-gray-200 transition-colors">
                {lastMessage
                  ? `"${lastMessage.content.slice(0, 45)}..."`
                  : '"Nova, show me how to send a WhatsApp..."'}
              </p>
            )}
          </div>

          {/* Action Button: Send Now when speaking, or Chat Trigger */}
          {isListening && liveTranscript.trim() && onSendMessage ? (
            <button
              id="instant-send-voice-btn"
              onClick={() => {
                const text = liveTranscript.trim();
                onStopListening();
                onSendMessage(text);
              }}
              className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-teal-400 text-black hover:bg-teal-300 transition-all flex items-center gap-1 shrink-0 shadow-md shadow-teal-400/30"
            >
              <Zap className="w-3 h-3 fill-black" />
              Send
            </button>
          ) : (
            <button
              id="open-chat-btn"
              onClick={onNavigateToChat}
              className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-colors shrink-0"
            >
              Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
