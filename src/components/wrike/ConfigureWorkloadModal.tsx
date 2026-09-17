import React, { useState } from 'react';
import { X, Users, Folder, ChevronDown, Check } from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';

interface ConfigureWorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (chartConfig: any) => void;
}

export const ConfigureWorkloadModal: React.FC<ConfigureWorkloadModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { projects } = useFirestore();
  const [chartName, setChartName] = useState('');
  const [showError, setShowError] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(['Milou Mireku']);
  const [userQuery, setUserQuery] = useState('');
  const [selectedSpace, setSelectedSpace] = useState('Personal');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [showAdvanced, setShowAdvanced] = useState(true);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chartName.trim()) {
      setShowError(true);
      return;
    }
    if (onCreated) {
      onCreated({
        name: chartName.trim(),
        users: selectedUsers,
        space: selectedSpace,
        projectId: selectedProject,
      });
    }
    onClose();
  };

  const addAllUsers = () => {
    setSelectedUsers(['Milou Mireku', 'Team Member 1', 'Team Member 2']);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Configure team workload</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Chart Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Name of the chart <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={chartName}
              onChange={(e) => {
                setChartName(e.target.value);
                if (showError && e.target.value.trim()) setShowError(false);
              }}
              placeholder="e.g. Current Month Workload"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all outline-none ${
                showError
                  ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
              }`}
            />
            {showError && (
              <p className="text-xs text-red-500 font-medium">Workload chart must have a name</p>
            )}
          </div>

          {/* Users */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Users
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 border border-slate-200 rounded-lg min-h-[44px] items-center bg-slate-50/50">
              {selectedUsers.map((u) => (
                <span
                  key={u}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 shadow-2xs"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">
                    {u.charAt(0)}
                  </span>
                  <span>{u}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedUsers(selectedUsers.filter((x) => x !== u))}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Enter name or email..."
                className="bg-transparent text-xs outline-none flex-1 min-w-[140px] px-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && userQuery.trim()) {
                    e.preventDefault();
                    if (!selectedUsers.includes(userQuery.trim())) {
                      setSelectedUsers([...selectedUsers, userQuery.trim()]);
                    }
                    setUserQuery('');
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={addAllUsers}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              + Add all account users
            </button>
          </div>

          {/* Location & Scope */}
          {showAdvanced && (
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Location
                  </label>
                  <p className="text-xs text-slate-500 mb-2">Workload chart belongs to:</p>
                  <select
                    value={selectedSpace}
                    onChange={(e) => setSelectedSpace(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-emerald-600"
                  >
                    <option value="Personal">Space → Personal</option>
                    <option value="First space">First space</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Scope
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Show work from a specific project or the whole account:
                  </p>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-emerald-600"
                  >
                    <option value="all">Whole account (all projects)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title || p.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              {showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Create</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
