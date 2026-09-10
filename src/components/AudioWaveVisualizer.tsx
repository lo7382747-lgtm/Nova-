import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { NovaState } from '../types';

interface AudioWaveVisualizerProps {
  state: NovaState;
  className?: string;
}

export const AudioWaveVisualizer: React.FC<AudioWaveVisualizerProps> = ({
  state,
  className = '',
}) => {
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking';

  // Generate dynamic bar heights
  const [heights, setHeights] = useState<number[]>([
    20, 35, 60, 45, 80, 95, 70, 85, 90, 65, 75, 50, 60, 40, 30, 20,
  ]);

  useEffect(() => {
    if (!isListening && !isSpeaking) return;

    const interval = setInterval(() => {
      setHeights((prev) =>
        prev.map(() => {
          if (isSpeaking) {
            // High energy voice speech wave
            return Math.floor(Math.random() * 65) + 30;
          }
          if (isListening) {
            // Ambient listening audio input pulse
            return Math.floor(Math.random() * 55) + 20;
          }
          return 15;
        })
      );
    }, 110);

    return () => clearInterval(interval);
  }, [isListening, isSpeaking]);

  if (state === 'idle') return null;

  const getBarColor = (index: number) => {
    if (isSpeaking) {
      return index % 2 === 0
        ? 'bg-gradient-to-t from-teal-500 to-cyan-300'
        : 'bg-gradient-to-t from-teal-400 to-emerald-300';
    }
    if (isThinking) {
      return 'bg-gradient-to-t from-amber-500/80 to-amber-300/80';
    }
    return index % 2 === 0
      ? 'bg-gradient-to-t from-teal-600 to-teal-300'
      : 'bg-gradient-to-t from-cyan-600 to-cyan-400';
  };

  return (
    <div
      id="audio-wave-visualizer"
      className={`flex items-center justify-center gap-1 sm:gap-1.5 px-4 py-2 ${className}`}
    >
      {heights.map((h, i) => (
        <motion.div
          key={i}
          animate={{
            height: isThinking ? [12, 28, 12] : `${h}%`,
            opacity: isThinking ? [0.4, 0.9, 0.4] : 1,
          }}
          transition={{
            duration: isThinking ? 0.8 : 0.15,
            repeat: isThinking ? Infinity : 0,
            delay: isThinking ? i * 0.05 : 0,
            ease: 'easeInOut',
          }}
          className={`w-1 sm:w-1.5 rounded-full ${getBarColor(i)} shadow-[0_0_6px_rgba(45,212,191,0.4)]`}
          style={{ minHeight: '6px', maxHeight: '36px' }}
        />
      ))}
    </div>
  );
};
