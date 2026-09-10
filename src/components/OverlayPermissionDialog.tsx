import React from 'react';
import { motion } from 'motion/react';
import { Layers, ShieldCheck, Check, X, ExternalLink } from 'lucide-react';

interface OverlayPermissionDialogProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export const OverlayPermissionDialog: React.FC<OverlayPermissionDialogProps> = ({
  isOpen,
  onAllow,
  onDeny,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="overlay-permission-backdrop"
      className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        id="overlay-permission-card"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-sm bg-[#0F0F0F] border border-teal-900/40 rounded-3xl shadow-2xl p-6 text-center space-y-5"
      >
        {/* Permission Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-950/60 border border-teal-800/40 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-950/50">
          <Layers className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-teal-500 uppercase tracking-[0.2em]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Special App Access</span>
          </div>
          <h3 className="text-base font-bold uppercase tracking-tight text-white">
            Display Over Other Apps
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed px-2">
            Nova needs permission to show a floating chat head bubble on top of other apps, allowing you to quickly talk with Nova without leaving your current screen.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#161616] border border-white/5 text-[11px] text-gray-400 text-left space-y-1.5">
          <div className="font-bold text-white flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            <span>Android System Requirement</span>
          </div>
          <p className="text-gray-400 leading-relaxed">
            Unlike standard permissions, Android requires you to explicitly toggle{' '}
            <code className="text-teal-300 font-mono text-[10px] bg-white/5 px-1 py-0.5 rounded">
              SYSTEM_ALERT_WINDOW
            </code>{' '}
            in System Settings.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            id="allow-overlay-permission-btn"
            onClick={onAllow}
            className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Grant & Open Settings</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </button>

          <button
            id="deny-overlay-permission-btn"
            onClick={onDeny}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider border border-white/10 transition-colors flex items-center justify-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Not Now</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
