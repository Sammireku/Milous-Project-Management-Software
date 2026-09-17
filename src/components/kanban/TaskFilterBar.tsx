import React from 'react';
import { Search, Filter, Zap, RefreshCcw } from 'lucide-react';
import { Indicator, TaskPriority } from '../../types';

interface TaskFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  priorityFilter: TaskPriority | 'ALL';
  onPriorityFilterChange: (p: TaskPriority | 'ALL') => void;
  indicatorFilter: string;
  onIndicatorFilterChange: (indId: string) => void;
  autoSyncOnly: boolean;
  onAutoSyncOnlyToggle: () => void;
  indicators: Indicator[];
  totalTasks: number;
  filteredTasksCount: number;
  onResetFilters: () => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  indicatorFilter,
  onIndicatorFilterChange,
  autoSyncOnly,
  onAutoSyncOnlyToggle,
  indicators,
  totalTasks,
  filteredTasksCount,
  onResetFilters,
}) => {
  const isFiltered = searchQuery !== '' || priorityFilter !== 'ALL' || indicatorFilter !== '' || autoSyncOnly;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search field tasks or locations..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value as TaskPriority | 'ALL')}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          {/* Indicator filter */}
          <select
            value={indicatorFilter}
            onChange={(e) => onIndicatorFilterChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 max-w-[200px] truncate focus:outline-none"
          >
            <option value="">All M&amp;E Indicators</option>
            {indicators.map((ind) => (
              <option key={ind.id} value={ind.id}>
                [{ind.code}] {ind.title}
              </option>
            ))}
          </select>

          {/* Auto-Sync Toggle */}
          <button
            type="button"
            onClick={onAutoSyncOnlyToggle}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition ${
              autoSyncOnly
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-400'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${autoSyncOnly ? 'text-emerald-600 fill-emerald-600' : 'text-slate-400'}`} />
            <span>Auto-Sync Only</span>
          </button>

          {/* Reset Filters button if active */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition flex items-center space-x-1"
              title="Reset all filters"
            >
              <RefreshCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Counter badge */}
        <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap self-end md:self-center">
          Showing <span className="font-bold text-slate-800">{filteredTasksCount}</span> of{' '}
          <span className="font-bold text-slate-800">{totalTasks}</span> tasks
        </div>
      </div>
    </div>
  );
};
