import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2, XCircle, Sparkles, X, StopCircle } from 'lucide-react';
import { AutomationExecutionState } from '../types';

interface ActionLogOverlayProps {
  executionState: AutomationExecutionState;
  onAbort: () => void;
  onDismiss?: () => void;
}

export const ActionLogOverlay: React.FC<ActionLogOverlayProps> = ({
  executionState,
  onAbort,
  onDismiss,
}) => {
  if (!executionState.isActive && executionState.status === 'idle') {
    return null;
  }

  const { steps, currentStepIndex, title, status } = executionState;
  const isFinished = status === 'completed' || status === 'aborted' || status === 'error';

  return (
    <div
      id="automation-action-log-overlay"
      className="absolute top-12 left-3 right-3 z-50 pointer-events-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.95 }}
        className="bg-[#0b101b]/95 border border-teal-500/40 rounded-2xl p-3.5 shadow-2xl shadow-black/80 backdrop-blur-xl text-white space-y-2.5 ring-1 ring-teal-500/20"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-teal-400">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-teal-300 truncate max-w-[180px]">
                {title || 'Automating Phone...'}
              </div>
              <div className="text-[10px] text-gray-400">
                {isFinished
                  ? status === 'completed'
                    ? 'All steps completed ✓'
                    : 'Automation stopped'
                  : `Executing step ${currentStepIndex + 1} of ${steps.length}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!isFinished ? (
              <button
                onClick={onAbort}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-[10px] font-bold text-rose-300 transition-colors cursor-pointer"
                title="Stop execution"
              >
                <StopCircle className="w-3 h-3" />
                <span>Stop</span>
              </button>
            ) : onDismiss ? (
              <button
                onClick={onDismiss}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Action Steps Sequence */}
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex && !isFinished;
            const isDone = step.status === 'completed';
            const isFailed = step.status === 'failed';

            return (
              <div
                key={step.id || idx}
                className={`flex items-center justify-between p-1.5 rounded-xl text-xs transition-colors ${
                  isCurrent
                    ? 'bg-teal-500/15 border border-teal-500/30 text-white font-medium'
                    : isDone
                    ? 'bg-white/5 text-gray-300'
                    : isFailed
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    : 'text-gray-500'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-[10px] text-gray-400 shrink-0 w-3">
                    {idx + 1}.
                  </span>

                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin shrink-0" />
                  ) : isFailed ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />
                  )}

                  <span className="truncate text-[11px]">{step.title}</span>
                </div>

                {step.latencyMs ? (
                  <span className="font-mono text-[9px] text-gray-500 shrink-0 ml-1">
                    {step.latencyMs}ms
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
