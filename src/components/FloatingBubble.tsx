import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Trash2, Volume2, Sparkles, X } from 'lucide-react';
import { NovaState } from '../types';

interface FloatingBubbleProps {
  isVisible: boolean;
  state: NovaState;
  onExpand: () => void;
  onDismiss: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  liveTranscript?: string;
  lastAssistantResponse?: string;
  boundsRef: React.RefObject<HTMLDivElement | null>;
}

export const FloatingBubble: React.FC<FloatingBubbleProps> = ({
  isVisible,
  state,
  onExpand,
  onDismiss,
  onStartListening,
  onStopListening,
  liveTranscript = '',
  lastAssistantResponse = '',
  boundsRef,
}) => {
  // Bubble position inside the Android viewport
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 280, y: 160 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [showVoicePill, setShowVoicePill] = useState(false);

  const bubbleRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const longPressTimeoutRef = useRef<any>(null);
  const isDragMovedRef = useRef(false);

  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';

  // Keep voice pill open if listening, speaking, or transcript is active
  useEffect(() => {
    if (isListening || isSpeaking || liveTranscript) {
      setShowVoicePill(true);
    }
  }, [isListening, isSpeaking, liveTranscript]);

  const snapToEdge = useCallback((curX: number, curY: number) => {
    if (!boundsRef.current) return;
    const bounds = boundsRef.current.getBoundingClientRect();
    const bubbleSize = 64;
    const padding = 12;

    // Clamp Y to safe screen area
    const minY = 60;
    const maxY = bounds.height - 130;
    const clampedY = Math.max(minY, Math.min(maxY, curY));

    // Snap to left or right edge
    const midX = bounds.width / 2;
    const snapX = curX + bubbleSize / 2 < midX ? padding : bounds.width - bubbleSize - padding;

    setPosition({ x: snapX, y: clampedY });
  }, [boundsRef]);

  // Pointer down handler
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    isDragMovedRef.current = false;

    // Long press timer (500ms): triggers hands-free mic activation
    longPressTimeoutRef.current = setTimeout(() => {
      if (!isDragMovedRef.current) {
        setIsLongPressing(true);
        setShowVoicePill(true);
        onStartListening();
      }
    }, 450);
  };

  // Pointer move handler
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current.time) return;

    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      isDragMovedRef.current = true;
      if (!isDragging) setIsDragging(true);

      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    }

    if (!isDragging && !isDragMovedRef.current) return;

    if (!boundsRef.current) return;
    const bounds = boundsRef.current.getBoundingClientRect();

    const newX = e.clientX - bounds.left - 32;
    const newY = e.clientY - bounds.top - 32;

    setPosition({ x: newX, y: newY });

    // Detect collision with bottom trash drop zone
    const trashY = bounds.height - 85;
    const trashX = bounds.width / 2;
    const distToTrash = Math.hypot(newX + 32 - trashX, newY + 32 - trashY);

    setIsHoveringTrash(distToTrash < 65);
  };

  // Pointer up handler
  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }

    const target = e.currentTarget as HTMLElement;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch {}

    const pressDuration = Date.now() - pointerStartRef.current.time;

    // 1. Dropped on trash zone -> Dismiss
    if (isHoveringTrash) {
      setIsDragging(false);
      setIsHoveringTrash(false);
      onDismiss();
      return;
    }

    // 2. Long press release
    if (isLongPressing) {
      setIsLongPressing(false);
      setIsDragging(false);
      // Stop listening when finger lifted if desired, or keep listening
      return;
    }

    // 3. Quick tap (< 280ms, no drag) -> Reopen full Nova App
    if (!isDragMovedRef.current && pressDuration < 300) {
      setIsDragging(false);
      onExpand();
      return;
    }

    // 4. Finished drag -> Snap to nearest edge
    setIsDragging(false);
    snapToEdge(position.x, position.y);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Chat Head Bubble */}
      <motion.div
        ref={bubbleRef}
        id="nova-floating-bubble"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: 'none',
        }}
        animate={{
          scale: isHoveringTrash ? 0.75 : isDragging ? 1.08 : 1,
          opacity: isHoveringTrash ? 0.6 : 1,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="absolute z-50 w-16 h-16 rounded-full cursor-grab active:cursor-grabbing select-none shadow-2xl flex items-center justify-center group"
      >
        {/* Animated Glow Aura Ring */}
        <div
          className={`absolute -inset-1 rounded-full transition-opacity duration-300 blur-sm ${
            isListening
              ? 'bg-teal-400 opacity-90 animate-pulse'
              : isSpeaking
              ? 'bg-teal-300 opacity-80'
              : 'bg-teal-500/40 opacity-70 group-hover:opacity-100'
          }`}
        />

        {/* Outer Circular Frame */}
        <div className="relative w-full h-full rounded-full bg-[#0A0A0A] border-2 border-teal-400/80 p-1 flex items-center justify-center overflow-hidden shadow-inner">
          {/* Stylized Mini Female Avatar Portrait */}
          <div className="w-full h-full rounded-full bg-gradient-to-b from-[#18181b] via-[#111827] to-[#042f2e] relative flex items-center justify-center overflow-hidden">
            {/* Ambient teal backdrop */}
            <div className="absolute inset-0 bg-radial from-teal-500/30 to-transparent" />

            {/* Stylized Avatar Face */}
            <div className="relative flex flex-col items-center">
              {/* Hair strands */}
              <div className="w-9 h-7 rounded-t-full bg-[#18181b] border-t border-teal-500/60 relative">
                <div className="absolute top-1 left-1.5 w-1.5 h-3.5 bg-teal-400 rounded-full rotate-12" />
              </div>
              {/* Face */}
              <div className="w-7 h-6 rounded-b-full bg-[#f4ebe1] -mt-2 flex items-center justify-center gap-1.5 pt-1 relative shadow-inner">
                {/* Eyes */}
                <div
                  className={`w-1.5 h-1.5 rounded-full bg-[#09090b] relative flex items-center justify-center ${
                    isListening ? 'scale-110' : ''
                  }`}
                >
                  <div className="w-0.5 h-0.5 rounded-full bg-teal-400" />
                </div>
                <div
                  className={`w-1.5 h-1.5 rounded-full bg-[#09090b] relative flex items-center justify-center ${
                    isListening ? 'scale-110' : ''
                  }`}
                >
                  <div className="w-0.5 h-0.5 rounded-full bg-teal-400" />
                </div>

                {/* Mouth */}
                <div
                  className={`absolute bottom-1 w-2 rounded-full bg-[#e17070] transition-all ${
                    isSpeaking ? 'h-1.5 animate-bounce' : 'h-0.5'
                  }`}
                />
              </div>
            </div>

            {/* Microphone Indicator Badge on long press */}
            {isListening && (
              <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-teal-500 text-black flex items-center justify-center shadow">
                <Mic className="w-2.5 h-2.5" />
              </div>
            )}
          </div>
        </div>

        {/* Long-press instruction hint pill */}
        {!isDragging && (
          <div className="absolute -bottom-5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-mono text-teal-400 whitespace-nowrap uppercase tracking-wider">
            Hold to Speak
          </div>
        )}
      </motion.div>

      {/* Floating Voice Transcript & Nova Spoken Response Pill */}
      <AnimatePresence>
        {showVoicePill && (liveTranscript || isListening || isSpeaking) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            style={{
              left: position.x < 150 ? `${position.x + 72}px` : `${position.x - 220}px`,
              top: `${Math.max(40, position.y - 10)}px`,
            }}
            className="absolute z-50 w-52 p-3 rounded-2xl bg-[#0F0F0F]/95 border border-teal-500/40 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
              <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-teal-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>{isListening ? 'Listening...' : 'Nova Voice'}</span>
              </div>
              <button
                onClick={() => setShowVoicePill(false)}
                className="text-gray-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="pt-2">
              {liveTranscript ? (
                <p className="text-xs font-mono text-white leading-relaxed">
                  "{liveTranscript}"
                </p>
              ) : isListening ? (
                <p className="text-xs text-gray-400 italic">
                  Say something like "Send WhatsApp to Rahul"...
                </p>
              ) : (
                <p className="text-xs text-teal-200 font-mono leading-relaxed">
                  {lastAssistantResponse || 'Nova is active'}
                </p>
              )}
            </div>

            <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between">
              <span className="text-[8px] font-mono text-gray-400 uppercase tracking-wider">
                Tap bubble to open full app
              </span>
              <button
                onClick={onExpand}
                className="text-[9px] font-bold text-teal-400 hover:underline uppercase"
              >
                Expand →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trash Drop Zone (Appears at bottom center during drag) */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            id="floating-bubble-trash-zone"
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: isHoveringTrash ? 1.25 : 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none"
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 ${
                isHoveringTrash
                  ? 'bg-rose-600 text-white scale-110 shadow-rose-600/50'
                  : 'bg-[#161616]/90 border border-white/10 text-gray-400'
              }`}
            >
              <Trash2 className="w-6 h-6" />
            </div>
            <span
              className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${
                isHoveringTrash ? 'text-rose-400' : 'text-gray-400'
              }`}
            >
              {isHoveringTrash ? 'Release to dismiss' : 'Drag here to close'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
