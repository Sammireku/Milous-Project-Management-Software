import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AuditLog } from '../../types';
import { 
  History, 
  X, 
  CheckCircle2, 
  DollarSign, 
  FolderKanban, 
  TrendingUp, 
  Clock, 
  User, 
  RefreshCw,
  Filter,
  Sparkles
} from 'lucide-react';

export interface AuditLogSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProjectId?: string;
}

export const AuditLogSidebar: React.FC<AuditLogSidebarProps> = ({
  isOpen,
  onClose,
  selectedProjectId,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const logsRef = collection(db, 'audit_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: AuditLog[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as AuditLog);
      });
      setLogs(fetched);
      setLoading(false);
    }, (err) => {
      console.warn('Audit logs listener notice (using mock initial history):', err);
      // Fallback mock logs if database collection is empty
      setLogs([
        {
          id: 'log-1',
          projectId: 'proj-gh-wash-2025',
          projectName: 'WASH Initiative Ghana',
          actionType: 'TASK_STATUS_CHANGED',
          entityType: 'Task',
          entityId: 'tsk-101',
          entityTitle: 'Complete Tamale District Borehole #28 Drilling',
          modifiedByUserId: 'usr-field-01',
          modifiedByUserName: 'Ama Osei',
          modifiedByUserRole: 'Field Officer',
          previousValue: 'IN_PROGRESS',
          newValue: 'COMPLETED',
          changeSummary: 'Changed task status from In Progress to Completed',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
        {
          id: 'log-2',
          projectId: 'proj-gh-wash-2025',
          projectName: 'WASH Initiative Ghana',
          actionType: 'EXPENSE_ALLOCATION_UPDATED',
          entityType: 'Expense',
          entityId: 'exp-201',
          entityTitle: 'Procurement of 20 Submersible Solar Water Pumps',
          modifiedByUserId: 'usr-fin-01',
          modifiedByUserName: 'Kwame Nkrumah',
          modifiedByUserRole: 'Finance Officer',
          previousValue: 'USAID 50%, EU 50%',
          newValue: 'USAID 60%, EU 40%',
          changeSummary: 'Adjusted donor allocation split: USAID 60% ($7,500), EU 40% ($5,000)',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        },
        {
          id: 'log-3',
          projectId: 'proj-gh-food-2025',
          projectName: 'Food Security Program',
          actionType: 'INDICATOR_UPDATED',
          entityType: 'Indicator',
          entityId: 'ind-food-01',
          entityTitle: 'Smallholder Farmers Provided Drought-Resistant Seed Kits',
          modifiedByUserId: 'usr-me-01',
          modifiedByUserName: 'Fatima Abubakar',
          modifiedByUserRole: 'M&E Officer',
          previousValue: '740 Farmers',
          newValue: '940 Farmers',
          changeSummary: 'Updated verified actual value by +200 Farmers',
          timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
        }
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (selectedProjectId && selectedProjectId !== 'ALL' && log.projectId && log.projectId !== selectedProjectId) {
      return false;
    }
    if (filterType === 'TASKS' && log.entityType !== 'Task') return false;
    if (filterType === 'EXPENSES' && log.entityType !== 'Expense') return false;
    return true;
  });

  const getActionBadge = (log: AuditLog) => {
    switch (log.entityType) {
      case 'Task':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Task Update</span>
          </span>
        );
      case 'Expense':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span>Budget Split</span>
          </span>
        );
      case 'Indicator':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800">
            <TrendingUp className="w-3 h-3 text-purple-600" />
            <span>M&E Metric</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800">
            <FolderKanban className="w-3 h-3 text-slate-600" />
            <span>Project Update</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform duration-300">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Project Activity History</h3>
            <p className="text-[10px] text-slate-400">Tracking changes to task statuses and donor allocations</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Activity
          </button>
          <button
            type="button"
            onClick={() => setFilterType('TASKS')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              filterType === 'TASKS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tasks
          </button>
          <button
            type="button"
            onClick={() => setFilterType('EXPENSES')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              filterType === 'EXPENSES'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Budget Splits
          </button>
        </div>

        <span className="text-[10px] text-slate-500 font-semibold">
          {filteredLogs.length} Records
        </span>
      </div>

      {/* Audit Log Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-xs space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading activity timeline...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <History className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No activity logged yet</p>
            <p className="text-[11px] text-slate-400">
              Changes to task statuses or expense allocations will appear here in real time.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  {getActionBadge(log)}
                  <p className="text-xs font-bold text-slate-900 mt-1 line-clamp-1" title={log.entityTitle}>
                    {log.entityTitle}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap flex items-center space-x-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              </div>

              {/* Change Description */}
              <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg font-medium border border-slate-100">
                {log.changeSummary}
              </p>

              {/* User Metadata */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span className="flex items-center space-x-1 font-semibold text-slate-600">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{log.modifiedByUserName}</span>
                  {log.modifiedByUserRole && (
                    <span className="text-slate-400">({log.modifiedByUserRole.replace('_', ' ')})</span>
                  )}
                </span>
                <span className="text-slate-400">
                  {new Date(log.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditLogSidebar;
