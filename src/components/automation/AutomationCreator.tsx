import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Play,
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Clock,
  Music,
  Phone,
  Settings,
  AppWindow,
  Sliders,
  MousePointer,
  RotateCcw,
} from 'lucide-react';
import {
  Action,
  ActionType,
  AutomationDefinition,
  ExecutionState,
  RiskLevel,
  RuleCondition,
  TriggerConfig,
  TriggerType,
  automationEngine,
  automationRepository,
  SafetyValidator,
} from '../../automation';

interface AutomationCreatorProps {
  onSaved?: (saved: AutomationDefinition) => void;
  onCancel?: () => void;
  initialDefinition?: AutomationDefinition;
}

export const AutomationCreator: React.FC<AutomationCreatorProps> = ({
  onSaved,
  onCancel,
  initialDefinition,
}) => {
  const [name, setName] = useState(initialDefinition?.name || 'Custom Assistant Automation');
  const [description, setDescription] = useState(
    initialDefinition?.description || 'Automated multi-step workflow created with visual builder.'
  );

  // Trigger
  const [triggerType, setTriggerType] = useState<TriggerType>(
    initialDefinition?.trigger.type || TriggerType.BLUETOOTH_STATE
  );
  const [triggerParam, setTriggerParam] = useState<string>(
    initialDefinition?.trigger.parameters?.deviceName || 'Car Bluetooth'
  );

  // Conditions
  const [conditions, setConditions] = useState<RuleCondition[]>(
    initialDefinition?.conditions || [
      { id: 'c1', field: 'battery.level', operator: 'GREATER_THAN', value: 20 },
    ]
  );

  // Actions
  const [actions, setActions] = useState<Action[]>(
    initialDefinition?.actions || [
      {
        actionId: 'act_1',
        actionType: ActionType.APP_ACTION,
        title: '1. Launch Google Maps',
        parameters: { packageName: 'com.google.android.apps.maps', appName: 'Google Maps' },
        timeout: 8000,
        retryCount: 2,
        requiredPermissions: [],
        executionState: ExecutionState.IDLE,
      },
      {
        actionId: 'act_2',
        actionType: ActionType.MEDIA_ACTION,
        title: '2. Resume Spotify Music',
        parameters: { command: 'play', targetApp: 'com.spotify.music' },
        timeout: 5000,
        retryCount: 1,
        requiredPermissions: [],
        executionState: ExecutionState.IDLE,
      },
      {
        actionId: 'act_3',
        actionType: ActionType.MEDIA_ACTION,
        title: '3. Set Media Volume to 80%',
        parameters: { command: 'set_volume', volumePercent: 80 },
        timeout: 4000,
        retryCount: 1,
        requiredPermissions: [],
        executionState: ExecutionState.IDLE,
      },
    ]
  );

  // Verification
  const [verificationRules, setVerificationRules] = useState<string[]>(
    initialDefinition?.verificationRules || [
      'Navigation app in foreground',
      'Media playback resumed',
      'Volume set to 80%',
    ]
  );

  const [testModeModal, setTestModeModal] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Safety inspection
  const safetyCheck = SafetyValidator.validatePlanSafety(actions);

  const handleAddAction = (type: ActionType) => {
    let newAction: Action;
    const id = `act_${Date.now()}`;

    switch (type) {
      case ActionType.APP_ACTION:
        newAction = {
          actionId: id,
          actionType: ActionType.APP_ACTION,
          title: 'Launch Application',
          parameters: { packageName: 'com.google.android.calendar', appName: 'Calendar' },
          timeout: 8000,
          retryCount: 2,
          requiredPermissions: [],
          executionState: ExecutionState.IDLE,
        };
        break;
      case ActionType.MEDIA_ACTION:
        newAction = {
          actionId: id,
          actionType: ActionType.MEDIA_ACTION,
          title: 'Media Play/Pause',
          parameters: { command: 'play' },
          timeout: 5000,
          retryCount: 1,
          requiredPermissions: [],
          executionState: ExecutionState.IDLE,
        };
        break;
      case ActionType.SYSTEM_ACTION:
        newAction = {
          actionId: id,
          actionType: ActionType.SYSTEM_ACTION,
          title: 'Adjust System Brightness',
          parameters: { operation: 'brightness', brightnessPercent: 50 },
          timeout: 4000,
          retryCount: 1,
          requiredPermissions: [],
          executionState: ExecutionState.IDLE,
        };
        break;
      case ActionType.COMMUNICATION_ACTION:
        newAction = {
          actionId: id,
          actionType: ActionType.COMMUNICATION_ACTION,
          title: 'Open Dialer',
          parameters: { operation: 'dial', phoneNumber: '+1234567890' },
          timeout: 5000,
          retryCount: 1,
          requiredPermissions: [],
          executionState: ExecutionState.IDLE,
        };
        break;
      case ActionType.DELAY_ACTION:
        newAction = {
          actionId: id,
          actionType: ActionType.DELAY_ACTION,
          title: 'Delay Step',
          parameters: { durationMs: 1500 },
          timeout: 5000,
          retryCount: 0,
          requiredPermissions: [],
          executionState: ExecutionState.IDLE,
        };
        break;
      default:
        newAction = {
          actionId: id,
          actionType: ActionType.UI_ACTION,
          title: 'Click UI Element',
          parameters: { text: 'Confirm' },
          timeout: 5000,
          retryCount: 1,
          requiredPermissions: [],
          executionState: ExecutionState.IDLE,
        };
    }

    setActions((prev) => [...prev, newAction]);
  };

  const handleRemoveAction = (index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveAction = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === actions.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const copy = [...actions];
    const item = copy.splice(index, 1)[0];
    copy.splice(targetIndex, 0, item);
    setActions(copy);
  };

  const handleSave = () => {
    const trigger: TriggerConfig = {
      triggerId: `trig_${Date.now()}`,
      type: triggerType,
      parameters: { target: triggerParam },
      enabled: true,
    };

    const def: AutomationDefinition = {
      id: initialDefinition?.id || `auto_${Date.now()}`,
      name,
      description,
      trigger,
      conditions,
      actions,
      verificationRules,
      confirmationPolicy: safetyCheck.requiresUserConfirmation ? 'always' : 'on_high_risk',
      riskLevel: safetyCheck.riskLevel,
      enabled: true,
      createdAt: initialDefinition?.createdAt || Date.now(),
      updatedAt: Date.now(),
      executionCount: initialDefinition?.executionCount || 0,
    };

    automationRepository.save(def);
    if (onSaved) onSaved(def);
  };

  const handleTestRun = async () => {
    setIsTesting(true);
    setTestResult(null);

    const def: AutomationDefinition = {
      id: `test_${Date.now()}`,
      name,
      description,
      trigger: { triggerId: 'test_trig', type: triggerType, parameters: {}, enabled: true },
      conditions,
      actions,
      verificationRules,
      confirmationPolicy: 'never', // safe preview bypass
      riskLevel: safetyCheck.riskLevel,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      executionCount: 0,
    };

    const res = await automationEngine.executeAutomationDefinition(def, { skipConfirmation: true });
    setIsTesting(false);
    setTestResult(res.message);
  };

  return (
    <div id="automation-creator" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              VISUAL WORKFLOW BUILDER
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Create Android Automation</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Formulate deterministic multi-step chains with triggers, conditions, and verifiable actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-creator-inspect-test"
            onClick={() => setTestModeModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Inspect / Test Mode
          </button>
          <button
            id="btn-creator-save"
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Save Automation
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Name & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Automation Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. Car Audio & Navigation Routine"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Describe trigger condition and expected behavior"
            />
          </div>
        </div>

        {/* Visual Flow Indicator */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-600 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">1</span>
            <span>TRIGGER</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">2</span>
            <span>CONDITIONS ({conditions.length})</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">3</span>
            <span>ACTIONS ({actions.length})</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">4</span>
            <span>VERIFICATION</span>
          </div>
        </div>

        {/* 1. Trigger Configuration */}
        <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
              Event Trigger
            </h3>
            <span className="text-[11px] text-blue-700 font-medium">Fires automation when event occurs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Trigger Type</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
              >
                <option value={TriggerType.BLUETOOTH_STATE}>Bluetooth State (Connected / Disconnected)</option>
                <option value={TriggerType.NETWORK_STATE}>Wi-Fi / Network State (SSID)</option>
                <option value={TriggerType.TIME}>Daily Scheduled Time (HH:MM)</option>
                <option value={TriggerType.BATTERY_LEVEL}>Battery Threshold (% Level)</option>
                <option value={TriggerType.CHARGING_STATE}>Charging State (Plugged / Unplugged)</option>
                <option value={TriggerType.NOTIFICATION_ARRIVED}>Incoming Notification</option>
                <option value={TriggerType.SCHEDULED_EVENT}>Manual / AI Assistant Voice</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Parameter</label>
              <input
                type="text"
                value={triggerParam}
                onChange={(e) => setTriggerParam(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                placeholder="e.g. Tesla Audio, Office Wi-Fi, 07:00, or com.whatsapp"
              />
            </div>
          </div>
        </div>

        {/* 2. Actions List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
              Action Sequence ({actions.length} Steps)
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAddAction(ActionType.APP_ACTION)}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1"
              >
                <AppWindow className="w-3 h-3" /> + App
              </button>
              <button
                onClick={() => handleAddAction(ActionType.MEDIA_ACTION)}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1"
              >
                <Music className="w-3 h-3" /> + Media
              </button>
              <button
                onClick={() => handleAddAction(ActionType.SYSTEM_ACTION)}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1"
              >
                <Sliders className="w-3 h-3" /> + System
              </button>
              <button
                onClick={() => handleAddAction(ActionType.COMMUNICATION_ACTION)}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1"
              >
                <Phone className="w-3 h-3" /> + Call/SMS
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {actions.map((act, idx) => (
              <div
                key={act.actionId}
                className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between gap-3 hover:border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{act.title}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {act.actionType}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Params: {JSON.stringify(act.parameters)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMoveAction(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMoveAction(idx, 'down')}
                    disabled={idx === actions.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => handleRemoveAction(idx)}
                    className="p-1 text-rose-500 hover:text-rose-700 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Verification Rules */}
        <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">4</span>
              Verification Assertions
            </h3>
            <span className="text-[11px] text-purple-700">Observed upon completion</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {verificationRules.map((rule, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-white border border-purple-200 text-purple-800 rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3 text-purple-600" />
                {rule}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Safe Test Mode Modal */}
      {testModeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-base">Safe Test Mode Inspection</h3>
              </div>
              <button
                onClick={() => setTestModeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block">Trigger Evaluation:</span>
                Type: {triggerType} | Param: {triggerParam}
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block">Safety & Risk Assessment:</span>
                Assessed Level: <strong className={safetyCheck.riskLevel === RiskLevel.HIGH_RISK ? 'text-rose-600' : 'text-emerald-600'}>{safetyCheck.riskLevel}</strong>
                <p className="mt-0.5">Confirmation Policy: {safetyCheck.requiresUserConfirmation ? 'User Consent Required' : 'Auto-execute permitted'}</p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block">Planned Actions:</span>
                {actions.map((a, i) => (
                  <div key={i} className="truncate">• {a.title}</div>
                ))}
              </div>

              {testResult && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-medium">
                  {testResult}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setTestModeModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
              <button
                id="btn-run-safe-test"
                onClick={handleTestRun}
                disabled={isTesting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
              >
                {isTesting ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Execute Test Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
