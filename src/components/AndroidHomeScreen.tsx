import React from 'react';
import {
  MessageSquare,
  Camera,
  Settings,
  Compass,
  Phone,
  Calendar,
  Clock,
  Sparkles,
  Instagram,
  Lock,
  Sliders,
  Cpu,
} from 'lucide-react';

interface AndroidHomeScreenProps {
  onOpenNova: () => void;
  onOpenWhatsApp: () => void;
  onOpenApp?: (appName: string) => void;
  onOpenQuickSettings?: () => void;
  onOpenAutomation?: () => void;
}

export const AndroidHomeScreen: React.FC<AndroidHomeScreenProps> = ({
  onOpenNova,
  onOpenWhatsApp,
  onOpenApp,
  onOpenQuickSettings,
  onOpenAutomation,
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const handleAppClick = (name: string) => {
    if (name === 'Nova') {
      onOpenNova();
    } else if (name === 'WhatsApp') {
      onOpenWhatsApp();
    } else if (name === 'Automation') {
      if (onOpenAutomation) onOpenAutomation();
      else onOpenNova();
    } else {
      onOpenApp?.(name);
    }
  };

  return (
    <div
      id="android-simulated-home"
      className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-[#090d16] via-[#0b121e] to-[#04080e] relative overflow-hidden select-none"
    >
      {/* Background ambient wallpaper elements */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-60 h-60 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Clock and Date Widget (Clickable to open Quick Settings) */}
      <div className="pt-8 text-center space-y-1">
        <h2 className="text-6xl font-extralight tracking-tight text-white/95 font-sans">
          {currentTime}
        </h2>
        <p className="text-xs uppercase tracking-widest text-teal-400 font-bold">
          {currentDate}
        </p>
        <button
          onClick={onOpenQuickSettings}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-gray-300 mt-2 cursor-pointer transition-colors"
          title="Pull down Quick Settings"
        >
          <Sliders className="w-3 h-3 text-teal-400" />
          <span>Quick Settings &amp; System Toggles</span>
        </button>
      </div>

      {/* Middle Grid of Android Apps */}
      <div className="grid grid-cols-4 gap-y-6 gap-x-3 py-4 px-1">
        {/* Nova Assistant */}
        <button
          onClick={onOpenNova}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-13 h-13 rounded-2xl bg-[#0F0F0F] border-2 border-teal-400 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-[11px] text-teal-300 font-bold tracking-tight">Nova</span>
        </button>

        {/* Google Chrome */}
        <button
          onClick={() => handleAppClick('Chrome')}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-red-500 to-blue-600 flex items-center justify-center text-white shadow group-hover:scale-105 transition-transform">
            <Compass className="w-6 h-6" />
          </div>
          <span className="text-[11px] text-gray-200 font-medium">Chrome</span>
        </button>

        {/* Instagram */}
        <button
          onClick={() => handleAppClick('Instagram')}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow group-hover:scale-105 transition-transform">
            <Instagram className="w-6 h-6" />
          </div>
          <span className="text-[11px] text-gray-200 font-medium">Instagram</span>
        </button>

        {/* WhatsApp */}
        <button
          onClick={onOpenWhatsApp}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
          <span className="text-[11px] text-gray-200 font-medium">WhatsApp</span>
        </button>

        {/* Messages / SMS */}
        <button
          onClick={() => handleAppClick('Messages')}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow group-hover:scale-105 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
          <span className="text-[11px] text-gray-200 font-medium">Messages</span>
        </button>

        {/* Phone Dialer */}
        <button
          onClick={() => handleAppClick('Phone')}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-600 flex items-center justify-center text-white shadow group-hover:scale-105 transition-transform">
            <Phone className="w-6 h-6" />
          </div>
          <span className="text-[11px] text-gray-200 font-medium">Phone</span>
        </button>

        {/* Google Pay (Sensitive Denylisted app) */}
        <button
          onClick={() => handleAppClick('Google Pay')}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow group-hover:scale-105 transition-transform relative">
            <Lock className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
          </div>
          <span className="text-[11px] text-rose-300 font-medium">GPay 🔒</span>
        </button>

        {/* Android Automation */}
        <button
          onClick={() => handleAppClick('Automation')}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-600 border border-teal-400/40 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Cpu className="w-6 h-6" />
          </div>
          <span className="text-[11px] text-teal-300 font-medium">Automation</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => handleAppClick('Settings')}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-zinc-700 to-slate-800 flex items-center justify-center text-white shadow group-hover:scale-105 transition-transform">
            <Settings className="w-6 h-6" />
          </div>
          <span className="text-[11px] text-gray-200 font-medium">Settings</span>
        </button>
      </div>

      {/* Quick launch dock bar */}
      <div className="p-3 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md flex items-center justify-around mb-2">
        <button
          onClick={() => handleAppClick('Phone')}
          className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
          title="Phone"
        >
          <Phone className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenWhatsApp}
          className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
          title="Open WhatsApp"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenNova}
          className="w-10 h-10 rounded-xl bg-teal-500/30 text-teal-300 border border-teal-500/40 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
          title="Open Nova"
        >
          <Sparkles className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleAppClick('Chrome')}
          className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
          title="Chrome"
        >
          <Compass className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
