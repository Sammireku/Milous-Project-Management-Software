import React from 'react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Database, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  Zap,
  HardDrive,
  FileCheck2,
  FolderTree
} from 'lucide-react';

import { OfflineImageUploader } from '../OfflineImageUploader';

export const SyncHealthView: React.FC = () => {
  const { 
    isOnline, 
    setIsOnline, 
    pendingSyncCount, 
    lastSyncedAt, 
    triggerManualSync,
    tasks,
    indicators,
    expenses,
    activeProject
  } = useFirestore();

  const { currentUser, permissions } = useAuth();

  return (
    <div className="space-y-6">
      {/* Top Banner: Architecture & Persistence Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Offline-First Firestore Engine &amp; Replication Diagnostics
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Designed for remote field stations and intermittent humanitarian operations. Mutations are committed optimistically to local cache, verified for donor compliance, and synchronized whenever an uplink is detected.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 border transition ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-amber-600" />}
              <span>{isOnline ? 'Online Uplink Active' : 'Offline Mode (Field Simulation)'}</span>
            </button>

            <button
              type="button"
              onClick={triggerManualSync}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 flex items-center space-x-2 shadow-sm transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Force Re-sync</span>
            </button>
          </div>
        </div>

        {/* Sync Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Network State</span>
              {isOnline ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
            </div>
            <p className="text-lg font-bold text-slate-800">{isOnline ? 'Connected' : 'Offline (Cached)'}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {isOnline ? 'Synchronizing mutations in real-time' : 'Saving changes to IndexedDB / localStorage'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Pending Queue</span>
              <HardDrive className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-slate-800">{pendingSyncCount} mutations</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {pendingSyncCount === 0 ? 'All local mutations flushed' : 'Awaiting network connection'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Last Reconciled</span>
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-sm font-bold text-slate-800 truncate">
              {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {new Date(lastSyncedAt).toLocaleDateString()}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Auth RBAC Tier</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-slate-800">{currentUser.role}</p>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {currentUser.displayName} ({currentUser.organization})
            </p>
          </div>
        </div>
      </div>

      {/* Active Firestore Collections Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <FolderTree className="w-4 h-4 text-emerald-600" />
              <span>NoSQL Schema Collections Registered</span>
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              5 Active Collections
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">/projects/{'{projectId}'}</span>
                <p className="text-slate-400 text-[11px]">{activeProject?.title}</p>
              </div>
              <span className="font-bold text-slate-700">1 Active</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">/tasks/{'{taskId}'}</span>
                <p className="text-slate-400 text-[11px]">Kanban lifecycle &amp; M&amp;E trigger items</p>
              </div>
              <span className="font-bold text-slate-700">{tasks.length} Documents</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">/indicators/{'{indicatorId}'}</span>
                <p className="text-slate-400 text-[11px]">LogFrame indicators with quantitative sync</p>
              </div>
              <span className="font-bold text-slate-700">{indicators.length} Indicators</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">/expenses/{'{expenseId}'}</span>
                <p className="text-slate-400 text-[11px]">Multi-Donor fractional cost splitting records</p>
              </div>
              <span className="font-bold text-slate-700">{expenses.length} Records</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">/users/{'{userId}'}</span>
                <p className="text-slate-400 text-[11px]">Google Workspace SSO user profiles</p>
              </div>
              <span className="font-bold text-slate-700">6 Profiles</span>
            </div>
          </div>
        </div>

        {/* RBAC Permission Matrix for Active Session */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Current Session Security &amp; RBAC Matrix</span>
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
              {currentUser.role}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-700">Can Create &amp; Edit Tasks:</span>
              <span className={`font-bold ${permissions.canEditTasks ? 'text-emerald-600' : 'text-slate-400'}`}>
                {permissions.canEditTasks ? 'GRANTED' : 'DENIED'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-700">Can Move Tasks to COMPLETED (Auto-Sync Trigger):</span>
              <span className={`font-bold ${permissions.canCompleteTasks ? 'text-emerald-600' : 'text-slate-400'}`}>
                {permissions.canCompleteTasks ? 'GRANTED' : 'DENIED'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-700">Can Manage M&amp;E LogFrame Indicators:</span>
              <span className={`font-bold ${permissions.canManageLogFrame ? 'text-emerald-600' : 'text-slate-400'}`}>
                {permissions.canManageLogFrame ? 'GRANTED' : 'DENIED'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-700">Can Approve Multi-Donor Expense Splits:</span>
              <span className={`font-bold ${permissions.canApproveExpenses ? 'text-emerald-600' : 'text-slate-400'}`}>
                {permissions.canApproveExpenses ? 'GRANTED' : 'DENIED'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-700">Can Execute Vertex AI Multimodal Audits:</span>
              <span className={`font-bold ${permissions.canRunAiRiskAudit ? 'text-emerald-600' : 'text-slate-400'}`}>
                {permissions.canRunAiRiskAudit ? 'GRANTED' : 'DENIED'}
              </span>
            </div>
          </div>
        </div>

        {/* Offline Image Upload & Sync Test Console */}
        <OfflineImageUploader
          targetCollection="sync_diagnostics"
          targetDocId={activeProject?.id || 'proj-gh-wash-2025'}
          targetField="testMediaUris"
          label="Field Photo & Scan Offline Upload Tester"
          description="Test camera capture, WebWorker compression (<1MB), IndexedDB offline caching, and automatic background Cloud Storage sync."
        />
      </div>
    </div>
  );
};
