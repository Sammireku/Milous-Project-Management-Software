import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ZoomIn, 
  ZoomOut, 
  Flag, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { useFirestore } from '../../context/FirestoreContext';

interface WrikeGanttChartProps {
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
}

const BAR_COLORS: Record<TaskStatus, string> = {
  BACKLOG: 'bg-slate-400 border-slate-500',
  TODO: 'bg-blue-500 border-blue-600',
  IN_PROGRESS: 'bg-amber-500 border-amber-600',
  VERIFICATION: 'bg-purple-500 border-purple-600',
  COMPLETED: 'bg-emerald-500 border-emerald-600',
};

export const WrikeGanttChart: React.FC<WrikeGanttChartProps> = ({ tasks, onSelectTask }) => {
  const { indicators } = useFirestore();
  const [zoomLevel, setZoomLevel] = useState<'days' | 'weeks' | 'months'>('weeks');

  // Compute overall date range spanning all tasks
  const timelineDates = useMemo(() => {
    if (tasks.length === 0) return [];
    let minTime = Infinity;
    let maxTime = -Infinity;

    tasks.forEach((t) => {
      const start = new Date(t.plannedStartDate).getTime();
      const end = new Date(t.plannedEndDate).getTime();
      if (start < minTime) minTime = start;
      if (end > maxTime) maxTime = end;
    });

    // Default pad by 5 days before and after
    const startDate = new Date(minTime - 5 * 86400000);
    const endDate = new Date(maxTime + 10 * 86400000);

    const dates: Date[] = [];
    let curr = new Date(startDate);
    while (curr <= endDate) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + (zoomLevel === 'days' ? 1 : zoomLevel === 'weeks' ? 7 : 30));
    }
    return dates;
  }, [tasks, zoomLevel]);

  const minDate = timelineDates[0] || new Date();
  const maxDate = timelineDates[timelineDates.length - 1] || new Date();
  const totalDurationDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / 86400000);

  const getTaskBarStyle = (task: Task) => {
    const start = new Date(task.plannedStartDate).getTime();
    const end = new Date(task.plannedEndDate).getTime();

    const startOffsetDays = Math.max(0, (start - minDate.getTime()) / 86400000);
    const durationDays = Math.max(1, (end - start) / 86400000);

    const leftPercent = (startOffsetDays / totalDurationDays) * 100;
    const widthPercent = (durationDays / totalDurationDays) * 100;

    return {
      left: `${Math.min(95, Math.max(0, leftPercent))}%`,
      width: `${Math.min(100 - leftPercent, Math.max(2, widthPercent))}%`,
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4 p-4 sm:p-5 overflow-hidden">
      {/* Header & Zoom Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Wrike Interactive Gantt Chart Timeline
          </h3>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="font-bold text-slate-500">Timeline Scale:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
            {(['days', 'weeks', 'months'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setZoomLevel(level)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                  zoomLevel === level
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt Matrix Container */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <div className="min-w-[800px]">
          {/* Timeline Date Column Headers */}
          <div className="grid grid-cols-12 bg-slate-100/90 border-b border-slate-200 py-2.5 px-3 text-[10px] font-mono font-bold text-slate-500 uppercase">
            <div className="col-span-4 border-r border-slate-200 pr-2">Task Activity</div>
            <div className="col-span-8 flex justify-between px-2">
              {timelineDates.slice(0, 8).map((d, i) => (
                <span key={i}>
                  {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const ind = indicators.find((i) => i.id === task.linkedIndicatorId);
              const barStyle = getTaskBarStyle(task);

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask && onSelectTask(task)}
                  className="grid grid-cols-12 items-center hover:bg-slate-50/80 transition cursor-pointer py-2.5 px-3 text-xs"
                >
                  {/* Left Task Title Column */}
                  <div className="col-span-4 border-r border-slate-100 pr-3 space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 truncate">{task.title}</span>
                      {ind && (
                        <span className="shrink-0 text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">
                          {ind.code}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {new Date(task.plannedStartDate).toLocaleDateString()} -{' '}
                      {new Date(task.plannedEndDate).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Right Timeline Bar Track */}
                  <div className="col-span-8 relative h-7 bg-slate-50/50 my-1 rounded-lg border border-slate-100/80 px-2 flex items-center">
                    <div
                      style={barStyle}
                      className={`absolute h-5 rounded-md border shadow-xs text-white text-[10px] font-bold px-2 flex items-center truncate transition-all ${
                        BAR_COLORS[task.status]
                      }`}
                      title={`[${task.status}] ${task.title}`}
                    >
                      <span className="truncate">{task.title}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WrikeGanttChart;
