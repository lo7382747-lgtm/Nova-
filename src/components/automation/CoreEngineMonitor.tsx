import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Clock,
  RefreshCw,
  Shield,
  ShieldAlert,
  Zap,
  Play,
  RotateCcw,
  Sliders,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import {
  automationEngine,
  AutomationEngineState,
  ExecutionState,
  ActionType,
  Action,
  AutomationPermissionManager,
  PermissionStatus,
} from '../../automation';

export const CoreEngineMonitor: React.FC = () => {
  const [engineState, setEngineState] = useState<AutomationEngineState>(() =>
    automationEngine.getState()
  );
  const [permissions, setPermissions] = useState<PermissionStatus[]>(() =>
    AutomationPermissionManager.getInstance().getAllPermissions()
  );

  useEffect(() => {
    const unsub = automationEngine.onStateChange((st) => {
      setEngineState(st);
    });
    const unsubPerm = AutomationPermissionManager.getInstance().addListener((perms) => {
      setPermissions(perms);
    });
    return () => {
      unsub();
      unsubPerm();
    };
  }, []);

  const getStateBadgeStyle = (state: ExecutionState) => {
    switch (state) {
      case ExecutionState.IDLE:
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case ExecutionState.PLANNING:
        return 'bg-blue-950/70 text-blue-300 border-blue-600 animate-pulse';
      case ExecutionState.VALIDATING:
        return 'bg-amber-950/70 text-amber-300 border-amber-600';
      case ExecutionState.WAITING_PERMISSION:
        return 'bg-purple-950/70 text-purple-300 border-purple-600';
      case ExecutionState.WAITING_CONFIRMATION:
        return 'bg-orange-950/70 text-orange-300 border-orange-600';
      case ExecutionState.EXECUTING:
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500 animate-pulse ring-2 ring-cyan-500/30';
      case ExecutionState.VERIFYING:
        return 'bg-indigo-950/70 text-indigo-300 border-indigo-600';
      case ExecutionState.RETRYING:
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-500 animate-bounce';
      case ExecutionState.COMPLETED:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600';
      case ExecutionState.FAILED:
        return 'bg-rose-950/80 text-rose-300 border-rose-600';
      case ExecutionState.CANCELLED:
        return 'bg-red-950/80 text-red-300 border-red-600';
      case ExecutionState.TIMEOUT:
        return 'bg-orange-950/80 text-orange-300 border-orange-600';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const handleTestPlan = () => {
    automationEngine.executePlan('Sample YouTube Workflow', [
      {
        actionType: ActionType.APP_ACTION,
        title: 'Launch YouTube App',
        parameters: { appName: 'YouTube', packageName: 'com.google.android.youtube' },
        timeout: 5000,
        retryCount: 2,
      },
      {
        actionType: ActionType.UI_ACTION,
        title: 'Click Search Button',
        parameters: { operation: 'click', contentDescription: 'Search YouTube' },
        timeout: 4000,
        retryCount: 2,
      },
      {
        actionType: ActionType.TEXT_ACTION,
        title: 'Enter Search Query',
        parameters: { operation: 'enter', text: 'Relaxing ambient music' },
        timeout: 4000,
        retryCount: 1,
      },
    ]);
  };

  return (
    <div id="core-engine-monitor" className="space-y-4">
      {/* State Machine Overview Header */}
      <div className="p-4 rounded-2xl bg-[#121820] border border-white/10 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                  State Machine
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black border uppercase tracking-wider ${getStateBadgeStyle(
                    engineState.engineState
                  )}`}
                >
                  {engineState.engineState}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                {engineState.currentPlanTitle
                  ? `Active Routine: ${engineState.currentPlanTitle}`
                  : 'Engine ready for next structured action plan'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {engineState.isEmergencyStopped ? (
              <button
                onClick={() => automationEngine.resetEmergencyStop()}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Stop Latch</span>
              </button>
            ) : (
              <button
                onClick={() => automationEngine.emergencyStop('User clicked Emergency Stop')}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-colors cursor-pointer active:scale-95"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>STOP AUTOMATION</span>
              </button>
            )}

            <button
              onClick={handleTestPlan}
              disabled={engineState.engineState === ExecutionState.EXECUTING}
              className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Plan</span>
            </button>
          </div>
        </div>

        {/* Emergency Stop Latch Banner */}
        {engineState.isEmergencyStopped && (
          <div className="mt-3 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              <strong>EMERGENCY STOP ACTIVE:</strong> {engineState.activeError || 'All executions halted'}. Click "Reset Stop Latch" to resume.
            </span>
          </div>
        )}

        {/* Execution Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-gray-400 text-[10px] uppercase font-semibold">Queue Size</span>
            <div className="text-base font-bold text-white mt-0.5">{engineState.queue.length}</div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-gray-400 text-[10px] uppercase font-semibold">Progress</span>
            <div className="text-base font-bold text-cyan-300 mt-0.5">
              {engineState.currentActionIndex >= 0 ? engineState.currentActionIndex + 1 : 0} / {engineState.totalActions || 0}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-gray-400 text-[10px] uppercase font-semibold">Completed</span>
            <div className="text-base font-bold text-emerald-400 mt-0.5">{engineState.history.length}</div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-gray-400 text-[10px] uppercase font-semibold">Active Error</span>
            <div className="text-xs font-mono text-rose-300 truncate mt-1">
              {engineState.activeError ? engineState.activeError : 'None (Healthy)'}
            </div>
          </div>
        </div>
      </div>

      {/* Active Action Card */}
      {engineState.currentAction && (
        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Currently Executing Action</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">ID: {engineState.currentAction.actionId}</span>
          </div>
          <h4 className="text-base font-bold text-white mt-1">{engineState.currentAction.title}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
            <div className="p-2 rounded-lg bg-black/40">
              <span className="text-[10px] text-gray-400">Type</span>
              <p className="font-semibold text-cyan-200">{engineState.currentAction.actionType}</p>
            </div>
            <div className="p-2 rounded-lg bg-black/40">
              <span className="text-[10px] text-gray-400">Timeout</span>
              <p className="font-semibold text-white">{engineState.currentAction.timeout}ms</p>
            </div>
            <div className="p-2 rounded-lg bg-black/40">
              <span className="text-[10px] text-gray-400">Retries Allowed</span>
              <p className="font-semibold text-white">{engineState.currentAction.retryCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-black/40">
              <span className="text-[10px] text-gray-400">Priority</span>
              <p className="font-semibold text-white">{engineState.currentAction.priority ?? 1}</p>
            </div>
          </div>
          {Object.keys(engineState.currentAction.parameters || {}).length > 0 && (
            <div className="mt-2.5 p-2 rounded-lg bg-black/50 text-[11px] font-mono text-gray-300 overflow-x-auto">
              {JSON.stringify(engineState.currentAction.parameters)}
            </div>
          )}
        </div>
      )}

      {/* Permissions Grid */}
      <div className="p-4 rounded-2xl bg-[#121820] border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white">Automation Permissions Manager</h3>
          </div>
          <span className="text-[10px] text-gray-400">Official Android Runtime Contracts</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {permissions.map((perm) => (
            <div
              key={perm.permission}
              className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                perm.granted ? 'bg-teal-950/20 border-teal-500/30' : 'bg-red-950/20 border-red-500/30'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{perm.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      perm.granted ? 'bg-teal-500/20 text-teal-300' : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {perm.granted ? 'Granted' : 'Denied'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{perm.description}</p>
              </div>
              <button
                onClick={() => AutomationPermissionManager.getInstance().togglePermission(perm.permission)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors ${
                  perm.granted ? 'bg-white/10 hover:bg-white/20 text-gray-200' : 'bg-teal-500 hover:bg-teal-400 text-black'
                }`}
              >
                {perm.granted ? 'Revoke' : 'Allow'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action History Log */}
      {engineState.history.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#121820] border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Execution History & Verifications</h3>
            </div>
            <span className="text-xs text-gray-400 font-mono">{engineState.history.length} actions</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {engineState.history.map((act, i) => (
              <div
                key={`${act.actionId}-${i}`}
                className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      act.executionState === ExecutionState.COMPLETED
                        ? 'text-emerald-400'
                        : act.executionState === ExecutionState.CANCELLED
                        ? 'text-yellow-400'
                        : 'text-rose-400'
                    }`}
                  />
                  <div className="truncate">
                    <p className="font-semibold text-white truncate">{act.title}</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {act.verificationResult?.observedState || act.error || 'Verified'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      act.executionState === ExecutionState.COMPLETED
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {act.executionState}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {act.result?.executionTimeMs ? `${act.result.executionTimeMs}ms` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
