import React, { useState, useMemo } from 'react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart3, 
  Target, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Users, 
  Layers, 
  ArrowUpRight,
  TrendingUp,
  History
} from 'lucide-react';
import { Indicator } from '../../types';
import { GlobalFilterToolbar, FilterState } from '../common/GlobalFilterToolbar';
import { IndicatorProgressRecharts } from '../indicators/IndicatorProgressRecharts';
import { VoiceDictationButton } from '../common/VoiceDictationButton';

export const IndicatorsView: React.FC = () => {
  const { indicators, tasks, projects, recordIndicatorMeasurement, activeProject } = useFirestore();
  const { permissions, currentUser } = useAuth();

  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(indicators[0] || null);
  const [manualIncrement, setManualIncrement] = useState<number>(1);
  const [measurementNote, setMeasurementNote] = useState<string>('');

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    projectId: 'ALL',
    donorCode: 'ALL',
    startDate: '',
    endDate: '',
  });

  const filteredIndicators = useMemo(() => {
    return indicators.filter((ind) => {
      if (filters.projectId !== 'ALL' && ind.projectId !== filters.projectId) {
        return false;
      }
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesCode = ind.code?.toLowerCase().includes(q);
        const matchesTitle = ind.title?.toLowerCase().includes(q);
        if (!matchesCode && !matchesTitle) return false;
      }
      return true;
    });
  }, [indicators, filters]);


  const handleManualUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndicator || manualIncrement <= 0) return;
    await recordIndicatorMeasurement(selectedIndicator.id, manualIncrement, measurementNote);
    setMeasurementNote('');
  };

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>LogFrame Indicators</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{indicators.length}</p>
          <p className="text-xs text-slate-400 mt-1">
            {indicators.filter((i) => i.autoSyncEnabled).length} linked with Task Auto-Sync
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Linked Field Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {tasks.filter((t) => !!t.linkedIndicatorId).length}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {tasks.filter((t) => !!t.linkedIndicatorId && t.status === 'COMPLETED').length} completed &amp; synced
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Target Achievement Rate</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {Math.round(
              (indicators.reduce((acc, curr) => acc + (curr.actualValue / (curr.target || 1)), 0) /
                (indicators.length || 1)) *
                100
            )}%
          </p>
          <p className="text-xs text-slate-400 mt-1">Across all quantitative results</p>
        </div>
      </div>

      {/* Global Filter Toolbar */}
      <GlobalFilterToolbar
        filters={filters}
        onFilterChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
        onResetFilters={() =>
          setFilters({
            searchQuery: '',
            projectId: 'ALL',
            donorCode: 'ALL',
            startDate: '',
            endDate: '',
          })
        }
        projects={projects}
        placeholder="Filter indicators by code or title..."
      />

      {/* M&E Performance Recharts Visualization */}
      <IndicatorProgressRecharts
        indicators={filteredIndicators.length > 0 ? filteredIndicators : indicators}
        selectedIndicatorId={selectedIndicator?.id}
        onSelectIndicator={(id) => {
          const found = indicators.find((i) => i.id === id);
          if (found) setSelectedIndicator(found);
        }}
      />

      {/* Main Split: Indicators List & Detail Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Indicators List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              M&amp;E Logical Framework Indicators
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              Live Auto-Sync Active
            </span>
          </div>

          <div className="space-y-3">
            {filteredIndicators.map((ind) => {

              const percentage = Math.min(100, Math.round((ind.actualValue / (ind.target || 1)) * 100));
              const isSelected = selectedIndicator?.id === ind.id;
              const linkedTasksCount = tasks.filter((t) => t.linkedIndicatorId === ind.id).length;

              return (
                <div
                  key={ind.id}
                  onClick={() => setSelectedIndicator(ind)}
                  className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all shadow-sm ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                          {ind.code}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {ind.type}
                        </span>
                        {ind.autoSyncEnabled && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            <span>Auto-Sync Enabled</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5">{ind.title}</h4>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900">
                        {ind.actualValue.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400"> / {ind.target.toLocaleString()} {ind.unit || ''}</span>
                      <p className="text-xs font-bold text-emerald-600">{percentage}% reached</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  {/* Disaggregation Pills & Linked Tasks */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {ind.disaggregations?.map((d, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600"
                        >
                          {d.category}: <strong className="text-slate-800">{d.value} ({d.count})</strong>
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium">
                      {linkedTasksCount} linked Kanban tasks
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Indicator Details & Audit History */}
        <div className="space-y-6">
          {selectedIndicator ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {selectedIndicator.code}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Audit History</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1">{selectedIndicator.title}</h4>
              </div>

              {/* Progress Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Current Progress</span>
                  <span className="font-bold text-slate-800">
                    {selectedIndicator.actualValue} / {selectedIndicator.target} {selectedIndicator.unit}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((selectedIndicator.actualValue / (selectedIndicator.target || 1)) * 100))}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Manual Field Measurement Verification (M&E Officers) */}
              {permissions.canManageLogFrame && (
                <form onSubmit={handleManualUpdate} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Record Field Measurement</span>
                    <VoiceDictationButton
                      onAppendText={(dictated) => {
                        setMeasurementNote((prev) => (prev ? `${prev} ${dictated}` : dictated));
                      }}
                      label="Dictate M&E Note"
                      size="sm"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="1"
                      value={manualIncrement}
                      onChange={(e) => setManualIncrement(Number(e.target.value))}
                      placeholder="Qty"
                      className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                    />
                    <input
                      type="text"
                      value={measurementNote}
                      onChange={(e) => setMeasurementNote(e.target.value)}
                      placeholder="Verification source (e.g. Tamale field signoff)"
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                  >
                    Add Progress Record
                  </button>
                </form>
              )}

              {/* Auto-Sync History Log */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center space-x-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Task-to-Indicator Audit Log</span>
                </h5>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedIndicator.history && selectedIndicator.history.length > 0 ? (
                    selectedIndicator.history.map((h) => (
                      <div key={h.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${h.increment > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {h.increment > 0 ? `+${h.increment}` : h.increment} {selectedIndicator.unit}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {h.sourceTaskTitle && (
                          <p className="text-[11px] text-slate-700 font-medium truncate">
                            Task: {h.sourceTaskTitle}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {h.note}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No increments logged yet. Drag a linked task to <strong>COMPLETED</strong> on the Kanban board to trigger an auto-sync.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-400 text-xs">
              Select an indicator to view its verification history and disaggregated progress.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
