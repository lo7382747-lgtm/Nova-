import React from 'react';
import {
  Wifi,
  WifiOff,
  Bluetooth,
  Flashlight,
  FlashlightOff,
  Sun,
  Volume2,
  ChevronUp,
  Moon,
  RotateCw,
  Radio,
  Bell,
  Check,
  BatteryCharging,
  Clock,
  Timer,
  Camera,
  Flame,
} from 'lucide-react';
import { SystemSettingsState } from '../../types';
import { automationService } from '../../services/automationService';

interface SimulatedQuickSettingsProps {
  settings: SystemSettingsState;
  onToggleSetting: (setting: 'wifi' | 'bluetooth' | 'flashlight' | 'dnd' | 'hotspot' | 'batterySaver' | 'autoRotate') => void;
  onChangeSlider: (setting: 'volume' | 'brightness', val: number) => void;
  onClose: () => void;
}

export const SimulatedQuickSettings: React.FC<SimulatedQuickSettingsProps> = ({
  settings,
  onToggleSetting,
  onChangeSlider,
  onClose,
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div id="simulated-quick-settings" className="flex-1 flex flex-col bg-[#0b0f17]/95 backdrop-blur-xl text-white select-none overflow-y-auto p-4 justify-between">
      {/* Top Header */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div>
            <div className="text-2xl font-light text-white">{currentTime}</div>
            <div className="text-[11px] text-teal-400 font-medium">{currentDate}</div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-gray-300"
            title="Close Quick Settings"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Settings 2x3 Tiles Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Wi-Fi Tile */}
          <button
            onClick={() => onToggleSetting('wifi')}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
              settings.wifi
                ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            <div className={`p-2 rounded-full ${settings.wifi ? 'bg-teal-500 text-black' : 'bg-white/10'}`}>
              {settings.wifi ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Internet</div>
              <div className="text-[10px] text-gray-400">{settings.wifi ? 'Connected' : 'Turned Off'}</div>
            </div>
          </button>

          {/* Bluetooth Tile */}
          <button
            onClick={() => onToggleSetting('bluetooth')}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
              settings.bluetooth
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            <div className={`p-2 rounded-full ${settings.bluetooth ? 'bg-blue-500 text-white' : 'bg-white/10'}`}>
              <Bluetooth className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Bluetooth</div>
              <div className="text-[10px] text-gray-400">{settings.bluetooth ? 'Pixel Buds' : 'Off'}</div>
            </div>
          </button>

          {/* Flashlight Tile */}
          <button
            onClick={() => onToggleSetting('flashlight')}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
              settings.flashlight
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            <div className={`p-2 rounded-full ${settings.flashlight ? 'bg-amber-400 text-black' : 'bg-white/10'}`}>
              {settings.flashlight ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Flashlight</div>
              <div className="text-[10px] text-gray-400">{settings.flashlight ? 'On' : 'Off'}</div>
            </div>
          </button>

          {/* Do Not Disturb */}
          <button
            onClick={() => onToggleSetting('dnd')}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
              settings.dnd
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            <div className={`p-2 rounded-full ${settings.dnd ? 'bg-purple-500 text-white' : 'bg-white/10'}`}>
              <Moon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Do Not Disturb</div>
              <div className="text-[10px] text-gray-400">{settings.dnd ? 'Priority Only' : 'Off'}</div>
            </div>
          </button>

          {/* Screenshot Quick Action */}
          <button
            onClick={() => automationService.takeScreenshot()}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all cursor-pointer active:scale-95"
          >
            <div className="p-2 rounded-full bg-cyan-500/20 text-cyan-400">
              <Camera className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Screenshot</div>
              <div className="text-[10px] text-gray-400">Capture Screen</div>
            </div>
          </button>

          {/* Battery Status Tile */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-300">
            <div className="p-2 rounded-full bg-teal-500/20 text-teal-400">
              <BatteryCharging className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Battery 85%</div>
              <div className="text-[10px] text-teal-400">Healthy &amp; Optimal</div>
            </div>
          </div>

          {/* Alarms & Reminders Tile */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300">
            <div className="p-2 rounded-full bg-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">
                {automationService.alarms.length > 0 ? automationService.alarms[automationService.alarms.length - 1].time : '07:00 AM'}
              </div>
              <div className="text-[10px] text-gray-400">
                {automationService.alarms.length > 0 ? automationService.alarms[automationService.alarms.length - 1].label : 'Alarm'}
              </div>
            </div>
          </div>
        </div>

        {/* Sliders for Brightness & Volume */}
        <div className="space-y-3 pt-2 bg-white/5 p-3.5 rounded-2xl border border-white/10">
          {/* Brightness */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Brightness
              </span>
              <span className="font-mono text-[10px] text-gray-400">{settings.brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.brightness}
              onChange={(e) => onChangeSlider('brightness', Number(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
            />
          </div>

          {/* Volume */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                Media Volume
              </span>
              <span className="font-mono text-[10px] text-gray-400">{settings.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume}
              onChange={(e) => onChangeSlider('volume', Number(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
            />
          </div>
        </div>

        {/* Simulated Notifications */}
        <div className="space-y-2 pt-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Bell className="w-3 h-3 text-teal-400" />
              Notifications
            </span>
            <span className="text-[9px] text-gray-500">Clear All</span>
          </div>

          <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                Nova Assistant
              </div>
              <div className="text-[11px] text-gray-300">Full Phone Control Engine Active</div>
            </div>
            <span className="text-[9px] text-gray-500 font-mono">Now</span>
          </div>

          {automationService.activeTimer && (
            <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                  Active Timer: {automationService.activeTimer.label}
                </div>
                <div className="text-[11px] text-gray-300 font-mono">
                  {Math.floor(automationService.activeTimer.remainingSeconds / 60)}m {automationService.activeTimer.remainingSeconds % 60}s remaining
                </div>
              </div>
              <span className="text-[9px] text-teal-400 font-mono">Running</span>
            </div>
          )}
        </div>
      </div>

      {/* Close Handle at Bottom */}
      <div className="pt-4 flex justify-center pb-2">
        <button
          onClick={onClose}
          className="w-24 h-1 rounded-full bg-white/30 hover:bg-white/50 cursor-pointer transition-colors"
          title="Swipe up to close"
        />
      </div>
    </div>
  );
};
