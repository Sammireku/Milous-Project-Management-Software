import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { 
  TrendingUp, 
  Flame, 
  DollarSign, 
  Calendar, 
  PieChart as PieIcon, 
  BarChart3, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  ArrowUpRight,
  ShieldAlert,
  Wallet,
  Building2,
  Clock
} from 'lucide-react';
import { Expense, Project, Donor } from '../../types';

interface FinancialAnalyticsDashboardProps {
  expenses: Expense[];
  projects: Project[];
  donors: Donor[];
  selectedDisplayCurrency: string;
  convertCurrency: (amount: number, from: string, to: string) => number;
}

const DONOR_PALETTE: Record<string, { main: string; light: string; stroke: string }> = {
  USAID: { main: '#059669', light: '#d1fae5', stroke: '#047857' },
  EU: { main: '#2563eb', light: '#dbeafe', stroke: '#1d4ed8' },
  UNICEF: { main: '#d97706', light: '#fef3c7', stroke: '#b45309' },
  FCDO: { main: '#7c3aed', light: '#ede9fe', stroke: '#6d28d9' },
  GLOBAL_FUND: { main: '#dc2626', light: '#fee2e2', stroke: '#b91c1c' },
  WORLD_BANK: { main: '#0284c7', light: '#e0f2fe', stroke: '#0369a1' },
  DEFAULT: { main: '#64748b', light: '#f1f5f9', stroke: '#475569' },
};

const CATEGORY_COLORS: Record<string, string> = {
  'Personnel': '#3b82f6',
  'Travel & Per Diem': '#8b5cf6',
  'Equipment & Tech': '#10b981',
  'Community Workshops': '#f59e0b',
  'Medical & Water Supplies': '#ec4899',
  'Logistics & Vehicles': '#06b6d4',
  'Office Operations': '#64748b',
  'Other': '#94a3b8',
};

export const FinancialAnalyticsDashboard: React.FC<FinancialAnalyticsDashboardProps> = ({
  expenses,
  projects,
  donors,
  selectedDisplayCurrency,
  convertCurrency,
}) => {
  const [activeTab, setActiveTab] = useState<'burn_rates' | 'spending_trends' | 'categories'>('burn_rates');
  const [timeHorizon, setTimeHorizon] = useState<'ALL' | '12M' | '6M'>('ALL');
  const [trendGrouping, setTrendGrouping] = useState<'by_donor' | 'by_category'>('by_donor');

  const currencySymbol = useMemo(() => {
    switch (selectedDisplayCurrency) {
      case 'GHS':
        return 'GH₵';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      default:
        return '$';
    }
  }, [selectedDisplayCurrency]);

  // Filter expenses by time horizon
  const horizonExpenses = useMemo(() => {
    if (timeHorizon === 'ALL') return expenses;
    const now = new Date();
    const cutoff = new Date();
    if (timeHorizon === '6M') {
      cutoff.setMonth(now.getMonth() - 6);
    } else {
      cutoff.setMonth(now.getMonth() - 12);
    }
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return expenses.filter((e) => (e.dateIncurred || '').split('T')[0] >= cutoffStr);
  }, [expenses, timeHorizon]);

  // 1. Multi-Donor Budget Burn Rates Calculation
  const donorBurnData = useMemo(() => {
    // Map donor allocations across all projects
    const donorAllocationsMap: Record<string, number> = {};
    const donorSpentMap: Record<string, number> = {};
    const donorProjectsMap: Record<string, Set<string>> = {};

    // First collect total allocations from project donor grants
    projects.forEach((proj) => {
      if (proj.donors && proj.donors.length > 0) {
        proj.donors.forEach((d) => {
          const code = (d.donorCode || 'OTHER').toUpperCase();
          const allocInDisplay = convertCurrency(d.totalAllocation || 0, proj.currency || 'USD', selectedDisplayCurrency);
          donorAllocationsMap[code] = (donorAllocationsMap[code] || 0) + allocInDisplay;
          if (!donorProjectsMap[code]) donorProjectsMap[code] = new Set();
          donorProjectsMap[code].add(proj.title);
        });
      }
    });

    // If projects don't define allocations, fall back to donors database or synthesize baseline allocation
    donors.forEach((d) => {
      const code = d.code.toUpperCase();
      if (!donorAllocationsMap[code]) {
        const commInDisplay = convertCurrency(d.totalCommitted || 250000, d.currency || 'USD', selectedDisplayCurrency);
        donorAllocationsMap[code] = commInDisplay;
      }
    });

    // Ensure standard donors exist
    ['USAID', 'EU', 'GLOBAL_FUND', 'UNICEF', 'FCDO'].forEach((code) => {
      if (!donorAllocationsMap[code]) {
        donorAllocationsMap[code] = convertCurrency(450000, 'USD', selectedDisplayCurrency);
      }
    });

    // Sum actual spent from expenses (approved or pending vouchers)
    expenses.forEach((e) => {
      if (e.donorAllocations && e.donorAllocations.length > 0) {
        e.donorAllocations.forEach((alloc) => {
          const code = (alloc.donorCode || 'OTHER').toUpperCase();
          const spentInDisplay = convertCurrency(alloc.allocatedAmount || 0, e.currency || 'USD', selectedDisplayCurrency);
          donorSpentMap[code] = (donorSpentMap[code] || 0) + spentInDisplay;
        });
      }
    });

    return Object.keys(donorAllocationsMap)
      .filter((code) => donorAllocationsMap[code] > 0 || (donorSpentMap[code] || 0) > 0)
      .map((code) => {
        const allocated = Math.round(donorAllocationsMap[code] || 0);
        const spent = Math.round(donorSpentMap[code] || 0);
        const remaining = Math.max(0, allocated - spent);
        const burnRate = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
        const color = DONOR_PALETTE[code]?.main || DONOR_PALETTE.DEFAULT.main;
        
        let status: 'NORMAL' | 'ON_TRACK' | 'HIGH_BURN' | 'OVER_BURN' = 'NORMAL';
        if (burnRate >= 100) status = 'OVER_BURN';
        else if (burnRate >= 85) status = 'HIGH_BURN';
        else if (burnRate >= 65) status = 'ON_TRACK';

        return {
          donorCode: code,
          allocated,
          spent,
          remaining,
          burnRate,
          status,
          fillColor: color,
          projectCount: donorProjectsMap[code]?.size || 1,
        };
      })
      .sort((a, b) => b.allocated - a.allocated);
  }, [projects, donors, expenses, selectedDisplayCurrency, convertCurrency]);

  // 2. Project Spending Trends Over Time Calculation
  const monthlyTrendsData = useMemo(() => {
    // Collect all expenses sorted by date
    const sorted = [...horizonExpenses].sort((a, b) => 
      (a.dateIncurred || '').localeCompare(b.dateIncurred || '')
    );

    // Default months if no expenses
    const monthlyMap: Record<string, {
      monthKey: string;
      label: string;
      total: number;
      USAID: number;
      EU: number;
      GLOBAL_FUND: number;
      UNICEF: number;
      FCDO: number;
      OTHER: number;
      [categoryName: string]: any;
    }> = {};

    // Initialize baseline timeline months for 2025/2026
    const sampleMonths = [
      '2025-10', '2025-11', '2025-12',
      '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'
    ];
    sampleMonths.forEach((mk) => {
      const [y, m] = mk.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyMap[mk] = {
        monthKey: mk,
        label,
        total: 0,
        USAID: 0,
        EU: 0,
        GLOBAL_FUND: 0,
        UNICEF: 0,
        FCDO: 0,
        OTHER: 0,
      };
    });

    sorted.forEach((e) => {
      const dateStr = (e.dateIncurred || '').split('T')[0];
      const monthKey = dateStr.slice(0, 7) || '2026-03';
      
      if (!monthlyMap[monthKey]) {
        const parts = monthKey.split('-');
        const y = parseInt(parts[0]) || 2026;
        const m = parseInt(parts[1]) || 3;
        const d = new Date(y, m - 1, 1);
        monthlyMap[monthKey] = {
          monthKey,
          label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          total: 0,
          USAID: 0,
          EU: 0,
          GLOBAL_FUND: 0,
          UNICEF: 0,
          FCDO: 0,
          OTHER: 0,
        };
      }

      const totalInDisplay = convertCurrency(e.totalAmount || 0, e.currency || 'USD', selectedDisplayCurrency);
      monthlyMap[monthKey].total += totalInDisplay;

      // Category breakdown
      const cat = e.category || 'Office Operations';
      monthlyMap[monthKey][cat] = (monthlyMap[monthKey][cat] || 0) + totalInDisplay;

      // Donor allocations
      if (e.donorAllocations && e.donorAllocations.length > 0) {
        e.donorAllocations.forEach((d) => {
          const code = (d.donorCode || 'OTHER').toUpperCase();
          const amountInDisplay = convertCurrency(d.allocatedAmount || 0, e.currency || 'USD', selectedDisplayCurrency);
          if (monthlyMap[monthKey][code] !== undefined) {
            monthlyMap[monthKey][code] += amountInDisplay;
          } else {
            monthlyMap[monthKey].OTHER += amountInDisplay;
          }
        });
      } else {
        monthlyMap[monthKey].USAID += totalInDisplay * 0.6;
        monthlyMap[monthKey].EU += totalInDisplay * 0.4;
      }
    });

    // Return sorted array
    let cumulative = 0;
    return Object.keys(monthlyMap)
      .sort()
      .map((k) => {
        const item = monthlyMap[k];
        cumulative += item.total;
        return {
          ...item,
          total: Math.round(item.total),
          cumulative: Math.round(cumulative),
          USAID: Math.round(item.USAID),
          EU: Math.round(item.EU),
          GLOBAL_FUND: Math.round(item.GLOBAL_FUND),
          UNICEF: Math.round(item.UNICEF),
          FCDO: Math.round(item.FCDO),
          OTHER: Math.round(item.OTHER),
        };
      });
  }, [horizonExpenses, selectedDisplayCurrency, convertCurrency]);

  // 3. Category Distribution Calculation
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    horizonExpenses.forEach((e) => {
      const cat = e.category || 'Other Field Ops';
      const inDisplay = convertCurrency(e.totalAmount || 0, e.currency || 'USD', selectedDisplayCurrency);
      catMap[cat] = (catMap[cat] || 0) + inDisplay;
    });

    const total = Object.values(catMap).reduce((a, b) => a + b, 0) || 1;
    return Object.keys(catMap).map((cat) => ({
      name: cat,
      value: Math.round(catMap[cat]),
      percentage: Math.round((catMap[cat] / total) * 100),
      color: CATEGORY_COLORS[cat] || '#64748b',
    })).sort((a, b) => b.value - a.value);
  }, [horizonExpenses, selectedDisplayCurrency, convertCurrency]);

  // Executive KPI summary calculations
  const totalPortfolioBudget = donorBurnData.reduce((acc, curr) => acc + curr.allocated, 0);
  const totalPortfolioSpent = donorBurnData.reduce((acc, curr) => acc + curr.spent, 0);
  const portfolioBurnRate = totalPortfolioBudget > 0 ? Math.round((totalPortfolioSpent / totalPortfolioBudget) * 100) : 0;
  const remainingPortfolioBalance = Math.max(0, totalPortfolioBudget - totalPortfolioSpent);

  // Average monthly burn velocity (last 3 non-zero months)
  const activeMonths = monthlyTrendsData.filter((m) => m.total > 0);
  const last3Months = activeMonths.slice(-3);
  const avgMonthlyVelocity = last3Months.length > 0
    ? Math.round(last3Months.reduce((a, b) => a + b.total, 0) / last3Months.length)
    : Math.round(totalPortfolioSpent / (activeMonths.length || 1));
  const monthsOfRunway = avgMonthlyVelocity > 0 ? (remainingPortfolioBalance / avgMonthlyVelocity).toFixed(1) : '12+';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-6 animate-in fade-in duration-200">
      {/* Top Header with Overview KPIs & Visual Tabs */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Multi-Donor Grant Burn Rates &amp; Spending Analytics
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Real-time portfolio oversight: monitor donor budget exhaustion, track monthly expenditure velocity, and forecast grant runways.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time Horizon Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
              {(['ALL', '12M', '6M'] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setTimeHorizon(h)}
                  className={`px-2.5 py-1 rounded-lg transition text-[11px] cursor-pointer ${
                    timeHorizon === h ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {h === 'ALL' ? 'All Time' : h === '12M' ? '12 Months' : '6 Months'}
                </button>
              ))}
            </div>

            {/* Visual Mode Navigation Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('burn_rates')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer text-xs ${
                  activeTab === 'burn_rates'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Donor Burn Rates</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('spending_trends')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer text-xs ${
                  activeTab === 'spending_trends'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Spending Trends</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer text-xs ${
                  activeTab === 'categories'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PieIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Categories</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Executive KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span className="font-semibold">Portfolio Burn Rate</span>
              <Flame className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-black text-slate-900">{portfolioBurnRate}%</span>
              <span className="text-[10px] text-slate-400 font-mono">of all awards</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ${
                  portfolioBurnRate > 90 ? 'bg-rose-500' : portfolioBurnRate > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, portfolioBurnRate)}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span className="font-semibold">Monthly Burn Velocity</span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-black text-slate-900">
                {currencySymbol}{avgMonthlyVelocity.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">/mo avg</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">Based on 3-month rolling activity</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span className="font-semibold">Estimated Grant Runway</span>
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-emerald-700">{monthsOfRunway}</span>
              <span className="text-xs font-bold text-slate-600">Months</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              At current monthly burn speed
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span className="font-semibold">Unspent Grant Reserves</span>
              <Wallet className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-black text-slate-900">
                {currencySymbol}{remainingPortfolioBalance.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">
              {donorBurnData.length} institutional donors tracked
            </p>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="p-6">
        {activeTab === 'burn_rates' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
                  <span>Multi-Donor Grant Utilization &amp; Burn Benchmark</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Comparison of approved expenditure vs total grant commitment per institutional donor.
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 rounded-sm bg-slate-300 inline-block" />
                  <span>Grant Allocation</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" />
                  <span>Actual Spent</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-0.5 bg-rose-500 inline-block" />
                  <span>80% Target Line</span>
                </span>
              </div>
            </div>

            {/* Recharts Composed / Bar Chart for Burn Rates */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={donorBurnData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="donorCode"
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${currencySymbol}${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <span className="font-black text-emerald-400 text-sm">{label} Grant</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                data.burnRate > 90 ? 'bg-rose-500/30 text-rose-300' :
                                data.burnRate > 75 ? 'bg-amber-500/30 text-amber-300' : 'bg-emerald-500/30 text-emerald-300'
                              }`}>
                                {data.burnRate}% Burn Rate
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[11px]">
                              <span className="text-slate-400">Total Commitment:</span>
                              <span className="font-mono font-bold text-right">{currencySymbol}{data.allocated.toLocaleString()}</span>
                              <span className="text-slate-400">Actual Spent:</span>
                              <span className="font-mono font-bold text-right text-emerald-300">{currencySymbol}{data.spent.toLocaleString()}</span>
                              <span className="text-slate-400">Remaining Balance:</span>
                              <span className="font-mono font-bold text-right text-slate-200">{currencySymbol}{data.remaining.toLocaleString()}</span>
                              <span className="text-slate-400">Active Missions:</span>
                              <span className="font-bold text-right text-slate-300">{data.projectCount} Projects</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="allocated"
                    name="Grant Budget"
                    fill="#e2e8f0"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    dataKey="spent"
                    name="Actual Spent"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  >
                    {donorBurnData.map((entry) => (
                      <Cell key={entry.donorCode} fill={entry.fillColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Individual Donor Cards with Burn Rate Statuses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {donorBurnData.map((d) => (
                <div
                  key={d.donorCode}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: d.fillColor }}
                      />
                      <span className="font-black text-slate-900 text-xs tracking-tight">{d.donorCode}</span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      d.burnRate >= 95 ? 'bg-rose-100 text-rose-800' :
                      d.burnRate >= 80 ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {d.burnRate}% Burn
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(5, d.burnRate))}%`,
                        backgroundColor: d.fillColor,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Spent</span>
                      <strong className="text-slate-900 font-mono">{currencySymbol}{d.spent.toLocaleString()}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[9px] uppercase">Remaining</span>
                      <strong className="text-emerald-700 font-mono">{currencySymbol}{d.remaining.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'spending_trends' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Project Spending Trends Over Time</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Monthly expenditure trajectory and cumulative disbursement across active grant periods.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setTrendGrouping('by_donor')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    trendGrouping === 'by_donor' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  By Donor Allocation
                </button>
                <button
                  type="button"
                  onClick={() => setTrendGrouping('by_category')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    trendGrouping === 'by_category' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cumulative Trajectory
                </button>
              </div>
            </div>

            {/* Recharts Area Chart for Spending Trends */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {trendGrouping === 'by_donor' ? (
                  <AreaChart
                    data={monthlyTrendsData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="colorUSAID" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorEU" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorGlobalFund" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `${currencySymbol}${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
                          return (
                            <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5">
                              <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">
                                {label} Total: <span className="text-emerald-400 font-mono font-black">{currencySymbol}{total.toLocaleString()}</span>
                              </p>
                              {payload.map((entry) => (
                                <div key={entry.name} className="flex items-center justify-between space-x-3 text-[11px]">
                                  <span className="flex items-center space-x-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span>{entry.name}:</span>
                                  </span>
                                  <span className="font-mono font-bold text-slate-100">{currencySymbol}{Number(entry.value).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: '11px', fontWeight: 700 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="USAID"
                      name="USAID Split"
                      stackId="1"
                      stroke="#047857"
                      fill="url(#colorUSAID)"
                    />
                    <Area
                      type="monotone"
                      dataKey="EU"
                      name="EU Humanitarian"
                      stackId="1"
                      stroke="#1d4ed8"
                      fill="url(#colorEU)"
                    />
                    <Area
                      type="monotone"
                      dataKey="GLOBAL_FUND"
                      name="Global Fund"
                      stackId="1"
                      stroke="#b91c1c"
                      fill="url(#colorGlobalFund)"
                    />
                  </AreaChart>
                ) : (
                  <LineChart
                    data={monthlyTrendsData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `${currencySymbol}${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: number) => [`${currencySymbol}${val.toLocaleString()}`, 'Amount']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: '11px', fontWeight: 700 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Monthly Spending"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#10b981' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      name="Cumulative Spend"
                      stroke="#6366f1"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: '#6366f1' }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
                <PieIcon className="w-4 h-4 text-blue-600" />
                <span>Expenditure Distribution by Category</span>
              </h3>
              <p className="text-xs text-slate-500">
                Functional distribution across logistical, operational, and field programmatic cost centers.
              </p>

              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Total Spent']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '14px', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Percent Breakdown List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
                <span>Budget Category</span>
                <span>Amount &amp; Share</span>
              </div>
              {categoryData.map((cat) => (
                <div key={cat.name} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {currencySymbol}{cat.value.toLocaleString()} <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
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

export default FinancialAnalyticsDashboard;
