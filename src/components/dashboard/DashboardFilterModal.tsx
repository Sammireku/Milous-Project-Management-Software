import React, { useState } from 'react';
import { X, SlidersHorizontal, Check, RotateCcw } from 'lucide-react';
import { Project, User } from '../../types';

export interface DashboardFilterParams {
  assignee: string; // 'ALL' or user ID/name
  location: string; // 'ALL' or specific location
  project: string;  // 'ALL' or project ID
  priority: string; // 'ALL' or 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: string;   // 'ALL' or 'TODO' | 'IN_PROGRESS' | 'DONE'
}

interface DashboardFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DashboardFilterParams;
  onApplyFilters: (filters: DashboardFilterParams) => void;
  projects: Project[];
  allUsers: User[];
}

export const DashboardFilterModal: React.FC<DashboardFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  projects,
  allUsers,
}) => {
  const [localFilters, setLocalFilters] = useState<DashboardFilterParams>(filters);

  if (!isOpen) return null;

  // Extract unique locations from projects
  const uniqueLocations = Array.from(
    new Set(projects.map((p) => p.location).filter(Boolean))
  );
  if (!uniqueLocations.includes('Tamale & Northern Region')) {
    uniqueLocations.push('Tamale & Northern Region');
  }
  if (!uniqueLocations.includes('Accra Metropolitan')) {
    uniqueLocations.push('Accra Metropolitan');
  }

  const handleReset = () => {
    const resetValues: DashboardFilterParams = {
      assignee: 'ALL',
      location: 'ALL',
      project: 'ALL',
      priority: 'ALL',
      status: 'ALL',
    };
    setLocalFilters(resetValues);
    onApplyFilters(resetValues);
    onClose();
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters(localFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Dashboard Parameters & Filters</h3>
              <p className="text-[10px] text-slate-400">Filter widgets by assignee, location, and project</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApply} className="p-5 space-y-4 text-xs">
          {/* Assignee parameter */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Assignee</label>
            <select
              value={localFilters.assignee}
              onChange={(e) => setLocalFilters({ ...localFilters, assignee: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white"
            >
              <option value="ALL">All Assignees (Entire Team)</option>
              <option value="UNASSIGNED">Unassigned Tasks</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.displayName}>
                  {u.displayName} ({u.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Location parameter */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Geographic Location / Field District</label>
            <select
              value={localFilters.location}
              onChange={(e) => setLocalFilters({ ...localFilters, location: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white"
            >
              <option value="ALL">All Locations & Regions</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  📍 {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Project parameter */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Grant / Project</label>
            <select
              value={localFilters.project}
              onChange={(e) => setLocalFilters({ ...localFilters, project: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white"
            >
              <option value="ALL">All Active Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Priority parameter */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={localFilters.priority}
                onChange={(e) => setLocalFilters({ ...localFilters, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">🔴 Urgent</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">🟢 Low</option>
              </select>
            </div>

            {/* Status parameter */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={localFilters.status}
                onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-slate-600 hover:text-slate-900 font-bold flex items-center space-x-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset parameters</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1.5 shadow-xs transition"
              >
                <Check className="w-4 h-4" />
                <span>Apply Parameters</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
