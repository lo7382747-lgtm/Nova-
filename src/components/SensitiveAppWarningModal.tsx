import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowLeft, Home, Lock } from 'lucide-react';

interface SensitiveAppWarningModalProps {
  appName: string;
  onDismiss: () => void;
  onGoHome: () => void;
}

export const SensitiveAppWarningModal: React.FC<SensitiveAppWarningModalProps> = ({
  appName,
  onDismiss,
  onGoHome,
}) => {
  return (
    <div
      id="sensitive-app-warning-modal"
      className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm bg-gradient-to-b from-[#1c1212] to-[#120a0a] border border-red-500/30 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
        {/* Shield Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-4 text-red-400">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-1">
          Safety Guardrail Active
        </span>

        <h3 className="text-xl font-bold text-white mb-2">
          Protected Sensitive App
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed mb-5">
          Nova blocked automated interaction with <span className="font-semibold text-white">"{appName}"</span>. To protect your financial security, privacy, and biometric credentials, automated taps and screen reading are restricted in sensitive apps.
        </p>

        {/* Protection details card */}
        <div className="w-full bg-red-950/40 border border-red-500/20 rounded-2xl p-3.5 mb-6 text-left flex items-start space-x-3">
          <Lock className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-red-200/90 leading-tight">
            Banking, payments, crypto, and password managers require direct user authentication.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col space-y-2.5">
          <button
            id="btn-return-home-sensitive"
            onClick={onGoHome}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-red-950/40 transition-all active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>Return to Android Home</span>
          </button>

          <button
            id="btn-dismiss-sensitive-warning"
            onClick={onDismiss}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-700/50 transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
