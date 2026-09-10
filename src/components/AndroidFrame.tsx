import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Signal,
  Battery,
  BatteryCharging,
  Smartphone,
  Maximize2,
  Sparkles,
  Lock,
  Unlock,
  ChevronDown,
  Bell,
  Radio,
  Sliders,
} from 'lucide-react';
import { NovaAssistantService } from '../services/novaAssistantService';
import { NovaAssistantServiceState } from '../types';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeScreenTitle?: string;
  onHomePress?: () => void;
  onOpenSettings?: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  onHomePress,
  onOpenSettings,
}) => {
  const [isPhoneShell, setIsPhoneShell] = useState(true);
  const [time, setTime] = useState('09:41');
  const [showNotificationShade, setShowNotificationShade] = useState(false);

  const service = NovaAssistantService.getInstance();
  const [serviceState, setServiceState] = useState<NovaAssistantServiceState>(() =>
    service.getState()
  );

  useEffect(() => {
    const unsub = service.subscribe((s) => setServiceState(s));
    return unsub;
  }, [service]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-0 sm:p-4 text-white selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top utility bar on desktop */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[430px] mb-3 px-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-teal-400">
            Nova Android OS
          </span>
        </div>
        <div className="flex items-center gap-2">
          {serviceState.isServiceRunning && (
            <button
              onClick={() => setShowNotificationShade(!showNotificationShade)}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20 hover:bg-teal-500/20 transition-colors cursor-pointer"
              title="Toggle Android Notification Drawer"
            >
              <Bell className="w-3 h-3" />
              <span>Notification</span>
            </button>
          )}
          <button
            id="toggle-view-btn"
            onClick={() => setIsPhoneShell(!isPhoneShell)}
            className="flex items-center gap-1.5 hover:text-teal-400 transition-colors bg-[#0F0F0F] px-3 py-1 rounded-xl border border-teal-900/30 text-[10px] uppercase tracking-widest font-bold text-gray-300"
            title="Toggle between Android device frame and expanded view"
          >
            {isPhoneShell ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Full Width</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-teal-400" />
                <span>Phone Shell</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 relative flex flex-col bg-[#0A0A0A] ${
          isPhoneShell
            ? 'max-w-[430px] h-[95vh] max-h-[890px] rounded-[44px] shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_50px_rgba(20,184,166,0.08)] border-[5px] border-[#181818] overflow-hidden'
            : 'max-w-4xl min-h-[90vh] rounded-2xl border border-teal-900/30 shadow-2xl overflow-hidden'
        }`}
      >
        {/* Android Status Bar */}
        <div
          onClick={() => setShowNotificationShade(!showNotificationShade)}
          className="h-11 px-6 flex items-center justify-between bg-[#0A0A0A] text-gray-300 text-xs font-mono select-none z-30 shrink-0 border-b border-white/[0.03] cursor-pointer hover:bg-white/[0.02] transition-colors"
          title="Click status bar to toggle notification shade"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wider text-gray-200">{time}</span>

            {/* Persistent Listening Notification Icon */}
            {serviceState.isServiceRunning && (
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-colors ${
                  serviceState.isBatteryPaused
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-teal-500/20 text-teal-300'
                }`}
                title="Nova foreground service listening"
              >
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span className="text-[9px] font-sans">
                  {serviceState.isBatteryPaused ? 'Paused' : 'Nova'}
                </span>
              </div>
            )}
          </div>

          {/* Android Punch-hole Camera */}
          {isPhoneShell && (
            <div className="w-3.5 h-3.5 rounded-full bg-[#050505] border border-[#222222] shadow-inner" />
          )}

          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-[10px] font-bold text-teal-400 tracking-wider">5G</span>
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-1 text-[10px] text-gray-300">
              {serviceState.isCharging ? (
                <BatteryCharging className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Battery
                  className={`w-3.5 h-3.5 ${
                    serviceState.batteryLevel < 15 ? 'text-red-400' : 'text-gray-200'
                  }`}
                />
              )}
              <span>{serviceState.batteryLevel}%</span>
            </div>
          </div>
        </div>

        {/* Android Notification Shade Drawer (Pull-Down) */}
        {showNotificationShade && (
          <div
            id="android-notification-shade"
            className="absolute top-11 inset-x-0 z-40 bg-[#090d14]/95 backdrop-blur-md border-b border-teal-500/20 p-4 space-y-3 animate-in slide-in-from-top duration-200 shadow-2xl"
          >
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span className="font-bold uppercase tracking-wider text-teal-400 text-[10px] flex items-center gap-1">
                <Bell className="w-3 h-3" /> Android Notifications
              </span>
              <button
                onClick={() => setShowNotificationShade(false)}
                className="text-[10px] text-gray-400 hover:text-white"
              >
                Close Shade
              </button>
            </div>

            {/* Low-Priority Persistent Ongoing Notification */}
            {serviceState.isServiceRunning ? (
              <div
                onClick={() => {
                  setShowNotificationShade(false);
                  onOpenSettings?.();
                }}
                className="p-3 rounded-2xl bg-[#111823] border border-teal-500/30 flex items-center gap-3 cursor-pointer hover:bg-[#151f2e] transition-colors shadow-lg"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-100">
                      {serviceState.notification.title}
                    </span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                      Ongoing • LOW
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 truncate">
                    {serviceState.notification.subtitle}
                  </p>
                  <p className="text-[10px] text-teal-400/80 mt-0.5">
                    Tap to open Always-Listening settings &amp; test suite
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-xs text-gray-400 text-center">
                No active background services.
              </div>
            )}
          </div>
        )}

        {/* Screen Content or Lock Screen Overlay */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-[#0A0A0A]">
          {serviceState.isScreenLocked ? (
            <div
              id="simulated-lock-screen"
              className="absolute inset-0 z-40 bg-gradient-to-b from-[#020509] via-[#060b13] to-[#010306] flex flex-col items-center justify-between p-8 select-none"
            >
              <div className="pt-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gray-400 mb-2">
                  <Lock className="w-5 h-5 text-teal-400" />
                </div>
                <h2 className="text-5xl font-extralight tracking-tight text-white/95 font-mono">
                  {time}
                </h2>
                <p className="text-xs uppercase tracking-widest text-teal-400 font-bold">
                  Device Locked • Screen OFF
                </p>
              </div>

              {/* Ongoing notification on lockscreen */}
              {serviceState.isServiceRunning && (
                <div className="w-full max-w-xs p-3 rounded-2xl bg-black/50 border border-teal-500/20 flex items-center gap-3 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-gray-200 block">
                      Nova is listening
                    </span>
                    <p className="text-[10px] text-gray-400">
                      Low-power VAD background service active
                    </p>
                  </div>
                </div>
              )}

              {/* Unlock Button */}
              <button
                id="unlock-screen-btn"
                onClick={() => service.simulateScreenLock(false)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-gray-200 tracking-wider font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5 text-teal-400" />
                <span>Swipe or Tap to Unlock</span>
              </button>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Android Navigation Gesture Bar */}
        <div className="h-6 bg-[#0A0A0A] flex items-center justify-center shrink-0 z-30 border-t border-white/[0.02]">
          <button
            id="android-home-gesture-bar"
            onClick={onHomePress}
            title="Press Home (Minimizes Nova to Floating Bubble)"
            className="w-32 h-2.5 flex items-center justify-center group focus:outline-none cursor-pointer py-1"
          >
            <div className="w-28 h-1 bg-gray-700/60 rounded-full group-hover:bg-teal-400 group-hover:w-32 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
};

