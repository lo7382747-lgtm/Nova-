import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PhoneOff, Mic, MicOff, Volume2, Grid, Pause, User } from 'lucide-react';

interface SimulatedPhoneCallProps {
  contactName?: string;
  onEndCall: () => void;
}

export const SimulatedPhoneCall: React.FC<SimulatedPhoneCallProps> = ({
  contactName = 'Rahul Sharma',
  onEndCall,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (total: number) => {
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="simulated-phone-call-screen" className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-[#0b1322] via-[#090f1a] to-[#040810] text-white select-none">
      {/* Top Status */}
      <div className="pt-6 text-center space-y-1">
        <span className="text-[10px] tracking-widest uppercase text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
          ● HD Voice Call
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-white pt-2">{contactName}</h2>
        <p className="text-xs text-gray-400 font-mono">{formatTime(seconds)}</p>
      </div>

      {/* Center Animated Ripples and Avatar */}
      <div className="flex flex-col items-center justify-center my-auto">
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0.05, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-44 h-44 rounded-full bg-teal-500/20"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            className="absolute w-36 h-36 rounded-full bg-emerald-500/30"
          />
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-3xl font-bold shadow-[0_0_30px_rgba(20,184,166,0.3)]">
            {contactName.substring(0, 1)}
          </div>
        </div>
        <p className="text-xs text-gray-300 mt-6">Active via Cellular Voice Engine</p>
      </div>

      {/* Action Buttons Pad */}
      <div className="space-y-6 pb-6">
        <div className="grid grid-cols-3 gap-4 px-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-colors ${
              isMuted ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-white/5 border-white/10 text-gray-300'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px]">{isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          <button
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-colors ${
              isSpeaker ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' : 'bg-white/5 border-white/10 text-gray-300'
            }`}
          >
            <Volume2 className="w-5 h-5" />
            <span className="text-[10px]">{isSpeaker ? 'Speaker On' : 'Speaker'}</span>
          </button>

          <button className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300">
            <Grid className="w-5 h-5" />
            <span className="text-[10px]">Keypad</span>
          </button>
        </div>

        {/* Big End Call Button */}
        <div className="flex justify-center">
          <button
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-xl shadow-rose-600/30 active:scale-95 transition-transform cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
