import React from 'react';
import { Project } from '../../types';
import { 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  RotateCcw, 
  Sparkles,
  Layers
} from 'lucide-react';

export interface FilterState {
  searchQuery: string;
  projectId: string;
  donorCode: string;
  startDate: string;
  endDate: string;
}

export interface GlobalFilterToolbarProps {
  filters: FilterState;
  onFilterChange: (updatedFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  projects?: Project[];
  availableDonors?: string[];
  placeholder?: string;
  className?: string;
}

const DEFAULT_DONORS = ['USAID', 'EU', 'UNICEF', 'FCDO', 'GLOBAL_FUND', 'WORLD_BANK'];

export const GlobalFilterToolbar: React.FC<GlobalFilterToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  projects = [],
  availableDonors = DEFAULT_DONORS,
  placeholder = 'Search by title, code, description or vendor...',
  className = '',
}) => {
  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.projectId !== 'ALL' ||
    filters.donorCode !== 'ALL' ||
    filters.startDate !== '' ||
    filters.endDate !== '';

  const activeCount = [
    filters.searchQuery.trim() !== '',
    filters.projectId !== 'ALL',
    filters.donorCode !== 'ALL',
    filters.startDate !== '',
    filters.endDate !== '',
  ].filter(Boolean).length;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 ${className}`}>
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <div className="relative min-w-[150px]">
            <div className="flex items-center space-x-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filters.projectId}
                onChange={(e) => onFilterChange({ projectId: e.target.value })}
                className="w-full bg-transparent focus:outline-none cursor-pointer font-semibold text-slate-800"
              >
                <option value="ALL">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `${p.code} - ${p.title}` : p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Donor Code Filter */}
          <div className="relative min-w-[140px]">
            <div className="flex items-center space-x-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filters.donorCode}
                onChange={(e) => onFilterChange({ donorCode: e.target.value })}
                className="w-full bg-transparent focus:outline-none cursor-pointer font-semibold text-slate-800"
              >
                <option value="ALL">All Donors</option>
                {availableDonors.map((d) => (
                  <option key={d} value={d}>
                    {d} Funding
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              title="Start Date"
              className="bg-transparent focus:outline-none text-[11px] font-medium text-slate-700 cursor-pointer"
            />
            <span className="text-slate-300 font-bold">→</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              title="End Date"
              className="bg-transparent focus:outline-none text-[11px] font-medium text-slate-700 cursor-pointer"
            />
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
              {activeCount > 0 && (
                <span className="ml-1 bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {activeCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalFilterToolbar;
