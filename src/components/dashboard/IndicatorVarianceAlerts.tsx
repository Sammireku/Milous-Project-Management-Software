import React from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  Clock, 
  Send, 
  BarChart3, 
  ArrowRight 
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';

export const IndicatorVarianceAlerts: React.FC = () => {
  const { indicators, tasks, openFlyout } = useFirestore();

  // Find indicators with progress < 75%
  const lowProgressIndicators = indicators.filter((ind) => {
    const target = ind.target || 1;
    const actual = ind.actualValue || 0;
    const pct = Math.round((actual / target) * 100);
    return pct < 75;
  });

  // Find tasks requiring urgent attention or pending verification
  const overdueOrBlockedTasks = tasks.filter(
    (t) => t.status === 'VERIFICATION' || (t.priority === 'URGENT' && t.status !== 'COMPLETED')
  );

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold border border-amber-500/20">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              3. M&amp;E Indicator Variance Alerts
            </h3>
            <p className="text-xs text-slate-500">
              Automated threshold monitoring flagging indicators &lt;75% target and overdue tasks
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
          {lowProgressIndicators.length + overdueOrBlockedTasks.length} Alerts Active
        </span>
      </div>

      {/* Variance Alert Stream */}
      <div className="space-y-2.5 text-xs">
        {lowProgressIndicators.map((ind) => {
          const target = ind.target || 1;
          const actual = ind.actualValue || 0;
          const pct = Math.round((actual / target) * 100);
          return (
            <div
              key={ind.id}
              onClick={() => openFlyout('indicator', ind)}
              className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 hover:bg-amber-100/60 transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 truncate pr-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-slate-900 block truncate">
                    [{ind.code}] {ind.title}
                  </span>
                  <span className="text-[11px] text-amber-900 font-medium">
                    Target Achievement: {pct}% ({actual} / {target} {ind.unit || ''}) — Variance below 75% threshold
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-xl bg-amber-200/80 text-amber-950 font-bold font-mono text-[10px] shrink-0">
                DISPATCH SMS ALERT
              </span>
            </div>
          );
        })}

        {overdueOrBlockedTasks.map((t) => (
          <div
            key={t.id}
            onClick={() => openFlyout('task', t)}
            className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 hover:bg-rose-100/60 transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 truncate pr-2">
              <Clock className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-slate-900 block truncate">
                  Task Variance: "{t.title}"
                </span>
                <span className="text-[11px] text-rose-900 font-medium">
                  Status: [{t.status}] • Assigned: {t.assigneeName || 'Field Staff'} • Due: {t.plannedEndDate}
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-xl bg-rose-200/80 text-rose-950 font-bold font-mono text-[10px] shrink-0">
              ESCALATE EMAIL
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
