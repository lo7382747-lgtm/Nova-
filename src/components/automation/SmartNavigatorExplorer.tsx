import React, { useState } from 'react';
import {
  Compass,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  AutomationAccessibilityService,
  SmartNavigator,
  SmartMatchResult,
  AccessibilityNodeInfo,
  UIElementQuery,
} from '../../automation';

export const SmartNavigatorExplorer: React.FC<{ foregroundApp: string }> = ({ foregroundApp }) => {
  const accessibilityService = AutomationAccessibilityService.getInstance();
  const rootTree = accessibilityService.getRootInActiveWindow();

  const [queryInput, setQueryInput] = useState('');
  const [matchType, setMatchType] = useState<'any' | 'resourceId' | 'contentDesc' | 'text'>('any');
  const [testResult, setTestResult] = useState<SmartMatchResult | null>(null);

  const flatNodes = SmartNavigator.flattenTree(rootTree);

  const handleExecuteSearch = (customQuery?: string) => {
    const q = customQuery !== undefined ? customQuery : queryInput;
    if (!q.trim()) return;

    let queryObj: UIElementQuery = {};
    if (matchType === 'resourceId') {
      queryObj = { resourceId: q.trim() };
    } else if (matchType === 'contentDesc') {
      queryObj = { contentDescription: q.trim() };
    } else if (matchType === 'text') {
      queryObj = { text: q.trim() };
    } else {
      // Auto: test by resourceId if has 'id' or ':', else text
      if (q.includes(':') || q.includes('/')) {
        queryObj = { resourceId: q.trim() };
      } else {
        queryObj = { text: q.trim(), contentDescription: q.trim() };
      }
    }

    const match = SmartNavigator.findElement(rootTree, queryObj);
    setTestResult(match);
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return { label: 'Priority 1: Resource ID', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 2:
        return { label: 'Priority 2: Content Desc', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
      case 3:
        return { label: 'Priority 3: Exact Text', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 4:
        return { label: 'Priority 4: Normalized Text', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
      case 5:
        return { label: 'Priority 5: Partial Text', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 6:
        return { label: 'Priority 6: Structural Index', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      default:
        return { label: 'No Match', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }
  };

  return (
    <div id="smart-navigator-explorer" className="space-y-4">
      {/* Search and Priority Test Bar */}
      <div className="p-4 rounded-2xl bg-[#121820] border border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-sm font-bold text-white">SmartNavigator Priority Inspector</h3>
              <p className="text-[11px] text-gray-400">
                Tests Android AccessibilityNodeInfo tree matching without fixed coordinates.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10">
            Tree: {flatNodes.length} nodes
          </span>
        </div>

        {/* Query Input */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch()}
              placeholder="Enter node text, resource ID (e.g. search_button), or content desc..."
              className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={matchType}
              onChange={(e: any) => setMatchType(e.target.value)}
              className="px-2.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-teal-500"
            >
              <option value="any">Smart Match (1-6)</option>
              <option value="resourceId">Resource ID (P1)</option>
              <option value="contentDesc">Content Desc (P2)</option>
              <option value="text">Visible Text (P3)</option>
            </select>

            <button
              onClick={() => handleExecuteSearch()}
              className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Find Element
            </button>
          </div>
        </div>

        {/* Quick Sample Queries */}
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Try Sample:</span>
          {['Search', 'Rahul Sharma', 'Like', 'com.whatsapp:id/menuitem_search', 'STOP AUTOMATION'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setQueryInput(s);
                handleExecuteSearch(s);
              }}
              className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300 font-mono transition-colors cursor-pointer border border-white/5"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search Result Banner */}
        {testResult && (
          <div className="mt-3 p-3 rounded-xl bg-black/50 border border-teal-500/30 text-xs">
            {testResult.node ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">Element Successfully Identified</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                      getPriorityBadge(testResult.matchPriority).color
                    }`}
                  >
                    {getPriorityBadge(testResult.matchPriority).label}
                  </span>
                </div>
                <p className="text-gray-300 text-[11px] font-mono">{testResult.matchDescription}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-white/10 text-[11px]">
                  <div>
                    <span className="text-gray-400">Class:</span>
                    <p className="font-mono text-teal-300 truncate">{testResult.node.className || 'View'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Clickable:</span>
                    <p className="font-semibold text-white">{testResult.node.clickable ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Editable:</span>
                    <p className="font-semibold text-white">{testResult.node.editable ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Bounds:</span>
                    <p className="font-mono text-gray-300">
                      [{testResult.node.bounds.x},{testResult.node.bounds.y}] {testResult.node.bounds.width}x
                      {testResult.node.bounds.height}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>No element matched this query in the active foreground window.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accessible Tree Node Hierarchy View */}
      <div className="p-4 rounded-2xl bg-[#121820] border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white">
              Active Accessibility Hierarchy: <span className="text-teal-300 capitalize">{foregroundApp}</span>
            </h3>
          </div>
          <span className="text-[10px] text-gray-400">rootInActiveWindow</span>
        </div>

        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {flatNodes.map((node) => (
            <div
              key={node.id}
              className={`p-2.5 rounded-xl border text-xs transition-colors ${
                testResult?.node?.id === node.id
                  ? 'bg-teal-950/40 border-teal-500 shadow-md ring-1 ring-teal-500/50'
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-white truncate">
                  {node.text || node.contentDescription || node.resourceId || node.className}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {node.clickable && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 uppercase">
                      Clickable
                    </span>
                  )}
                  {node.editable && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 uppercase">
                      Editable
                    </span>
                  )}
                  {node.scrollable && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 uppercase">
                      Scrollable
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono mt-1">
                {node.resourceId && <span className="text-teal-400">id: {node.resourceId}</span>}
                {node.contentDescription && <span>desc: "{node.contentDescription}"</span>}
                <span>
                  bounds: [{node.bounds.x},{node.bounds.y},{node.bounds.width}x{node.bounds.height}]
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
