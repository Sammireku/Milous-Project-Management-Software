import React, { useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  Coins, 
  FileText, 
  FolderKanban, 
  Filter, 
  User, 
  Upload, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles 
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';

export const ActivityStreamFeed: React.FC = () => {
  const { tasks, expenses, projects, openFlyout } = useFirestore();
  const [filterType, setFilterType] = useState<'ALL' | 'STATUS' | 'EXPENSE' | 'FILES'>('ALL');

  // Synthetic activity feed derived from live Firestore state & audit logs
  const rawActivities = [
    ...tasks.map((t) => ({
      id: `act-task-${t.id}`,
      type: 'STATUS' as const,
      title: `Task Status Updated: "${t.title}"`,
      description: `Transitioned to [${t.status}] by ${t.assigneeName || 'Field Staff'}`,
      timestamp: t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:14 AM',
      dateGroup: 'Today',
      user: t.assigneeName || 'Ama Osei',
      rawItem: t,
      itemType: 'task' as const,
      badge: t.status,
      badgeColor: t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800',
      icon: CheckCircle2,
    })),
    ...expenses.map((e) => ({
      id: `act-exp-${e.id}`,
      type: 'EXPENSE' as const,
      title: `Expense Voucher Logged: $${e.totalAmount.toLocaleString()} USD`,
      description: `${e.description} • Donor: ${e.donorAllocations?.[0]?.donorCode || 'USAID'}`,
      timestamp: e.createdAt ? new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:42 AM',
      dateGroup: 'Today',
      user: e.submittedByName || 'Field Auditor',
      rawItem: e,
      itemType: 'expense' as const,
      badge: e.status,
      badgeColor: e.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
      icon: Coins,
    })),
    {
      id: 'act-file-01',
      type: 'FILES' as const,
      title: 'Proof File Uploaded: borehole_certified_test.pdf',
      description: 'Attached to Task #TSK-001 (Northern Water Well Testing) • Size: 2.4 MB',
      timestamp: '08:15 AM',
      dateGroup: 'Today',
      user: 'Ibrahim Mensah',
      rawItem: tasks[0] || {},
      itemType: 'task' as const,
      badge: 'UPLOADED',
      badgeColor: 'bg-purple-100 text-purple-800',
      icon: Upload,
    },
    {
      id: 'act-file-02',
      type: 'FILES' as const,
      title: 'Donor Voucher Scan Uploaded: receipt_fuel_log_09.png',
      description: 'Attached to Expense #EXP-USAID-102 • OCR Status: Verified',
      timestamp: 'Yesterday',
      dateGroup: 'Yesterday',
      user: 'Kofi Owusu',
      rawItem: expenses[0] || {},
      itemType: 'expense' as const,
      badge: 'OCR VERIFIED',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      icon: FileText,
    },
  ];

  const filteredActivities = rawActivities.filter((a) => {
    if (filterType === 'ALL') return true;
    return a.type === filterType;
  });

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Enterprise Activity Stream
            </h3>
            <p className="text-[11px] text-slate-500">
              Data-dense audit feed tracking statuses, approvals &amp; file uploads
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filterType === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType('STATUS')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filterType === 'STATUS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Statuses
          </button>
          <button
            type="button"
            onClick={() => setFilterType('EXPENSE')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filterType === 'EXPENSE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Approvals
          </button>
          <button
            type="button"
            onClick={() => setFilterType('FILES')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filterType === 'FILES'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Uploads
          </button>
        </div>
      </div>

      {/* Utilitarian Data Feed List */}
      <div className="space-y-2 font-mono text-xs">
        {filteredActivities.map((act) => {
          const IconComp = act.icon;
          return (
            <div
              key={act.id}
              onClick={() => openFlyout(act.itemType, act.rawItem)}
              className="p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/80 transition cursor-pointer flex items-start justify-between group"
            >
              <div className="flex items-start space-x-3 truncate pr-2">
                <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0 mt-0.5">
                  <IconComp className="w-4 h-4 text-slate-700" />
                </div>
                <div className="truncate space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 truncate font-sans text-xs">
                      {act.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${act.badgeColor}`}>
                      {act.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-sans truncate">
                    {act.description}
                  </p>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{act.user}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{act.timestamp}</span>
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition shrink-0 self-center">
                Inspect &rarr;
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
