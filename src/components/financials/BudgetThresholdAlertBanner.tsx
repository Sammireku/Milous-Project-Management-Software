import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  BellRing, 
  Sliders, 
  CheckCircle2, 
  X, 
  DollarSign, 
  TrendingUp, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Expense, Project } from '../../types';

interface BudgetThresholdAlertBannerProps {
  expenses: Expense[];
  activeProject?: Project;
}

interface DonorLimit {
  donorCode: string;
  donorName: string;
  grantCeiling: number;
  warnThresholdPercent: number; // e.g. 80%
  criticalThresholdPercent: number; // e.g. 95%
}

export const BudgetThresholdAlertBanner: React.FC<BudgetThresholdAlertBannerProps> = ({
  expenses,
  activeProject,
}) => {
  const [donorLimits, setDonorLimits] = useState<DonorLimit[]>([
    {
      donorCode: 'USAID',
      donorName: 'USAID Bureau for Humanitarian Assistance',
      grantCeiling: 280000,
      warnThresholdPercent: 80,
      criticalThresholdPercent: 92,
    },
    {
      donorCode: 'EU',
      donorName: 'European Civil Protection & Humanitarian Aid (ECHO)',
      grantCeiling: 160000,
      warnThresholdPercent: 75,
      criticalThresholdPercent: 90,
    },
    {
      donorCode: 'UNICEF',
      donorName: 'UNICEF WASH Programme Allocation',
      grantCeiling: 95000,
      warnThresholdPercent: 80,
      criticalThresholdPercent: 95,
    },
  ]);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});

  // Compute total spending per donor across logged expenses
  const donorSpending = useMemo(() => {
    const spending: Record<string, number> = {};
    expenses.forEach((e) => {
      e.donorAllocations.forEach((alloc) => {
        spending[alloc.donorCode] = (spending[alloc.donorCode] || 0) + alloc.allocatedAmount;
      });
    });
    return spending;
  }, [expenses]);

  // Evaluate alerts
  const evaluatedAlerts = useMemo(() => {
    return donorLimits.map((limit) => {
      const spent = donorSpending[limit.donorCode] || 0;
      const percentUsed = Math.round((spent / limit.grantCeiling) * 100);
      const isCritical = percentUsed >= limit.criticalThresholdPercent;
      const isWarning = percentUsed >= limit.warnThresholdPercent && !isCritical;
      const isOverCeiling = percentUsed > 100;

      return {
        ...limit,
        spent,
        percentUsed,
        isWarning,
        isCritical,
        isOverCeiling,
        remaining: limit.grantCeiling - spent,
      };
    });
  }, [donorLimits, donorSpending]);

  const activeBreaches = evaluatedAlerts.filter(
    (a) => (a.isWarning || a.isCritical) && !dismissedAlerts[a.donorCode]
  );

  const handleDismiss = (donorCode: string) => {
    setDismissedAlerts((prev) => ({ ...prev, [donorCode]: true }));
  };

  const handleUpdateCeiling = (donorCode: string, newCeiling: number) => {
    setDonorLimits((prev) =>
      prev.map((l) => (l.donorCode === donorCode ? { ...l, grantCeiling: newCeiling } : l))
    );
  };

  const handleUpdateWarnThreshold = (donorCode: string, newWarn: number) => {
    setDonorLimits((prev) =>
      prev.map((l) => (l.donorCode === donorCode ? { ...l, warnThresholdPercent: newWarn } : l))
    );
  };

  return (
    <div className="space-y-3">
      {/* Real-Time Breaches Alert Notification Bars */}
      {activeBreaches.map((breach) => (
        <div
          key={breach.donorCode}
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs transition animate-in fade-in ${
            breach.isCritical
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                breach.isCritical
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {breach.isCritical ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-sm">
                  {breach.isCritical
                    ? `CRITICAL: Donor Budget Ceiling Breach (${breach.donorCode})`
                    : `WARNING: Pre-Defined Compliance Limit Approaching (${breach.donorCode})`}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    breach.isCritical
                      ? 'bg-rose-200 text-rose-900 border border-rose-300'
                      : 'bg-amber-200 text-amber-900 border border-amber-300'
                  }`}
                >
                  {breach.percentUsed}% Burn Rate
                </span>
              </div>

              <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                Allocated spending for <strong>{breach.donorName}</strong> has reached{' '}
                <strong>${breach.spent.toLocaleString()}</strong> of the $
                {breach.grantCeiling.toLocaleString()} grant ceiling.
                {breach.isOverCeiling ? (
                  <span className="font-bold text-rose-700 ml-1">
                    Exceeded ceiling by ${Math.abs(breach.remaining).toLocaleString()} USD. Non-allowable cost under grant regulations!
                  </span>
                ) : (
                  <span className="ml-1">
                    Only ${breach.remaining.toLocaleString()} USD remains before hard freeze.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsConfigOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                breach.isCritical
                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-300'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
              }`}
            >
              Adjust Limits
            </button>
            <button
              type="button"
              onClick={() => handleDismiss(breach.donorCode)}
              className="p-1.5 rounded-xl hover:bg-black/5 text-slate-500 hover:text-slate-800 transition"
              title="Acknowledge & Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Compliance Health Bar & Limit Controls Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900">
                Donor Compliance &amp; Real-Time Grant Limits
              </span>
              <span className="text-[11px] text-slate-500 block">
                Automated threshold monitoring prevents unallowable cost overruns
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 self-start sm:self-auto px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isConfigOpen ? 'Hide Threshold Settings' : 'Configure Compliance Thresholds'}</span>
            {isConfigOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Live Progress Bars for Each Donor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {evaluatedAlerts.map((donor) => {
            const isAlert = donor.isCritical || donor.isWarning;
            return (
              <div key={donor.donorCode} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-800">{donor.donorCode} Grant</span>
                  <span
                    className={`font-mono font-bold text-[11px] ${
                      donor.isCritical
                        ? 'text-rose-600'
                        : donor.isWarning
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {donor.percentUsed}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      donor.isCritical
                        ? 'bg-rose-500'
                        : donor.isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, donor.percentUsed)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>${donor.spent.toLocaleString()} spent</span>
                  <span>${donor.grantCeiling.toLocaleString()} max</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsible Threshold Configuration Drawer */}
        {isConfigOpen && (
          <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Adjust Donor Grant Ceilings &amp; Trigger Percentages
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {donorLimits.map((limit) => (
                <div key={limit.donorCode} className="p-3 bg-slate-100/60 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block">{limit.donorCode} Thresholds</span>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-medium block">Grant Ceiling (USD)</label>
                    <input
                      type="number"
                      step={5000}
                      value={limit.grantCeiling}
                      onChange={(e) => handleUpdateCeiling(limit.donorCode, Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Warning Alert Trigger</span>
                      <span className="font-bold text-amber-700">{limit.warnThresholdPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={95}
                      value={limit.warnThresholdPercent}
                      onChange={(e) => handleUpdateWarnThreshold(limit.donorCode, Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
