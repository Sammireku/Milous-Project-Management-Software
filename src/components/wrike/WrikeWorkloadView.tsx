import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar,
  Briefcase,
  AlertTriangle,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  ReferenceLine 
} from 'recharts';
import { Task } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useFirestore } from '../../context/FirestoreContext';

interface WrikeWorkloadViewProps {
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
}

export const WrikeWorkloadView: React.FC<WrikeWorkloadViewProps> = ({ tasks, onSelectTask }) => {
  const { allUsers } = useAuth();
  const { allTasks } = useFirestore();

  const [capacityMaxHours] = useState<number>(40); // 40 hours/week threshold

  // Calculate aggregated hours & tasks per team member across all projects
  const teamCapacityData = useMemo(() => {
    return allUsers.map((user) => {
      // Find all active tasks assigned to this user across all projects
      const assignedTasks = (allTasks.length > 0 ? allTasks : tasks).filter(
        (t) => (t.assigneeId === user.id || t.assigneeName === user.displayName) && t.status !== 'COMPLETED'
      );

      // Estimate 8 hours per task if not specified
      const totalEstimatedHours = assignedTasks.reduce((acc, t) => {
        const customHours = typeof t.customFields?.estimatedHours === 'number' ? t.customFields.estimatedHours : 8;
        return acc + customHours;
      }, 0);

      const isOverbooked = totalEstimatedHours > capacityMaxHours;

      return {
        id: user.id,
        name: user.displayName,
        role: user.role,
        activeTasksCount: assignedTasks.length,
        totalEstimatedHours,
        isOverbooked,
        assignedTasks,
      };
    });
  }, [allUsers, allTasks, tasks, capacityMaxHours]);

  // Chart dataset for Recharts
  const chartData = useMemo(() => {
    return teamCapacityData.map((d) => ({
      name: d.name.split(' ')[0],
      fullName: d.name,
      hours: d.totalEstimatedHours,
      tasks: d.activeTasksCount,
      isOverbooked: d.isOverbooked,
    }));
  }, [teamCapacityData]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Team Capacity &amp; Bandwidth Dashboard</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregates task time estimates across all projects to prevent burnout and highlight overbooked personnel.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-700">
            <span>Capacity Target:</span>
            <span className="text-emerald-700 font-mono">{capacityMaxHours} hrs/week</span>
          </div>
        </div>
      </div>

      {/* Visual Recharts Bar Chart Module */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-white space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Aggregated Task Hours vs 40h Weekly Bandwidth</span>
          </h4>
          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            Overbooked Personnel Highlighted in Red
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                formatter={(value: any, name: any, props: any) => [`${value} hrs (${props.payload.tasks} tasks)`, 'Workload']}
              />
              <ReferenceLine y={capacityMaxHours} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '40h Capacity Limit', fill: '#ef4444', fontSize: 10, position: 'top' }} />
              <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isOverbooked ? '#f43f5e' : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamCapacityData.map(({ id, name, role, activeTasksCount, totalEstimatedHours, isOverbooked, assignedTasks }) => {
          return (
            <div
              key={id}
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                isOverbooked
                  ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/10'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                    isOverbooked ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
                  }`}>
                    {name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{name}</h4>
                    <span className="text-[10px] font-mono uppercase bg-white px-1.5 py-0.2 rounded border text-slate-600 font-bold">
                      {role}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                    isOverbooked
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isOverbooked ? 'Overbooked' : 'Optimal'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-600">Allocated Workload:</span>
                  <span className={isOverbooked ? 'text-rose-700 font-mono font-extrabold' : 'text-slate-900 font-mono'}>
                    {totalEstimatedHours} hrs ({activeTasksCount} tasks)
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${isOverbooked ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, Math.round((totalEstimatedHours / capacityMaxHours) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Task list preview */}
              <div className="pt-2 border-t border-slate-200/60 space-y-1 text-[11px]">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Assigned Mission Tasks ({assignedTasks.length})
                </p>
                {assignedTasks.slice(0, 2).map((t) => (
                  <div key={t.id} className="p-1.5 rounded bg-white border border-slate-200 truncate text-slate-800 font-medium">
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WrikeWorkloadView;
