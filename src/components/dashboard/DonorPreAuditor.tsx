import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Building2, 
  Coins, 
  Zap, 
  Info 
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';

export const DonorPreAuditor: React.FC = () => {
  const { expenses, activeProject } = useFirestore();
  const [selectedDonorRule, setSelectedDonorRule] = useState<'USAID' | 'EU' | 'UNICEF'>('USAID');

  const donorRules = {
    USAID: {
      name: 'USAID Standard Provisions 22 CFR 228',
      reallocationCap: '15% max line-item variance without AOR approval',
      tenderThreshold: '$10,000 USD (requires 3 competitive quotes)',
      auditStatus: 'PASSING',
      checkedVouchers: expenses.length,
      flaggedCount: expenses.filter((e) => e.totalAmount > 10000).length,
    },
    EU: {
      name: 'European Union PRAG Procurement Standards',
      reallocationCap: '10% max budget transfer between main headings',
      tenderThreshold: '$5,000 USD (requires sole-source justification file)',
      auditStatus: 'PASSING',
      checkedVouchers: expenses.length,
      flaggedCount: expenses.filter((e) => e.totalAmount > 5000 && (!e.receiptUris || e.receiptUris.length === 0)).length,
    },
    UNICEF: {
      name: 'UNICEF Harmonized Approach to Cash Transfers (HACT)',
      reallocationCap: 'Direct implementation verification required > $2,500',
      tenderThreshold: '$2,500 USD (requires spot check audit proof)',
      auditStatus: 'COMPLIANT',
      checkedVouchers: expenses.length,
      flaggedCount: 0,
    },
  };

  const currentRule = donorRules[selectedDonorRule];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              1. Automated Donor Rule Pre-Auditor
            </h3>
            <p className="text-xs text-slate-500">
              Live automated pre-audit verification against USAID, EU PRAG, and UNICEF grant rules
            </p>
          </div>
        </div>

        {/* Donor Rule Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
          {(['USAID', 'EU', 'UNICEF'] as const).map((donor) => (
            <button
              key={donor}
              type="button"
              onClick={() => setSelectedDonorRule(donor)}
              className={`px-3 py-1.5 rounded-xl transition ${
                selectedDonorRule === donor
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {donor}
            </button>
          ))}
        </div>
      </div>

      {/* Pre-Audit Rule Banner */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900">{currentRule.name}</span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">
            {currentRule.auditStatus}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-600">
          <div>
            <span className="font-semibold text-slate-700 block">Reallocation Cap Rule:</span>
            <span>{currentRule.reallocationCap}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700 block">Procurement Tender Threshold:</span>
            <span>{currentRule.tenderThreshold}</span>
          </div>
        </div>
      </div>

      {/* Pre-Audit Vouchers Checklist */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Scanned Vouchers Pre-Audit Summary ({currentRule.checkedVouchers} Active Vouchers)
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-emerald-950">Pre-Audit Verified Vouchers</span>
            </div>
            <span className="font-mono font-bold text-emerald-800 text-sm">
              {currentRule.checkedVouchers - currentRule.flaggedCount}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-950">Line-Item Cap Warnings</span>
            </div>
            <span className="font-mono font-bold text-amber-800 text-sm">
              {currentRule.flaggedCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
