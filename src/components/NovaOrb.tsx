import React from 'react';
import { motion } from 'motion/react';
import { NovaState } from '../types';

interface NovaOrbProps {
  state: NovaState;
  onClick?: () => void;
  audioLevel?: number;
}

export const NovaOrb: React.FC<NovaOrbProps> = ({ state, onClick, audioLevel = 0 }) => {
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';
  const isSpeaking = state === 'speaking';

  return (
    <div
      id="nova-orb-container"
      className="relative flex flex-col items-center justify-center cursor-pointer select-none py-4"
      onClick={onClick}
    >
      {/* Outer Glow Halo from Design HTML */}
      <motion.div
        className="absolute rounded-full pointer-events-none bg-teal-500/20 blur-[80px]"
        animate={{
          scale: isListening ? [1.1, 1.4, 1.1] : isSpeaking ? [1.2, 1.5, 1.2] : [1, 1.15, 1],
          opacity: isListening ? 0.8 : isSpeaking ? 0.9 : isThinking ? 0.7 : 0.4,
        }}
        transition={{
          repeat: Infinity,
          duration: isSpeaking ? 1.4 : isThinking ? 1.8 : 3,
          ease: 'easeInOut',
        }}
        style={{
          width: '260px',
          height: '260px',
        }}
      />

      {/* Ripple Rings for Voice/Listening */}
      {(isListening || isSpeaking) && (
        <>
          <motion.div
            className="absolute rounded-full border border-teal-400/30 pointer-events-none"
            animate={{
              scale: [1, 1.6],
              opacity: [0.7, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              ease: 'easeOut',
            }}
            style={{ width: '220px', height: '220px' }}
          />
        </>
      )}

      {/* Outer Concentric Ring (Border-2 border-teal-400/30) */}
      <motion.div
        className="w-52 h-52 rounded-full border-2 border-teal-400/30 flex items-center justify-center relative z-10"
        animate={{
          scale: isListening ? [1, 1.05, 1] : isSpeaking ? [1, 1.08, 0.98, 1.04] : [1, 1.02, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: isListening ? 1.4 : isSpeaking ? 1 : 4,
          ease: 'easeInOut',
        }}
      >
        {/* Inner Concentric Ring (Border border-teal-400/50) */}
        <div className="w-44 h-44 rounded-full border border-teal-400/50 flex items-center justify-center">
          {/* Main Core Orb (Gradient from-teal-600 to-cyan-400) */}
          <motion.div
            className="relative w-36 h-36 rounded-full bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-400 shadow-[0_0_50px_rgba(45,212,191,0.45)] flex items-center justify-center overflow-hidden"
            animate={{
              scale: isListening
                ? [1, 1.06 + audioLevel * 0.12, 1]
                : isSpeaking
                ? [1, 1.08 + audioLevel * 0.15, 0.98, 1.05]
                : isThinking
                ? [1, 1.04, 0.96, 1]
                : [1, 1.03, 1],
              rotate: isThinking ? [0, 360] : [0, 180, 360],
            }}
            transition={{
              scale: {
                repeat: Infinity,
                duration: isListening ? 1.2 : isSpeaking ? 0.9 : isThinking ? 1.6 : 4,
                ease: 'easeInOut',
              },
              rotate: {
                repeat: Infinity,
                duration: isThinking ? 4 : 24,
                ease: 'linear',
              },
            }}
          >
            {/* Inner rotating light aura */}
            <motion.div
              className="absolute inset-2 rounded-full opacity-40 mix-blend-overlay"
              animate={{
                rotate: [360, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 12,
                ease: 'linear',
              }}
              style={{
                background: 'conic-gradient(from 0deg, transparent, #2dd4bf, #22d3ee, transparent)',
              }}
            />

            {/* Specular Highlight Reflection */}
            <div className="absolute top-3 left-5 w-12 h-6 rounded-full bg-white/30 filter blur-[1px] transform -rotate-25 pointer-events-none" />

            {/* Center Nucleus Pulse */}
            <motion.div
              className="w-10 h-10 rounded-full bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.8)] flex items-center justify-center filter blur-[0.5px]"
              animate={{
                scale: isSpeaking ? [0.9, 1.3, 0.85, 1.1] : isListening ? [0.8, 1.2, 0.8] : [0.9, 1.05, 0.9],
                opacity: isThinking ? [0.5, 0.95, 0.5] : [0.8, 0.98, 0.8],
              }}
              transition={{
                repeat: Infinity,
                duration: isSpeaking ? 0.7 : isListening ? 1 : 2.5,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Reactive Multi-Bar Waveform Underneath */}
      <div className="flex items-center gap-1.5 h-6 mt-6 z-10">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const heights = isSpeaking
            ? [8, 22, 12, 28, 16, 24, 10]
            : isListening
            ? [6, 16, 24, 18, 22, 14, 8]
            : isThinking
            ? [8, 12, 16, 12, 16, 10, 8]
            : [3, 5, 7, 5, 7, 5, 3];

          return (
            <motion.span
              key={i}
              className="w-1 rounded-full"
              animate={{
                height: heights[i],
                opacity: isListening || isSpeaking ? [0.7, 1, 0.7] : 0.35,
              }}
              transition={{
                repeat: Infinity,
                duration: isSpeaking ? 0.5 + i * 0.08 : isListening ? 0.8 + i * 0.1 : 2,
                ease: 'easeInOut',
              }}
              style={{
                backgroundColor: isListening ? '#2dd4bf' : isSpeaking ? '#14b8a6' : '#374151',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
