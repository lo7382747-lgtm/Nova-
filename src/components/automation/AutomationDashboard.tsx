import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Battery,
  Wifi,
  Bluetooth,
  Bell,
  Clock,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sliders,
  Trash2,
  Copy,
  Plus,
  ArrowRight,
  Radio,
  ExternalLink,
} from 'lucide-react';
import {
  automationEngine,
  automationRepository,
  deviceStateMonitor,
  automationScheduler,
  automationLogService,
  notificationAutomationService,
  confirmationManager,
  PendingConfirmation,
  AutomationDefinition,
  DeviceStateSnapshot,
  AutomationLogEntry,
  SchedulerJob,
  NaturalLanguagePlanner,
  RiskLevel,
} from '../../automation';

interface AutomationDashboardProps {
  onCreateNew?: () => void;
}

export const AutomationDashboard: React.FC<AutomationDashboardProps> = ({ onCreateNew }) => {
  const [deviceState, setDeviceState] = useState<DeviceStateSnapshot>(deviceStateMonitor.getSnapshot());
  const [automations, setAutomations] = useState<AutomationDefinition[]>(automationRepository.getAll());
  const [logs, setLogs] = useState<AutomationLogEntry[]>(automationLogService.getLogs());
  const [jobs, setJobs] = useState<SchedulerJob[]>(automationScheduler.getAllJobs());
  const [pendingConfirmations, setPendingConfirmations] = useState<PendingConfirmation[]>([]);

  const [nlInput, setNlInput] = useState('When I connect car Bluetooth, open Maps and start music');
  const [nlFeedback, setNlFeedback] = useState<string | null>(null);
  const [isProcessingNl, setIsProcessingNl] = useState(false);

  // Subscribe to device state and confirmations
  useEffect(() => {
    const unsubState = deviceStateMonitor.subscribe((state) => setDeviceState(state));
    const unsubConf = confirmationManager.subscribe((pending) => setPendingConfirmations(pending));

    return () => {
      unsubState();
      unsubConf();
    };
  }, []);

  const refreshData = () => {
    setAutomations(automationRepository.getAll());
    setLogs(automationLogService.getLogs());
    setJobs(automationScheduler.getAllJobs());
  };

  const handleRunAutomation = async (def: AutomationDefinition) => {
    await automationEngine.executeAutomationDefinition(def);
    refreshData();
  };

  const handleToggleEnable = (id: string, current: boolean) => {
    automationRepository.setEnabled(id, !current);
    refreshData();
  };

  const handleDuplicate = (id: string) => {
    automationRepository.duplicate(id);
    refreshData();
  };

  const handleDelete = (id: string) => {
    automationRepository.delete(id);
    refreshData();
  };

  const handleClearLogs = () => {
    automationLogService.clearLogs();
    setLogs([]);
  };

  const handleProcessNl = async () => {
    if (!nlInput.trim()) return;
    setIsProcessingNl(true);
    setNlFeedback(null);

    const parseRes = NaturalLanguagePlanner.planFromNaturalLanguage(nlInput);
    if (!parseRes.valid || !parseRes.plan) {
      setNlFeedback(`Parsing failed: ${parseRes.errors.join(', ')}`);
      setIsProcessingNl(false);
      return;
    }

    // Save and execute
    automationRepository.save(parseRes.plan);
    refreshData();

    setNlFeedback(`Created "${parseRes.plan.name}" with ${parseRes.plan.actions.length} actions. Executing...`);
    await automationEngine.executeAutomationDefinition(parseRes.plan);
    refreshData();
    setIsProcessingNl(false);
  };

  const handleEmergencyStop = () => {
    automationEngine.emergencyStop('User triggered emergency stop from dashboard');
    refreshData();
  };

  const handleResetStop = () => {
    automationEngine.resetEmergencyStop();
    refreshData();
  };

  const notifications = notificationAutomationService.getActiveNotifications();

  return (
    <div id="automation-dashboard" className="space-y-6">
      {/* Pending High-Risk Confirmations Modal */}
      {pendingConfirmations.length > 0 && (
        <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-amber-950 text-sm">Confirmation Required</h3>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-200 text-amber-900 uppercase">
                  {pendingConfirmations[0].riskLevel}
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Automation <strong>"{pendingConfirmations[0].automationName}"</strong> requested:{' '}
                {pendingConfirmations[0].action.title}.
              </p>
              <p className="text-[11px] text-amber-700 italic mt-0.5">{pendingConfirmations[0].reason}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => confirmationManager.respond(pendingConfirmations[0].id, false)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl transition-colors"
            >
              Deny
            </button>
            <button
              onClick={() => confirmationManager.respond(pendingConfirmations[0].id, true)}
              className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow transition-colors"
            >
              Approve & Execute
            </button>
          </div>
        </div>
      )}

      {/* Top Banner: Emergency Stop & Live State Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Device State Simulator */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Live Device State Awareness</h3>
            </div>
            <span className="text-[11px] text-slate-300">Emulating Android Hardware Sensors</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {/* Bluetooth */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 font-semibold">
                  <Bluetooth className="w-3.5 h-3.5 text-blue-400" /> Bluetooth
                </span>
                <button
                  onClick={() => {
                    const isConn = deviceState.bluetooth.connectedDevices.length > 0;
                    if (isConn) {
                      deviceStateMonitor.disconnectBluetoothDevice('Tesla Audio');
                    } else {
                      deviceStateMonitor.connectBluetoothDevice('Tesla Audio', 'car');
                    }
                  }}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                    deviceState.bluetooth.connectedDevices.length > 0
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {deviceState.bluetooth.connectedDevices.length > 0 ? 'Connected' : 'Disconnected'}
                </button>
              </div>
              <span className="text-xs font-bold text-white mt-2 truncate">
                {deviceState.bluetooth.connectedDevices[0]?.name || 'None'}
              </span>
            </div>

            {/* Battery */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 font-semibold">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" /> Battery
                </span>
                <button
                  onClick={() =>
                    deviceStateMonitor.setBattery(
                      deviceState.battery.level,
                      !deviceState.battery.isCharging,
                      !deviceState.battery.isCharging ? 'ac' : 'none'
                    )
                  }
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                    deviceState.battery.isCharging ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {deviceState.battery.isCharging ? 'Charging' : 'Unplugged'}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={deviceState.battery.level}
                  onChange={(e) =>
                    deviceStateMonitor.setBattery(parseInt(e.target.value), deviceState.battery.isCharging)
                  }
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded"
                />
                <span className="text-xs font-bold text-white">{deviceState.battery.level}%</span>
              </div>
            </div>

            {/* Wi-Fi Network */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 font-semibold">
                  <Wifi className="w-3.5 h-3.5 text-teal-400" /> Wi-Fi
                </span>
                <button
                  onClick={() =>
                    deviceStateMonitor.setNetwork(
                      !deviceState.network.isConnected,
                      deviceState.network.isConnected ? 'cellular' : 'wifi',
                      'Office_5G'
                    )
                  }
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                    deviceState.network.isConnected ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {deviceState.network.isConnected ? 'Online' : 'Offline'}
                </button>
              </div>
              <span className="text-xs font-bold text-white mt-2 truncate">
                {deviceState.network.wifiSsid || 'Cellular'}
              </span>
            </div>

            {/* Media State */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1 font-semibold">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Media
                </span>
                <button
                  onClick={() =>
                    deviceStateMonitor.setMediaPlayback(
                      !deviceState.media.isPlaying,
                      'Roadtrip Hits',
                      'Spotify'
                    )
                  }
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                    deviceState.media.isPlaying
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {deviceState.media.isPlaying ? 'PLAYING' : 'PAUSED'}
                </button>
              </div>
              <span className="text-xs font-bold text-white mt-2 truncate">
                Vol: {deviceState.media.volumePercent}% ({deviceState.media.trackTitle || 'Spotify'})
              </span>
            </div>
          </div>
        </div>

        {/* Emergency Stop Control */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Safety Latch</span>
              {automationEngine.getState().isEmergencyStopped ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  LATCHED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ENGAGED
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white mt-1">Emergency Stop</h3>
            <p className="text-xs text-slate-300 mt-1">
              Immediately halts and clears all running and queued actions. Resettable at any time.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              id="btn-emergency-stop"
              onClick={handleEmergencyStop}
              className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" /> STOP AUTOMATION
            </button>
            {automationEngine.getState().isEmergencyStopped && (
              <button
                id="btn-reset-emergency-stop"
                onClick={handleResetStop}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Natural Language Automation Planner Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Natural Language Automation Planner
          </h3>
          <span className="text-[11px] text-slate-500 font-normal">
            Converts voice/text to structured plan before execution
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={nlInput}
            onChange={(e) => setNlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleProcessNl()}
            className="flex-1 px-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="e.g. When I connect my car Bluetooth, open Maps and start my music"
          />
          <button
            id="btn-process-nl-plan"
            onClick={handleProcessNl}
            disabled={isProcessingNl}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isProcessingNl ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Formulate & Run
          </button>
        </div>

        {nlFeedback && (
          <div className="mt-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            {nlFeedback}
          </div>
        )}
      </div>

      {/* Saved Automations List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Configured Automations</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {automations.length}
            </span>
          </h3>

          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> New Automation
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {auto.trigger.type}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleEnable(auto.id, auto.enabled)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                        auto.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {auto.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug">{auto.name}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{auto.description}</p>

                <div className="mt-3 text-[11px] text-slate-600 space-y-1">
                  <div>• Actions: {auto.actions.length} steps</div>
                  <div>• Risk: <strong className={auto.riskLevel === RiskLevel.HIGH_RISK ? 'text-rose-600' : 'text-emerald-600'}>{auto.riskLevel}</strong></div>
                  <div>• Runs: {auto.executionCount || 0} times</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                <button
                  onClick={() => handleRunAutomation(auto)}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Play className="w-3 h-3" /> Run
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(auto.id)}
                    title="Duplicate"
                    className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(auto.id)}
                    title="Delete"
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications & Recent Execution Logs Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Notification Listener Service Emulation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Notification Automation Service
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                Local Only • Privacy Safe
              </span>
            </div>

            <div className="space-y-2">
              {notifications.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-4 text-center">No active notifications</div>
              ) : (
                notifications.slice(0, 3).map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {n.appName}: <span className="font-normal">{n.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-[260px]">{n.text}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => notificationAutomationService.dismissNotification(n.id)}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 rounded"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => notificationAutomationService.openNotificationApp(n.id)}
                        className="px-2 py-1 text-[11px] font-semibold bg-purple-600 text-white rounded hover:bg-purple-500"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => {
              notificationAutomationService.onNotificationPosted({
                packageName: 'com.whatsapp',
                appName: 'WhatsApp',
                title: 'New Message from Sara',
                text: 'See you at the conference room!',
              });
              refreshData();
            }}
            className="mt-3 w-full py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          >
            + Simulate Incoming Notification
          </button>
        </div>

        {/* Execution Logs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Execution History Logs
                </h3>
              </div>
              <button
                onClick={handleClearLogs}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-800"
              >
                Clear History
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-4 text-center">No execution logs recorded yet.</div>
              ) : (
                logs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{log.automationName}</span>
                      <span className="text-[11px] text-slate-500 ml-2">
                        {log.successfulActions}/{log.totalActions} steps ({log.durationMs}ms)
                      </span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.finalStatus === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.finalStatus}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
