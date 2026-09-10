import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Battery,
  BatteryCharging,
  Shield,
  Smartphone,
  Lock,
  RotateCcw,
  Zap,
  VolumeX,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Activity,
  Bell,
  Sparkles,
  Info,
} from 'lucide-react';
import { NovaAssistantService } from '../services/novaAssistantService';
import { NovaAssistantServiceState } from '../types';

interface AlwaysListeningCardProps {
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onRequestRecordAudioPermission?: () => void;
  onExecuteSimulatedCommand?: (command: string) => void;
}

export const AlwaysListeningCard: React.FC<AlwaysListeningCardProps> = ({
  enabled,
  onToggleEnabled,
  onRequestRecordAudioPermission,
  onExecuteSimulatedCommand,
}) => {
  const service = NovaAssistantService.getInstance();
  const [serviceState, setServiceState] = useState<NovaAssistantServiceState>(() =>
    service.getState()
  );
  const [testLog, setTestLog] = useState<{ id: string; title: string; detail: string; success: boolean }[]>([]);
  const [selectedVoiceCommand, setSelectedVoiceCommand] = useState('Open Chrome');

  useEffect(() => {
    const unsub = service.subscribe((state) => {
      setServiceState(state);
    });
    return unsub;
  }, [service]);

  const addTestLog = (title: string, detail: string, success: boolean) => {
    setTestLog((prev) => [
      { id: `${Date.now()}-${Math.random()}`, title, detail, success },
      ...prev.slice(0, 5),
    ]);
  };

  // Test handlers
  const handleTestAppSwipeAway = () => {
    const res = service.simulateAppSwipeAway();
    addTestLog('App Swipe-Away Test', res.message, res.success);
  };

  const handleTestScreenLock = () => {
    const nextLocked = !serviceState.isScreenLocked;
    const res = service.simulateScreenLock(nextLocked);
    addTestLog(nextLocked ? 'Screen Lock Test' : 'Screen Unlock Test', res.message, res.success);
  };

  const handleTestDeviceBoot = () => {
    const res = service.simulateDeviceBoot();
    addTestLog('Phone Reboot (BOOT_COMPLETED)', res.message, res.success);
  };

  const handleTestOSKill = () => {
    const res = service.simulateOSKill();
    addTestLog('OS Kill & START_STICKY Test', res.message, res.success);
  };

  const handleTestBackgroundNoise = () => {
    const res = service.simulateBackgroundNoise('Typing & Fan Hum');
    addTestLog('Background Noise Rejection Test', res.message, res.success);
  };

  const handleTestRealVoice = () => {
    const res = service.simulateRealVoiceCommand(selectedVoiceCommand);
    addTestLog('Real Voice Command Test', res.message, res.success);
    if (onExecuteSimulatedCommand) {
      setTimeout(() => {
        onExecuteSimulatedCommand(selectedVoiceCommand);
      }, 900);
    }
  };

  const handleToggleBatteryMode = () => {
    if (serviceState.batteryLevel < 15) {
      // Restore battery
      service.setBatteryState(85, false);
      addTestLog('Battery Level Test', 'Battery restored to 85%. Service resumed listening.', true);
    } else {
      // Simulate critical battery <15%
      service.setBatteryState(12, false);
      addTestLog('Battery Auto-Pause Test', 'Battery set to 12% (<15%). Service auto-paused listening to conserve power.', true);
    }
  };

  const handleToggleCharging = () => {
    const nextCharging = !serviceState.isCharging;
    service.setBatteryState(serviceState.batteryLevel, nextCharging);
    addTestLog(
      'Charging Toggle Test',
      nextCharging
        ? `Charging connected at ${serviceState.batteryLevel}%. Service active.`
        : `Charger disconnected at ${serviceState.batteryLevel}%.`,
      true
    );
  };

  const formatUptime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div
      id="always-listening-mode-container"
      className="p-4 rounded-2xl bg-[#11161d] border border-teal-500/20 space-y-4 shadow-xl"
    >
      {/* Header & Main Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
              enabled && serviceState.isServiceRunning
                ? 'bg-teal-500/10 border-teal-500/40 text-teal-400 shadow-lg shadow-teal-500/20'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            {enabled ? <Radio className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-100">Persistent Always-Listening</h3>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  !enabled
                    ? 'bg-gray-800 text-gray-400'
                    : serviceState.isBatteryPaused
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                }`}
              >
                {!enabled
                  ? 'Disabled'
                  : serviceState.isBatteryPaused
                  ? 'Paused (<15% Bat)'
                  : 'Foreground Service Active'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Low-power VAD inside <span className="text-teal-300 font-mono">NovaAssistantService</span>
            </p>
          </div>
        </div>

        {/* Enable / Disable Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            id="toggle-always-listening"
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggleEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
        </label>
      </div>

      {/* Description & Privacy */}
      <div className="text-xs text-gray-300 leading-relaxed bg-[#0b1017] p-3 rounded-xl border border-white/5 space-y-1.5">
        <p className="flex items-start gap-1.5">
          <Shield className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <span>
            <strong>Completely silent while passive:</strong> No sound, vibration, or avatar change until genuine speech is detected via Voice Activity Detection (VAD). Background noise is silently filtered.
          </span>
        </p>
        <p className="text-[11px] text-gray-400 pl-5">
          Survives app-swipe-away, screen lock, and device reboot (BOOT_COMPLETED). Auto-pauses below 15% battery unless charging. Raw audio is never stored.
        </p>
      </div>

      {/* Persistent Notification Preview */}
      {enabled && (
        <div className="p-3 rounded-xl bg-[#0e1622] border border-teal-900/40 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1 font-mono uppercase tracking-wider text-[10px] text-teal-400">
              <Bell className="w-3 h-3" /> Android Ongoing Notification
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300">PRIORITY_LOW</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-black/40 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-200">
                  {serviceState.notification.title}
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  Uptime: {formatUptime(serviceState.serviceUptimeSeconds)}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 truncate">
                {serviceState.notification.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live VAD & Power Meters */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* VAD Status Box */}
        <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>VAD Sensor</span>
            <span
              className={`font-bold uppercase ${
                serviceState.vadState === 'speech_active'
                  ? 'text-green-400'
                  : serviceState.vadState === 'noise_filtered'
                  ? 'text-amber-400'
                  : 'text-teal-400'
              }`}
            >
              {serviceState.vadState === 'speech_active'
                ? 'Speech Active'
                : serviceState.vadState === 'noise_filtered'
                ? 'Noise Filtered'
                : 'Silent / Passive'}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono text-sm text-gray-200">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>{serviceState.lastNoiseLevel} dB</span>
            </div>
            <span className="text-[10px] text-gray-400">&gt;48 dB threshold</span>
          </div>
          {/* Audio energy bar */}
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                serviceState.lastNoiseLevel >= 48
                  ? 'bg-green-400'
                  : serviceState.lastNoiseLevel >= 35
                  ? 'bg-amber-400'
                  : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min(100, serviceState.lastNoiseLevel)}%` }}
            />
          </div>
        </div>

        {/* Battery Guard Box */}
        <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>Battery Guard</span>
            <span
              className={`font-bold ${
                serviceState.batteryLevel < 15 && !serviceState.isCharging
                  ? 'text-red-400'
                  : 'text-green-400'
              }`}
            >
              {serviceState.batteryLevel < 15 && !serviceState.isCharging ? 'Auto-Paused' : 'Listening'}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono text-sm text-gray-200">
            <div className="flex items-center gap-1.5">
              {serviceState.isCharging ? (
                <BatteryCharging className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Battery className="w-3.5 h-3.5 text-teal-400" />
              )}
              <span>{serviceState.batteryLevel}%</span>
            </div>
            <button
              onClick={handleToggleCharging}
              className="text-[10px] text-teal-400 hover:underline cursor-pointer"
            >
              {serviceState.isCharging ? 'Unplug' : 'Plug In'}
            </button>
          </div>
          {/* Battery progress */}
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                serviceState.batteryLevel < 15 && !serviceState.isCharging ? 'bg-red-500' : 'bg-teal-500'
              }`}
              style={{ width: `${serviceState.batteryLevel}%` }}
            />
          </div>
        </div>
      </div>

      {/* Verification Suite (BUILD REQUEST) */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Verification &amp; Simulation Tests
          </h4>
          <span className="text-[10px] text-gray-400">Survives OS events &amp; noise</span>
        </div>

        {/* Test Buttons Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* 1. App Swipe-Away */}
          <button
            id="test-app-swipe-away"
            onClick={handleTestAppSwipeAway}
            className="p-2.5 rounded-xl bg-[#141b24] hover:bg-[#1a2430] border border-white/5 text-left text-gray-200 flex flex-col gap-1 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-[11px] group-hover:text-teal-300">1. App Swipe-Away</span>
              <Smartphone className="w-3 h-3 text-teal-400" />
            </div>
            <span className="text-[10px] text-gray-400">Test service survives swipe</span>
          </button>

          {/* 2. Screen Lock */}
          <button
            id="test-screen-lock"
            onClick={handleTestScreenLock}
            className="p-2.5 rounded-xl bg-[#141b24] hover:bg-[#1a2430] border border-white/5 text-left text-gray-200 flex flex-col gap-1 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-[11px] group-hover:text-teal-300">
                2. {serviceState.isScreenLocked ? 'Unlock Screen' : 'Screen Lock'}
              </span>
              <Lock className="w-3 h-3 text-teal-400" />
            </div>
            <span className="text-[10px] text-gray-400">Test low-power background VAD</span>
          </button>

          {/* 3. Phone Restart */}
          <button
            id="test-phone-restart"
            onClick={handleTestDeviceBoot}
            className="p-2.5 rounded-xl bg-[#141b24] hover:bg-[#1a2430] border border-white/5 text-left text-gray-200 flex flex-col gap-1 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-[11px] group-hover:text-teal-300">3. Reboot (BOOT_COMPLETED)</span>
              <RotateCcw className="w-3 h-3 text-teal-400" />
            </div>
            <span className="text-[10px] text-gray-400">Test receiver auto-start on boot</span>
          </button>

          {/* 4. OS Kill */}
          <button
            id="test-os-kill"
            onClick={handleTestOSKill}
            className="p-2.5 rounded-xl bg-[#141b24] hover:bg-[#1a2430] border border-white/5 text-left text-gray-200 flex flex-col gap-1 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-[11px] group-hover:text-teal-300">4. OS Kill (START_STICKY)</span>
              <Zap className="w-3 h-3 text-amber-400" />
            </div>
            <span className="text-[10px] text-gray-400">Test auto-restart after kill</span>
          </button>

          {/* 5. Background Noise */}
          <button
            id="test-background-noise"
            onClick={handleTestBackgroundNoise}
            className="p-2.5 rounded-xl bg-[#141b24] hover:bg-[#1a2430] border border-white/5 text-left text-gray-200 flex flex-col gap-1 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-[11px] group-hover:text-amber-300">5. Background Noise</span>
              <VolumeX className="w-3 h-3 text-amber-400" />
            </div>
            <span className="text-[10px] text-gray-400">Verify VAD rejects non-voice</span>
          </button>

          {/* 6. Battery Auto-Pause */}
          <button
            id="test-battery-pause"
            onClick={handleToggleBatteryMode}
            className="p-2.5 rounded-xl bg-[#141b24] hover:bg-[#1a2430] border border-white/5 text-left text-gray-200 flex flex-col gap-1 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-[11px] group-hover:text-teal-300">
                6. Battery &lt;15% Pause
              </span>
              <Battery className="w-3 h-3 text-teal-400" />
            </div>
            <span className="text-[10px] text-gray-400">
              {serviceState.batteryLevel < 15 ? 'Restore 85%' : 'Set 12% (Auto-pause)'}
            </span>
          </button>
        </div>

        {/* 7. Real Speech Trigger with 850ms Silence */}
        <div className="p-2.5 rounded-xl bg-[#0c121a] border border-teal-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-200 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-green-400" /> 7. Real Speech &amp; 850ms Silence Test
            </span>
            <span className="text-[10px] text-teal-400">Processes &amp; returns silent</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedVoiceCommand}
              onChange={(e) => setSelectedVoiceCommand(e.target.value)}
              className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-teal-500"
            >
              <option value="Open Chrome">"Open Chrome"</option>
              <option value="Turn on Wi-Fi">"Turn on Wi-Fi"</option>
              <option value="Turn on flashlight">"Turn on flashlight"</option>
              <option value="Go home">"Go home"</option>
              <option value="Call Rahul">"Call Rahul"</option>
            </select>
            <button
              id="test-real-voice-command"
              onClick={handleTestRealVoice}
              className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-black" />
              <span>Simulate Voice</span>
            </button>
          </div>
        </div>

        {/* Test Execution Logs */}
        {testLog.length > 0 && (
          <div className="space-y-1 pt-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">
              Recent Verification Logs
            </span>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {testLog.map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded-lg bg-black/50 border border-white/5 text-[11px] space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-teal-300">{log.title}</span>
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                  </div>
                  <p className="text-gray-400 text-[10px] leading-tight">{log.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
