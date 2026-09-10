import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cpu,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Volume2,
  Sun,
  Moon,
  MessageSquare,
  Instagram,
  Compass,
  Phone,
  Camera,
  ShieldCheck,
  Zap,
  Target,
  ArrowRight,
  RotateCcw,
  Smartphone,
  Layers,
  Code,
  Check,
  X,
  StopCircle,
  AlertOctagon,
} from 'lucide-react';
import {
  AutomationRoutine,
  AutomationStep,
  AutomationExecutionState,
  ForegroundAppType,
  SystemSettingsState,
  UserSettings,
} from '../types';
import { DEFAULT_AUTOMATION_ROUTINES } from '../data/defaultRoutines';
import { automationService } from '../services/automationService';
import { automationEngine } from '../automation';
import { CoreEngineMonitor } from './automation/CoreEngineMonitor';
import { SmartNavigatorExplorer } from './automation/SmartNavigatorExplorer';
import { AcceptanceTestSuite } from './automation/AcceptanceTestSuite';
import { AutomationDashboard } from './automation/AutomationDashboard';
import { AutomationCreator } from './automation/AutomationCreator';

interface AutomationScreenProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onRequestAccessibilityPermission: () => void;
  onExecuteSimulatedCommand?: (command: string) => void;
  onSpeak?: (text: string) => void;
  foregroundApp: ForegroundAppType;
  onOpenApp: (appName: string) => void;
}

const LOCAL_STORAGE_ROUTINES_KEY = 'nova_custom_routines_v1';

export const AutomationScreen: React.FC<AutomationScreenProps> = ({
  settings,
  onUpdateSettings,
  onRequestAccessibilityPermission,
  onExecuteSimulatedCommand,
  onSpeak,
  foregroundApp,
  onOpenApp,
}) => {
  const [routines, setRoutines] = useState<AutomationRoutine[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ROUTINES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...DEFAULT_AUTOMATION_ROUTINES, ...parsed];
      }
    } catch (e) {
      console.error('Failed to load custom routines:', e);
    }
    return DEFAULT_AUTOMATION_ROUTINES;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'creator' | 'acceptance' | 'engine' | 'navigator' | 'routines'>('dashboard');
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<AutomationExecutionState>(() =>
    automationService.getExecutionState()
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGesturePad, setShowGesturePad] = useState(false);
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [lastExecutedId, setLastExecutedId] = useState<string | null>(null);

  // New Routine Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTrigger, setNewTrigger] = useState('');
  const [newCategory, setNewCategory] = useState<'daily' | 'social' | 'system' | 'productivity'>('daily');
  const [newSteps, setNewSteps] = useState<
    { actionType: AutomationStep['actionType']; title: string; appName?: string; params?: Record<string, any> }[]
  >([
    { actionType: 'toggle_setting', title: 'Turn On Do Not Disturb', params: { action: 'toggleDnd', value: 'on' } },
    { actionType: 'toggle_setting', title: 'Set Volume to 50%', params: { setting: 'volume', value: 50 } },
  ]);

  // Subscribe to live execution changes
  useEffect(() => {
    const unsub = automationService.onExecutionChange((state) => {
      setExecutionState(state);
    });
    return () => unsub();
  }, []);

  const handleRunRoutine = async (routine: AutomationRoutine) => {
    setLastExecutedId(routine.id);
    if (onSpeak) {
      onSpeak(`Executing ${routine.title}...`);
    }
    await automationService.executeChain(
      routine.title,
      routine.steps,
      settings.sensitiveAppsDenylist
    );
  };

  const handleAbort = () => {
    automationService.abortChain();
    if (onSpeak) {
      onSpeak('Automation aborted.');
    }
  };

  const handleAddCustomRoutine = () => {
    if (!newTitle.trim()) return;

    const routine: AutomationRoutine = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Custom user automation routine',
      iconName: 'Zap',
      category: 'custom',
      voiceTriggers: newTrigger.trim() ? [newTrigger.trim().toLowerCase()] : [newTitle.trim().toLowerCase()],
      isCustom: true,
      steps: newSteps.map((st, i) => ({
        id: `cst-${i}-${Date.now()}`,
        title: st.title,
        actionType: st.actionType,
        appName: st.appName,
        params: st.params,
        status: 'pending',
      })),
    };

    const updated = [...routines, routine];
    setRoutines(updated);

    // Save custom ones to localStorage
    try {
      const customOnly = updated.filter((r) => r.isCustom);
      localStorage.setItem(LOCAL_STORAGE_ROUTINES_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.error('Failed to save routine:', e);
    }

    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewTrigger('');
  };

  const handleDeleteRoutine = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = routines.filter((r) => r.id !== id);
    setRoutines(updated);
    try {
      const customOnly = updated.filter((r) => r.isCustom);
      localStorage.setItem(LOCAL_STORAGE_ROUTINES_KEY, JSON.stringify(customOnly));
    } catch (err) {
      console.error('Failed to update routines storage:', err);
    }
  };

  const filteredRoutines = routines.filter((r) => {
    if (selectedCategory === 'all') return true;
    return r.category === selectedCategory;
  });

  const getRoutineIcon = (name: string) => {
    switch (name) {
      case 'Sun':
        return <Sun className="w-5 h-5 text-amber-400" />;
      case 'Instagram':
        return <Instagram className="w-5 h-5 text-rose-400" />;
      case 'MessageSquare':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'Moon':
        return <Moon className="w-5 h-5 text-indigo-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'Target':
        return <Target className="w-5 h-5 text-cyan-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-teal-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-teal-400" />;
    }
  };

  return (
    <div
      id="automation-hub-screen"
      className="flex-1 flex flex-col bg-[#0A0A0A] overflow-y-auto px-4 sm:px-6 py-5 text-white select-none relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <Cpu className="w-7 h-7 text-teal-400" />
              <span>Android Automation</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/40 uppercase tracking-wider">
              Accessibility v2.4
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Automate phone actions, system controls, app workflows, and macro routines.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Routine</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs & Emergency Stop Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-teal-500 text-black shadow-md shadow-teal-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Dashboard & Triggers</span>
          </button>
          <button
            onClick={() => setActiveTab('creator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'creator'
                ? 'bg-teal-500 text-black shadow-md shadow-teal-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Visual Creator</span>
          </button>
          <button
            onClick={() => setActiveTab('acceptance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'acceptance'
                ? 'bg-teal-500 text-black shadow-md shadow-teal-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Acceptance Tests (25/25)</span>
          </button>
          <button
            onClick={() => setActiveTab('engine')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'engine'
                ? 'bg-teal-500 text-black shadow-md shadow-teal-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Core Engine & State</span>
          </button>
          <button
            onClick={() => setActiveTab('navigator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'navigator'
                ? 'bg-teal-500 text-black shadow-md shadow-teal-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Smart UI Tree</span>
          </button>
          <button
            onClick={() => setActiveTab('routines')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'routines'
                ? 'bg-teal-500 text-black shadow-md shadow-teal-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Routines & Macros</span>
          </button>
        </div>

        {/* Global Emergency Stop Button */}
        <button
          onClick={() => {
            automationEngine.emergencyStop('Emergency stop button pressed in UI');
            automationService.abortChain();
            if (onSpeak) onSpeak('Emergency stop activated! All automation halted.');
          }}
          className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 transition-all cursor-pointer shrink-0 animate-pulse"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>STOP AUTOMATION</span>
        </button>
      </div>

      {/* Live Accessibility Service Status Card */}
      <div className="p-4 rounded-2xl bg-[#11161d] border border-teal-500/30 mb-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Accessibility Service: ACTIVE</span>
                <span className="text-[10px] text-teal-400 font-mono">[ROOTLESS ENGINE]</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                <span>Foreground App: <strong className="text-teal-300 capitalize">{foregroundApp}</strong></span>
                <span>•</span>
                <span>Capabilities: <span className="text-gray-300">Gestures, UI Inspect, Navigation</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowGesturePad(!showGesturePad)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                showGesturePad
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
              }`}
              title="Toggle Simulated Android Gesture Pad"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Gesture Pad</span>
            </button>

            <button
              onClick={() => setShowCodeViewer(!showCodeViewer)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                showCodeViewer
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
              }`}
              title="View Native Kotlin Accessibility Code"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Kotlin API</span>
            </button>
          </div>
        </div>

        {/* Expandable Manual Gesture Pad */}
        <AnimatePresence>
          {showGesturePad && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="text-[10px] uppercase font-bold tracking-wider text-teal-400 mb-2">
                Manual Accessibility Gesture Injection
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => automationService.goHome()}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 font-medium transition-colors cursor-pointer text-center"
                >
                  🏠 Home
                </button>
                <button
                  onClick={() => automationService.goBack()}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 font-medium transition-colors cursor-pointer text-center"
                >
                  ◀ Back
                </button>
                <button
                  onClick={() => automationService.openRecentApps()}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 font-medium transition-colors cursor-pointer text-center"
                >
                  📋 Recents
                </button>
                <button
                  onClick={() => automationService.openQuickSettings()}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 font-medium transition-colors cursor-pointer text-center"
                >
                  🔔 Quick Settings
                </button>
                <button
                  onClick={() => automationService.scrollScreen('down')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 font-medium transition-colors cursor-pointer text-center"
                >
                  📜 Scroll Down
                </button>
                <button
                  onClick={() => automationService.scrollScreen('up')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 font-medium transition-colors cursor-pointer text-center"
                >
                  📜 Scroll Up
                </button>
                <button
                  onClick={() => automationService.takeScreenshot()}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 font-medium transition-colors cursor-pointer text-center"
                >
                  📸 Screenshot
                </button>
                <button
                  onClick={() => automationService.lockScreen()}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-rose-300 font-medium transition-colors cursor-pointer text-center"
                >
                  🔒 Lock Screen
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expandable Kotlin Code Viewer */}
        <AnimatePresence>
          {showCodeViewer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-white/10 font-mono text-[11px] bg-black/60 p-3 rounded-xl border border-white/10 text-teal-300 overflow-x-auto max-h-48"
            >
              <div className="text-gray-400 mb-1">// Android Accessibility Service Gesture Dispatch</div>
              <div>val gesture = GestureDescription.Builder()</div>
              <div>&nbsp;&nbsp;.addStroke(StrokeDescription(path, 0, 150))</div>
              <div>&nbsp;&nbsp;.build()</div>
              <div>dispatchGesture(gesture, object : GestureResultCallback() {'{'}...{'}'}, null)</div>
              <div className="text-gray-400 mt-2">// Node Hierarchy Inspection</div>
              <div>val root = rootInActiveWindow</div>
              <div>val nodes = root?.findAccessibilityNodeInfosByViewId("btn_action")</div>
              <div>nodes?.firstOrNull()?.performAction(ACTION_CLICK)</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Execution Banner */}
      {executionState.isActive && (
        <div className="mb-4 p-4 rounded-2xl bg-teal-950/50 border-2 border-teal-400 shadow-xl shadow-teal-500/10 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
              <span className="text-xs font-bold text-teal-300">
                Executing Automation: {executionState.title}
              </span>
            </div>
            <button
              onClick={handleAbort}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold border border-rose-500/40 flex items-center gap-1 cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Abort</span>
            </button>
          </div>

          <div className="space-y-1 mt-2">
            {executionState.steps.map((st, idx) => (
              <div
                key={st.id || idx}
                className={`text-[11px] flex items-center justify-between px-2 py-1 rounded-lg ${
                  idx === executionState.currentStepIndex
                    ? 'bg-teal-500/20 text-teal-200 font-semibold'
                    : st.status === 'completed'
                    ? 'text-gray-400'
                    : 'text-gray-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {st.status === 'completed' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : idx === executionState.currentStepIndex ? (
                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-600" />
                  )}
                  <span>{st.title}</span>
                </div>
                {st.latencyMs && (
                  <span className="text-[9px] font-mono text-gray-500">{st.latencyMs}ms</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Views */}
      {activeTab === 'dashboard' && (
        <AutomationDashboard onCreateNew={() => setActiveTab('creator')} />
      )}

      {activeTab === 'creator' && (
        <AutomationCreator
          onSaved={() => setActiveTab('dashboard')}
          onCancel={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'acceptance' && <AcceptanceTestSuite />}

      {activeTab === 'engine' && <CoreEngineMonitor />}

      {activeTab === 'navigator' && <SmartNavigatorExplorer foregroundApp={foregroundApp} />}

      {activeTab === 'routines' && (
        <>
          {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-1 no-scrollbar">
        {['all', 'daily', 'social', 'system', 'productivity', 'custom'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-teal-500 text-black shadow-md shadow-teal-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            {cat === 'all' ? 'All Routines' : cat}
          </button>
        ))}
      </div>

      {/* Routines List */}
      <div className="space-y-3 pb-8">
        {filteredRoutines.map((routine) => {
          const isExpanded = expandedRoutineId === routine.id;
          const isRunning = executionState.isActive && executionState.title === routine.title;

          return (
            <div
              key={routine.id}
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                isRunning
                  ? 'bg-teal-950/30 border-teal-400 shadow-md shadow-teal-500/10'
                  : 'bg-[#111317] border-white/5 hover:border-teal-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                    {getRoutineIcon(routine.iconName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white tracking-tight truncate">
                        {routine.title}
                      </h3>
                      {routine.isCustom && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Custom
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 font-mono">
                        {routine.steps.length} steps
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {routine.description}
                    </p>

                    {/* Voice Trigger Pill */}
                    {routine.voiceTriggers.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-gray-500">Voice Trigger:</span>
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-mono">
                          "{routine.voiceTriggers[0]}"
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {routine.isCustom && (
                    <button
                      onClick={(e) => handleDeleteRoutine(routine.id, e)}
                      className="p-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Custom Routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    disabled={executionState.isActive}
                    onClick={() => handleRunRoutine(routine)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      isRunning
                        ? 'bg-amber-500 text-black animate-pulse'
                        : 'bg-teal-500 hover:bg-teal-400 text-black shadow-md shadow-teal-500/20'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isRunning ? 'Running...' : 'Run'}</span>
                  </button>

                  <button
                    onClick={() => setExpandedRoutineId(isExpanded ? null : routine.id)}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Step Details Dropdown */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-white/5 space-y-1.5"
                  >
                    <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                      Automated Execution Sequence
                    </div>
                    {routine.steps.map((step, idx) => (
                      <div
                        key={step.id || idx}
                        className="flex items-center gap-2 text-xs text-gray-300 py-1 px-2 rounded-lg bg-black/30 border border-white/5"
                      >
                        <span className="w-4 h-4 rounded-full bg-white/10 text-[9px] font-mono flex items-center justify-center text-teal-400">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{step.title}</span>
                        <span className="text-[10px] text-gray-500 font-mono capitalize">
                          {step.actionType.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
        </>
      )}

      {/* New Routine Creation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#12161f] border border-teal-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Create Custom Routine</h3>
                    <p className="text-xs text-gray-400">Chain automated actions on Android</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Routine Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Gym Workout Routine"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Voice Trigger Phrase</label>
                  <input
                    type="text"
                    value={newTrigger}
                    onChange={(e) => setNewTrigger(e.target.value)}
                    placeholder="e.g. I am heading to gym"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-white/10 text-white text-xs focus:outline-none focus:border-teal-400"
                  >
                    <option value="daily">Daily</option>
                    <option value="productivity">Productivity</option>
                    <option value="social">Social</option>
                    <option value="system">System</option>
                  </select>
                </div>

                {/* Steps Configurator */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-300">Action Steps ({newSteps.length})</label>
                    <button
                      onClick={() =>
                        setNewSteps([
                          ...newSteps,
                          {
                            actionType: 'open_app',
                            title: 'Open Spotify',
                            appName: 'Spotify',
                          },
                        ])
                      }
                      className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
                    >
                      + Add Step
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {newSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => {
                              const copy = [...newSteps];
                              copy[idx].title = e.target.value;
                              setNewSteps(copy);
                            }}
                            className="bg-transparent text-xs text-white focus:outline-none border-b border-transparent focus:border-teal-400 w-full"
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (newSteps.length > 1) {
                              setNewSteps(newSteps.filter((_, i) => i !== idx));
                            }
                          }}
                          className="text-gray-500 hover:text-rose-400 cursor-pointer p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!newTitle.trim()}
                  onClick={handleAddCustomRoutine}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black text-xs font-bold cursor-pointer"
                >
                  Save Routine
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
