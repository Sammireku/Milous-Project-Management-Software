import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  CheckCircle2, 
  Zap, 
  Flag,
  Move,
  Sparkles,
  Layers,
  Filter
} from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { useFirestore } from '../../context/FirestoreContext';

interface WrikeCalendarViewProps {
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
}

const STATUS_CHIP_COLORS: Record<TaskStatus, string> = {
  BACKLOG: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
  TODO: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
  IN_PROGRESS: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
  VERIFICATION: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100',
  COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
};

export const WrikeCalendarView: React.FC<WrikeCalendarViewProps> = ({ tasks, onSelectTask }) => {
  const { updateTask } = useFirestore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [rescheduleMessage, setRescheduleMessage] = useState<string | null>(null);
  const [filterMilestonesOnly, setFilterMilestonesOnly] = useState<boolean>(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Generate days for calendar month grid
  const daysInMonth = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: ({ dayNumber: number; dateString: string; isCurrentMonth: boolean } | null)[] = [];

    // Padding empty cells before 1st of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      const monthStr = (month + 1).toString().padStart(2, '0');
      const dayStr = d.toString().padStart(2, '0');
      days.push({
        dayNumber: d,
        dateString: `${year}-${monthStr}-${dayStr}`,
        isCurrentMonth: true,
      });
    }

    return days;
  }, [year, month]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, dateString: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateString) {
      setDragOverDate(dateString);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverDate(null);
    setDraggedTaskId(null);

    if (!taskId) return;

    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove) return;

    // Calculate duration offset to preserve task length
    const startObj = new Date(taskToMove.plannedStartDate);
    const endObj = new Date(taskToMove.plannedEndDate);
    const durationMs = Math.max(86400000, endObj.getTime() - startObj.getTime());

    const newStart = new Date(`${targetDateStr}T09:00:00.000Z`);
    const newEnd = new Date(newStart.getTime() + durationMs);

    await updateTask(taskId, {
      plannedStartDate: newStart.toISOString(),
      plannedEndDate: newEnd.toISOString(),
    });

    setRescheduleMessage(`Rescheduled "${taskToMove.title}" to ${targetDateStr}`);
    setTimeout(() => setRescheduleMessage(null), 3500);
  };

  const filteredTasks = useMemo(() => {
    if (!filterMilestonesOnly) return tasks;
    return tasks.filter((t) => t.priority === 'URGENT' || t.customItemType === 'Audit' || t.status === 'VERIFICATION');
  }, [tasks, filterMilestonesOnly]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
      {/* Reschedule Notification Banner */}
      {rescheduleMessage && (
        <div className="p-3 bg-emerald-950 text-emerald-400 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 border border-emerald-800 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{rescheduleMessage}</span>
        </div>
      )}

      {/* Calendar Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <span>Project Chronological Calendar</span>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                Drag-and-Drop Rescheduling
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Drag task cards onto dates to update start/end schedules instantly.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilterMilestonesOnly(!filterMilestonesOnly)}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
              filterMilestonesOnly
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{filterMilestonesOnly ? 'Showing Milestones' : 'All Items'}</span>
          </button>

          <button
            type="button"
            onClick={goToday}
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold transition hover:bg-slate-800"
          >
            Today
          </button>

          <div className="flex items-center space-x-1 border border-slate-200 rounded-xl bg-slate-50 p-1">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-white rounded-lg text-slate-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-900 min-w-[120px] text-center text-xs">
              {monthName}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-white rounded-lg text-slate-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Grid Headers */}
      <div className="grid grid-cols-7 text-center text-[11px] font-extrabold uppercase text-slate-400 border-b border-slate-200 pb-2">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 min-h-[520px]">
        {daysInMonth.map((dayObj, index) => {
          if (!dayObj) {
            return <div key={`empty-${index}`} className="bg-slate-50/40 rounded-xl min-h-[95px]" />;
          }

          // Match tasks that fall on this day
          const dayTasks = filteredTasks.filter((t) => {
            const start = t.plannedStartDate?.split('T')[0];
            const end = t.plannedEndDate?.split('T')[0];
            return dayObj.dateString >= start && dayObj.dateString <= end;
          });

          const isToday = new Date().toISOString().split('T')[0] === dayObj.dateString;
          const isTargetDrag = dragOverDate === dayObj.dateString;

          return (
            <div
              key={dayObj.dateString}
              onDragOver={(e) => handleDragOver(e, dayObj.dateString)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, dayObj.dateString)}
              className={`p-2 rounded-xl border flex flex-col justify-between transition min-h-[95px] relative ${
                isTargetDrag
                  ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-500 scale-[1.02] shadow-md'
                  : isToday
                  ? 'bg-emerald-50/40 border-emerald-400 ring-2 ring-emerald-500/10'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-black ${
                    isToday ? 'text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full' : 'text-slate-700'
                  }`}
                >
                  {dayObj.dayNumber}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[9px] font-mono font-bold text-slate-400">
                    {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Day Tasks List with Draggable Chips */}
              <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[80px] pr-0.5">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onSelectTask && onSelectTask(task)}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold cursor-grab active:cursor-grabbing truncate transition flex items-center justify-between shadow-2xs ${
                      STATUS_CHIP_COLORS[task.status]
                    }`}
                    title={`[Drag to reschedule] ${task.title}`}
                  >
                    <span className="truncate mr-1">{task.title}</span>
                    <Move className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[9px] font-bold text-slate-500 block text-center">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WrikeCalendarView;
