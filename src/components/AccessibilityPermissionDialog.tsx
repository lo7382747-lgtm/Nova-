import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Eye, MousePointerClick, Smartphone, Check, X, Lock } from 'lucide-react';

interface AccessibilityPermissionDialogProps {
  isOpen: boolean;
  onGrant: () => void;
  onDeny: () => void;
}

export const AccessibilityPermissionDialog: React.FC<AccessibilityPermissionDialogProps> = ({
  isOpen,
  onGrant,
  onDeny,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="accessibility-permission-dialog"
      onClick={onDeny}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#111622] border border-teal-500/30 rounded-3xl p-5 text-white shadow-2xl shadow-black/90 space-y-4 relative"
      >
        {/* Close X Button */}
        <button
          onClick={onDeny}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.2)] shrink-0">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
              Android System Engine
            </span>
            <h3 className="text-base font-bold text-white leading-snug">
              Enable Full Phone Control?
            </h3>
          </div>
        </div>

        {/* Core Capabilities */}
        <p className="text-xs text-gray-300 leading-relaxed">
          To perform autonomous voice actions on your phone, Nova needs Android <strong className="text-white">Accessibility Service</strong> permissions to interact with your screen.
        </p>

        <div className="space-y-2 bg-white/5 p-3 rounded-2xl border border-white/5 text-xs">
          <div className="flex items-start gap-2.5 text-gray-200">
            <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Read Screen Elements:</strong> Identify buttons, text fields, and icons across installed apps.</span>
          </div>

          <div className="flex items-start gap-2.5 text-gray-200">
            <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Perform Gestures:</strong> Tap, type, scroll, swipe, and navigate back/home on your behalf.</span>
          </div>

          <div className="flex items-start gap-2.5 text-gray-200">
            <Lock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Security Guardrail:</strong> Banking & payment apps are strictly denylisted and protected.</span>
          </div>
        </div>

        {/* Android system navigation path */}
        <div className="p-2.5 rounded-xl bg-teal-950/40 border border-teal-800/40 text-[11px] text-teal-200">
          <div className="font-semibold text-teal-300 mb-0.5">Android System Setting Path:</div>
          <code className="text-[10px] font-mono text-teal-100">Settings &gt; Accessibility &gt; Nova Assistant &gt; Turn ON</code>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onDeny}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Not Now
          </button>
          <button
            onClick={onGrant}
            className="flex-1 py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold shadow-lg shadow-teal-500/25 transition-transform active:scale-95 cursor-pointer"
          >
            Enable &amp; Grant
          </button>
        </div>
      </motion.div>
    </div>
  );
};
