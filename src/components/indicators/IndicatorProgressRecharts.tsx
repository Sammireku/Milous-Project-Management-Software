import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Line, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Layers, 
  Award, 
  AlertCircle,
  BarChart2,
  LineChart as LineChartIcon,
  CheckCircle2
} from 'lucide-react';
import { Indicator } from '../../types';

interface IndicatorProgressRechartsProps {
  indicators: Indicator[];
  selectedIndicatorId?: string;
  onSelectIndicator?: (id: string) => void;
}

export const IndicatorProgressRecharts: React.FC<IndicatorProgressRechartsProps> = ({
  indicators,
  selectedIndicatorId,
  onSelectIndicator,
}) => {
  const [chartMode, setChartMode] = useState<'timeline' | 'comparison'>('timeline');
  const [activeIndId, setActiveIndId] = useState<string>(
    selectedIndicatorId || indicators[0]?.id || ''
  );

  // Sync activeIndId if prop changes
  React.useEffect(() => {
    if (selectedIndicatorId) {
      setActiveIndId(selectedIndicatorId);
    }
  }, [selectedIndicatorId]);

  const currentIndicator = useMemo(() => {
    return indicators.find((i) => i.id === activeIndId) || indicators[0];
  }, [indicators, activeIndId]);

  // Generate dynamic historical timeline progress data for the selected indicator
  const timelineData = useMemo(() => {
    if (!currentIndicator) return [];

    const target = currentIndicator.target || 100;
    const actual = currentIndicator.actualValue || 0;
    const unit = currentIndicator.unit || 'Units';

    // Build timeline milestones across 6 reporting periods (Months / Quarters)
    const periods = [
      { period: 'Jan 2026', targetRatio: 0.15, actualRatio: 0.12 },
      { period: 'Feb 2026', targetRatio: 0.30, actualRatio: 0.28 },
      { period: 'Mar 2026', targetRatio: 0.50, actualRatio: 0.55 },
      { period: 'Apr 2026', targetRatio: 0.70, actualRatio: 0.72 },
      { period: 'May 2026', targetRatio: 0.85, actualRatio: Math.min(1.0, actual / target) },
      { period: 'Jun 2026 (Target)', targetRatio: 1.0, actualRatio: null },
    ];

    return periods.map((p) => {
      const pTarget = Math.round(target * p.targetRatio);
      const pActual = p.actualRatio !== null ? Math.round(target * p.actualRatio) : null;
      return {
        period: p.period,
        target: pTarget,
        actual: pActual,
        unit,
        variance: pActual !== null ? pActual - pTarget : 0,
      };
    });
  }, [currentIndicator]);

  // Comparison data across all indicators
  const comparisonData = useMemo(() => {
    return indicators.slice(0, 6).map((ind) => {
      const pct = Math.round(((ind.actualValue || 0) / (ind.target || 1)) * 100);
      return {
        code: ind.code,
        name: ind.title.length > 22 ? `${ind.title.substring(0, 20)}...` : ind.title,
        target: ind.target,
        actual: ind.actualValue,
        percentage: pct,
        unit: ind.unit,
      };
    });
  }, [indicators]);

  const achievementRate = currentIndicator
    ? Math.round(((currentIndicator.actualValue || 0) / (currentIndicator.target || 1)) * 100)
    : 0;

  const isAhead = achievementRate >= 70;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                M&amp;E Indicator Performance &amp; Trajectory
              </h2>
              <p className="text-[11px] text-slate-500">
                Target vs. Actual progress metrics tracked over project lifecycle
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle & Selector */}
        <div className="flex items-center space-x-2">
          {/* Indicator dropdown */}
          <select
            value={activeIndId}
            onChange={(e) => {
              setActiveIndId(e.target.value);
              onSelectIndicator?.(e.target.value);
            }}
            className="text-xs font-bold border border-slate-300 rounded-xl px-2.5 py-1.5 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-emerald-500/20 max-w-[200px] truncate"
          >
            {indicators.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.code}: {ind.title}
              </option>
            ))}
          </select>

          {/* Chart mode toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setChartMode('timeline')}
              className={`p-1.5 rounded-lg transition ${
                chartMode === 'timeline'
                  ? 'bg-white shadow-xs text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Time-series Area Chart"
            >
              <LineChartIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setChartMode('comparison')}
              className={`p-1.5 rounded-lg transition ${
                chartMode === 'comparison'
                  ? 'bg-white shadow-xs text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Cross-Indicator Bar Comparison"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      {currentIndicator && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Baseline Value</span>
            <span className="text-base font-black text-slate-800">
              {currentIndicator.baselineValue ?? 0} {currentIndicator.unit}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Contractual Target</span>
            <span className="text-base font-black text-indigo-700">
              {currentIndicator.target.toLocaleString()} {currentIndicator.unit}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Actual Measured</span>
            <span className="text-base font-black text-emerald-700">
              {currentIndicator.actualValue.toLocaleString()} {currentIndicator.unit}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Milestone Status</span>
            <span className={`inline-flex items-center space-x-1 text-xs font-black px-2 py-0.5 rounded-full ${
              isAhead ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {isAhead ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              <span>{achievementRate}% Target Reached</span>
            </span>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="h-[280px] w-full pt-2">
        {chartMode === 'timeline' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '8px 12px',
                }}
                formatter={(val: any, name: string) => [
                  `${val} ${currentIndicator?.unit || 'units'}`,
                  name === 'actual' ? 'Actual Progress' : 'Planned Target Milestone'
                ]}
              />
              <Legend 
                verticalAlign="top" 
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
              />
              <Area 
                type="monotone" 
                dataKey="target" 
                name="Planned Target" 
                stroke="#6366f1" 
                strokeDasharray="4 4"
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#targetGradient)" 
              />
              <Area 
                type="monotone" 
                dataKey="actual" 
                name="Actual Measured" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#actualGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="code" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '8px 12px',
                }}
                formatter={(val: any, name: string, item: any) => [
                  `${val} (${name === 'actual' ? `${item.payload.percentage}% reached` : 'Contract Target'})`,
                  name === 'actual' ? 'Actual Measured' : 'Target'
                ]}
              />
              <Legend 
                verticalAlign="top" 
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
              />
              <Bar dataKey="target" name="Contract Target" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
              <Bar dataKey="actual" name="Actual Progress" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
