import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  MessageCircle,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Phone,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Layers,
  Sliders,
  Check,
  ShieldAlert,
  Fingerprint,
} from 'lucide-react';
import { ActivityLogItem, ActivityStatus } from '../types';

interface ActivityScreenProps {
  activities: ActivityLogItem[];
  onClearActivities: () => void;
  onResendAction?: (item: ActivityLogItem) => void;
  onRepeatAction?: (item: ActivityLogItem) => void;
  onNavigateToChat?: () => void;
  onNavigateBack?: () => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  activities,
  onClearActivities,
  onResendAction,
  onRepeatAction,
  onNavigateToChat,
  onNavigateBack,
}) => {
  const [filter, setFilter] = useState<'all' | ActivityStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAction = (item: ActivityLogItem) => {
    if (onRepeatAction) onRepeatAction(item);
    else if (onResendAction) onResendAction(item);
  };

  const filteredActivities = activities.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const formatTimestamp = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded-lg">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Sent
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-lg">
            <AlertTriangle className="w-2.5 h-2.5" />
            Cancelled
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded-lg">
            <XCircle className="w-2.5 h-2.5" />
            Failed
          </span>
        );
      case 'refused_unauthorized':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-rose-300 bg-rose-950/80 border border-rose-700/80 px-2 py-0.5 rounded-lg shadow-sm">
            <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />
            Refused (Voice Mismatch)
          </span>
        );
    }
  };

  return (
    <div id="activity-screen" className="flex-1 flex flex-col bg-[#0A0A0A] overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#0F0F0F] border-b border-teal-900/30 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {onNavigateBack && (
              <button
                onClick={onNavigateBack}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-teal-400 hover:bg-white/5 transition-colors mr-1"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center text-black shadow-md font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white flex items-center gap-2">
                Activity Log
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white/5 text-teal-400 border border-teal-900/30">
                  {activities.length}
                </span>
              </h2>
              <p className="text-[10px] font-mono text-teal-500 uppercase tracking-widest mt-0.5">Room Database • Nova Tool Actions</p>
            </div>
          </div>

          {activities.length > 0 && (
            <button
              onClick={onClearActivities}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-950/40 text-gray-400 hover:text-rose-400 border border-white/10 hover:border-rose-900/50 transition-colors text-xs flex items-center gap-1.5"
              title="Clear activity log"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider font-bold hidden sm:inline">Clear</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
          {(['all', 'sent', 'cancelled', 'failed', 'refused_unauthorized'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-xl font-bold transition-all whitespace-nowrap ${
                filter === key
                  ? 'bg-teal-500 text-black shadow-sm'
                  : 'bg-white/5 text-gray-400 hover:text-gray-200 border border-white/10'
              }`}
            >
              {key === 'all'
                ? `All (${activities.length})`
                : key === 'refused_unauthorized'
                ? 'Unauthorized'
                : key}
            </button>
          ))}
        </div>
      </div>

      {/* Activities List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-4 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#161616] border border-white/5 flex items-center justify-center text-gray-500">
              <MessageCircle className="w-7 h-7 text-teal-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold uppercase tracking-wider text-white">No actions recorded yet</p>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                When you ask Nova to send WhatsApp messages, each request and its status is recorded here.
              </p>
            </div>
            <button
              onClick={onNavigateToChat}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Nova to Send a Message</span>
            </button>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const isExpanded = expandedId === act.id;
            return (
              <motion.div
                key={act.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-[#161616] border border-white/5 hover:border-teal-900/40 transition-all overflow-hidden"
              >
                {/* Main Card Row */}
                <div
                  className="p-3.5 cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : act.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        act.status === 'refused_unauthorized' || act.actionType === 'unauthorized_attempt'
                          ? 'bg-rose-950/70 border border-rose-600/60 text-rose-400'
                          : act.actionType === 'sms_message'
                          ? 'bg-blue-950/60 border border-blue-800/40 text-blue-400'
                          : act.actionType === 'phone_automation' || act.actionType === 'chained_automation'
                          ? 'bg-teal-950/60 border border-teal-500/40 text-teal-300'
                          : act.actionType === 'open_app'
                          ? 'bg-cyan-950/60 border border-cyan-800/40 text-cyan-400'
                          : act.actionType === 'system_setting'
                          ? 'bg-amber-950/60 border border-amber-800/40 text-amber-400'
                          : 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-400'
                      }`}>
                        {act.status === 'refused_unauthorized' || act.actionType === 'unauthorized_attempt' ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : act.actionType === 'sms_message' ? (
                          <MessageSquare className="w-4 h-4" />
                        ) : act.actionType === 'phone_automation' || act.actionType === 'chained_automation' ? (
                          <Sparkles className="w-4 h-4" />
                        ) : act.actionType === 'open_app' ? (
                          <ExternalLink className="w-4 h-4" />
                        ) : act.actionType === 'system_setting' ? (
                          <Sliders className="w-4 h-4" />
                        ) : (
                          <MessageCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">
                            {act.contactName || act.automationTrace?.actionSummary || 'Phone Action'}
                          </span>
                          {getStatusBadge(act.status)}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                          {act.contactPhone ? (
                            <>
                              <Phone className="w-3 h-3 text-gray-500" />
                              <span className="font-mono text-[11px] text-gray-300">{act.contactPhone}</span>
                              <span className="text-gray-600">•</span>
                            </>
                          ) : (
                            <>
                              <span className="font-mono text-[10px] text-teal-400 uppercase tracking-wider font-semibold">
                                {act.actionType.replace('_', ' ')}
                              </span>
                              <span className="text-gray-600">•</span>
                            </>
                          )}
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="font-mono text-[11px] text-gray-400">{formatTimestamp(act.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="text-gray-400 hover:text-white p-1 rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : act.id);
                      }}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Message Preview snippet */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-gray-300 line-clamp-2 leading-relaxed font-mono">
                    "{act.message}"
                  </div>

                  {/* Steps preview if automation */}
                  {act.automationTrace?.steps && act.automationTrace.steps.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-teal-400/90">
                      <Check className="w-3 h-3 text-teal-400 shrink-0" />
                      <span>{act.automationTrace.steps.length} chained steps executed</span>
                    </div>
                  )}
                </div>

                {/* Expanded Details Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-white/5 p-3.5 bg-black/30 space-y-3 text-xs"
                    >
                      {/* Detailed Trace if automation steps */}
                      {act.automationTrace?.steps && act.automationTrace.steps.length > 0 && (
                        <div className="space-y-1.5 bg-[#0F0F0F] p-3 rounded-xl border border-teal-900/30">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold mb-1">
                            Execution Trace
                          </div>
                          <div className="space-y-1">
                            {act.automationTrace.steps.map((st, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                                <span className="text-gray-300 font-medium">
                                  {idx + 1}. {st.title}
                                </span>
                                <span className={`text-[10px] uppercase font-bold font-mono px-1.5 py-0.5 rounded ${
                                  st.status === 'completed'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                    : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                                }`}>
                                  {st.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5 font-mono text-[11px] text-gray-400 bg-[#0F0F0F] p-3 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between text-gray-500 border-b border-white/5 pb-1 mb-1.5 text-[10px] uppercase tracking-wider font-bold">
                          <span>ANDROID INTENT / ACCESSIBILITY PAYLOAD</span>
                          <span className="text-teal-400">ActivityLogEntity</span>
                        </div>
                        <div>
                          <span className="text-teal-400">Action: </span>
                          <span className="text-gray-300">{act.intentData?.action || act.actionType}</span>
                        </div>
                        <div>
                          <span className="text-teal-400">Package: </span>
                          <span className="text-gray-300">{act.intentData?.packageName || (act.actionType === 'sms_message' ? 'com.google.android.apps.messaging' : 'com.android.system')}</span>
                        </div>
                        {act.intentData?.jid && (
                          <div>
                            <span className="text-teal-400">JID: </span>
                            <span className="text-gray-300">{act.intentData.jid}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-teal-400">Timestamp: </span>
                          <span className="text-gray-300">{new Date(act.timestamp).toLocaleString()}</span>
                        </div>
                        {act.failureReason && (
                          <div className="text-rose-400 pt-1 border-t border-white/5">
                            Error: {act.failureReason}
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleAction(act)}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Repeat Action</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
