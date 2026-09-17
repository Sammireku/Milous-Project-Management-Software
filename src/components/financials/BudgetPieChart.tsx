import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Project, Expense } from '../../types';
import { Wallet } from 'lucide-react';

interface BudgetPieChartProps {
  project?: Project | null;
  expenses: Expense[];
}

const DONOR_COLORS: Record<string, string> = {
  USAID: '#059669', // Emerald
  EU: '#2563eb',    // Blue
  UNICEF: '#d97706',// Amber
  FCDO: '#7c3aed',  // Purple
  GLOBAL_FUND: '#dc2626', // Red
  WORLD_BANK: '#0284c7', // Sky
  DEFAULT: '#64748b',
};

export const BudgetPieChart: React.FC<BudgetPieChartProps> = ({ project, expenses }) => {
  if (!project) return null;

  // Aggregate spent funds per donor code from approved or audited expenses
  const donorSpentMap: Record<string, number> = {};
  
  expenses
    .filter((e) => e.status === 'APPROVED' || e.status === 'AUDITED')
    .forEach((e) => {
      e.donorAllocations.forEach((alloc) => {
        const code = alloc.donorCode || 'OTHER';
        donorSpentMap[code] = (donorSpentMap[code] || 0) + (alloc.allocatedAmount || 0);
      });
    });

  // Calculate detailed grant balances per donor
  const donorData = project.donors.map((donor) => {
    const totalAllocated = donor.totalAllocation || 0;
    const totalSpent = donorSpentMap[donor.donorCode] || 0;
    const remaining = Math.max(0, totalAllocated - totalSpent);
    const spentPercentage = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

    return {
      name: donor.donorCode,
      totalAllocated,
      totalSpent,
      remaining,
      spentPercentage,
    };
  });

  // Pie chart dataset for donor spent share
  const pieSpentData = donorData.map((d) => ({
    name: `${d.name} Spent`,
    value: d.totalSpent > 0 ? d.totalSpent : d.totalAllocated * 0.1, // Fallback visual balance
    color: DONOR_COLORS[d.name] || DONOR_COLORS.DEFAULT,
  }));

  const totalSpentAll = donorData.reduce((acc, curr) => acc + curr.totalSpent, 0);
  const totalBudget = project.totalBudget || 1;
  const totalRemainingAll = Math.max(0, totalBudget - totalSpentAll);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <span>Project Budget Utilization & Donor Funding</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Visual comparison of allocated grant budgets vs spent and remaining funds per donor
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-400">Total Spent: </span>
            <span className="font-extrabold text-emerald-700">${totalSpentAll.toLocaleString()}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-slate-400">Remaining Funds: </span>
            <span className="font-extrabold text-slate-800">${totalRemainingAll.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Visual Chart & Donor Progress Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Pie Chart */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700 text-center">
            Funding Allocation Share by Donor
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieSpentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieSpentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donor Progress Cards */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-700">
            Donor Grant Balances &amp; Usage Rate
          </p>
          <div className="space-y-2.5">
            {donorData.map((d) => (
              <div
                key={d.name}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block" 
                      style={{ backgroundColor: DONOR_COLORS[d.name] || DONOR_COLORS.DEFAULT }} 
                    />
                    <span>{d.name} Grant</span>
                  </span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {d.spentPercentage}% Utilized
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(8, d.spentPercentage))}%`,
                      backgroundColor: DONOR_COLORS[d.name] || DONOR_COLORS.DEFAULT,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Spent: <strong className="text-slate-800">${d.totalSpent.toLocaleString()}</strong></span>
                  <span>Grant: <strong className="text-slate-800">${d.totalAllocated.toLocaleString()}</strong></span>
                  <span>Remaining: <strong className="text-emerald-800">${d.remaining.toLocaleString()}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPieChart;
