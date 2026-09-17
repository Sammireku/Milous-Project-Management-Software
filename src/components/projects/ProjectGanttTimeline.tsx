import React, { useMemo } from 'react';
import { 
  FolderKanban, 
  Calendar, 
  DollarSign, 
  User, 
  Building2, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Project, ProjectStatus } from '../../types';

interface ProjectGanttTimelineProps {
  projects: Project[];
  onSelectProject?: (project: Project) => void;
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNING: 'bg-blue-500 border-blue-600',
  ACTIVE: 'bg-emerald-500 border-emerald-600',
  UNDER_REVIEW: 'bg-amber-500 border-amber-600',
  COMPLETED: 'bg-purple-500 border-purple-600',
  CLOSED: 'bg-slate-400 border-slate-500',
};

export const ProjectGanttTimeline: React.FC<ProjectGanttTimelineProps> = ({
  projects,
  onSelectProject,
}) => {
  // Calculate timeline date range for projects
  const { minTime, maxTime, totalDays, dates } = useMemo(() => {
    if (projects.length === 0) {
      const now = Date.now();
      return { minTime: now, maxTime: now + 86400000 * 365, totalDays: 365, dates: [] };
    }

    let min = Infinity;
    let max = -Infinity;

    projects.forEach((p) => {
      const start = new Date(p.startDate).getTime();
      const end = new Date(p.endDate).getTime();
      if (start < min) min = start;
      if (end > max) max = end;
    });

    const startDate = new Date(min - 15 * 86400000);
    const endDate = new Date(max + 30 * 86400000);
    const days = Math.max(1, (endDate.getTime() - startDate.getTime()) / 86400000);

    const monthList: Date[] = [];
    let curr = new Date(startDate);
    while (curr <= endDate) {
      monthList.push(new Date(curr));
      curr.setMonth(curr.getMonth() + 1);
    }

    return { minTime: startDate.getTime(), maxTime: endDate.getTime(), totalDays: days, dates: monthList };
  }, [projects]);

  const getBarStyle = (startIso: string, endIso: string) => {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();

    const startOffsetDays = Math.max(0, (start - minTime) / 86400000);
    const durationDays = Math.max(15, (end - start) / 86400000);

    const leftPercent = (startOffsetDays / totalDays) * 100;
    const widthPercent = (durationDays / totalDays) * 100;

    return {
      left: `${Math.min(95, Math.max(0, leftPercent))}%`,
      width: `${Math.min(100 - leftPercent, Math.max(5, widthPercent))}%`,
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4 p-4 sm:p-5 overflow-hidden">
      {/* Timeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <FolderKanban className="w-5 h-5 text-emerald-600" />
            <span>Project Grant Lifecycle Timeline Gantt</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize project durations, grant milestones, and operational lifecycles across active portfolio initiatives.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Active</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600">Under Review</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-slate-600">Completed</span>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <div className="min-w-[850px]">
          {/* Calendar Months Header */}
          <div className="grid grid-cols-12 bg-slate-100/80 border-b border-slate-200 py-2.5 px-3 text-[10px] font-mono font-bold text-slate-500 uppercase">
            <div className="col-span-4 border-r border-slate-200 pr-2">Grant Initiative</div>
            <div className="col-span-8 flex justify-between px-2">
              {dates.map((d, i) => (
                <span key={i}>
                  {d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                </span>
              ))}
            </div>
          </div>

          {/* Project Bars */}
          <div className="divide-y divide-slate-100">
            {projects.map((proj) => {
              const barStyle = getBarStyle(proj.startDate, proj.endDate);

              return (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject && onSelectProject(proj)}
                  className="grid grid-cols-12 items-center hover:bg-slate-50/80 transition cursor-pointer py-3 px-3 text-xs"
                >
                  {/* Left Metadata Column */}
                  <div className="col-span-4 border-r border-slate-100 pr-3 space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 truncate">
                        [{proj.code}] {proj.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-medium">
                      <span className="text-emerald-700 font-bold">${proj.totalBudget.toLocaleString()}</span>
                      <span>•</span>
                      <span>{proj.location}</span>
                    </div>
                  </div>

                  {/* Right Timeline Bar Track */}
                  <div className="col-span-8 relative h-8 bg-slate-50/50 my-1 rounded-xl border border-slate-100 px-2 flex items-center">
                    <div
                      style={barStyle}
                      className={`absolute h-6 rounded-lg border shadow-xs text-white text-[10px] font-bold px-2.5 flex items-center justify-between truncate transition-all ${
                        STATUS_COLORS[proj.status]
                      }`}
                      title={`[${proj.status}] ${proj.title} (${new Date(proj.startDate).toLocaleDateString()} - ${new Date(proj.endDate).toLocaleDateString()})`}
                    >
                      <span className="truncate">{proj.title}</span>
                      <span className="text-[9px] font-mono font-normal opacity-90 hidden sm:inline ml-2">
                        {new Date(proj.endDate).getFullYear()}
                      </span>
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

export default ProjectGanttTimeline;
