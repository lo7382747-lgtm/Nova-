import React from 'react';
import { Mic, Shield, Lock } from 'lucide-react';

interface RecordAudioPermissionDialogProps {
  isOpen: boolean;
  onGrant: () => void;
  onDeny: () => void;
}

export const RecordAudioPermissionDialog: React.FC<RecordAudioPermissionDialogProps> = ({
  isOpen,
  onGrant,
  onDeny,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="record-audio-permission-modal"
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onDeny}
    >
      <div
        className="w-full max-w-xs bg-[#161616] rounded-3xl border border-teal-500/30 p-5 shadow-2xl flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner">
          <Mic className="w-7 h-7 animate-pulse" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-gray-100">
            Allow <span className="text-teal-400">Nova</span> to record audio?
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Nova needs audio permission for <span className="text-gray-200 font-medium">Persistent Always-Listening Mode</span> inside its background service.
          </p>
        </div>

        {/* Privacy badge */}
        <div className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#0c131a] border border-teal-900/30 text-[11px] text-teal-300 text-left">
          <Shield className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Raw audio is <strong className="text-white">never stored or uploaded</strong>. Only transcribed commands appear in your Activity Log.</span>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2 pt-1">
          <button
            id="audio-perm-while-using"
            onClick={onGrant}
            className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-semibold text-xs tracking-wide transition-colors shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            While using the app
          </button>
          <button
            id="audio-perm-only-this-time"
            onClick={onGrant}
            className="w-full py-2 px-4 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-gray-200 text-xs font-medium transition-colors cursor-pointer border border-white/5"
          >
            Only this time
          </button>
          <button
            id="audio-perm-dont-allow"
            onClick={onDeny}
            className="w-full py-2 px-4 rounded-xl text-gray-400 hover:text-gray-200 text-xs transition-colors cursor-pointer"
          >
            Don't allow
          </button>
        </div>
      </div>
    </div>
  );
};
