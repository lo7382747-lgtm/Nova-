import React from 'react';
import { ShieldAlert, Lock, AlertTriangle, ArrowRight, Home } from 'lucide-react';

interface SensitiveAppWarningModalProps {
  appName?: string;
  onDismiss: () => void;
  onGoHome: () => void;
}

export const SensitiveAppWarningModal: React.FC<SensitiveAppWarningModalProps> = ({
  appName = 'Financial App',
  onDismiss,
  onGoHome,
}) => {
  return (
    <div id="sensitive-app-guardrail-screen" className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-[#1c1214] via-[#120e10] to-[#0a0708] text-white select-none">
      {/* Header */}
      <div className="pt-8 text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.2)]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-widest uppercase text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-800/60">
            Security Guardrail Active
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white pt-1">
            Sensitive Financial App
          </h2>
          <p className="text-xs text-gray-400">
            Autonomous screen control is restricted on financial, banking, and payment applications.
          </p>
        </div>
      </div>

      {/* Detail Card */}
      <div className="bg-white/5 border border-rose-500/20 rounded-2xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-300 leading-relaxed">
            <span className="font-semibold text-white">Nova Safeguard:</span> To protect your money, credentials, and biometrics, Nova will never autonomously tap, transfer funds, or authorize transactions on banking apps.
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-gray-400">
          We have opened <span className="text-white font-medium">{appName}</span> so you can securely complete your operation manually.
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-2 pb-4">
        <button
          onClick={onDismiss}
          className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
        >
          <span>I'll Take Over Manually</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onGoHome}
          className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return to Home Screen</span>
        </button>
      </div>
    </div>
  );
};
