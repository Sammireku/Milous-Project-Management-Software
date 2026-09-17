import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  User, 
  Zap, 
  MapPin, 
  FileCheck2, 
  Camera, 
  Calendar, 
  GripVertical,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Link2
} from 'lucide-react';
import { Task, Indicator, TaskStatus, TaskPriority } from '../../types';

interface DraggableTaskCardProps {
  task: Task;
  linkedIndicator?: Indicator;
  allTasks?: Task[];
  onSelectTask: (task: Task) => void;
  onQuickMove: (taskId: string, newStatus: TaskStatus) => void;
  isOverlay?: boolean;
  canEdit?: boolean;
}

export const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({
  task,
  linkedIndicator,
  allTasks = [],
  onSelectTask,
  onQuickMove,
  isOverlay = false,
  canEdit = true,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task, currentStatus: task.status },
    disabled: !canEdit || isOverlay,
  });

  const style = transform && !isOverlay
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const isCompleted = task.status === 'COMPLETED';

  // Calculate dependency blockers
  const blockerIds = task.blockedBy || task.dependencies || [];
  const unresolvedBlockers = allTasks.filter(
    (t) => blockerIds.includes(t.id) && t.status !== 'COMPLETED'
  );
  const isBlocked = unresolvedBlockers.length > 0 && !isCompleted;

  // Visual task prioritization indicators (borders + badge styles)
  const getPriorityStyle = (priority?: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return {
          cardBorder: 'border-l-[5px] border-l-rose-600 bg-rose-50/10',
          badge: 'bg-rose-100 text-rose-800 border-rose-300 font-black ring-1 ring-rose-300/60',
          icon: <Flame className="w-3 h-3 text-rose-600 animate-pulse inline mr-1" />,
          label: 'URGENT',
        };
      case 'HIGH':
        return {
          cardBorder: 'border-l-[5px] border-l-amber-500 bg-amber-50/10',
          badge: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          icon: <AlertTriangle className="w-3 h-3 text-amber-600 inline mr-1" />,
          label: 'HIGH',
        };
      case 'MEDIUM':
        return {
          cardBorder: 'border-l-[5px] border-l-blue-500 bg-blue-50/5',
          badge: 'bg-blue-100 text-blue-800 border-blue-200 font-semibold',
          icon: null,
          label: 'MEDIUM',
        };
      case 'LOW':
      default:
        return {
          cardBorder: 'border-l-[5px] border-l-slate-300',
          badge: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
          icon: null,
          label: 'LOW',
        };
    }
  };

  const priorityStyle = getPriorityStyle(task.priority);

  const getDueDateLabel = () => {
    if (!task.plannedEndDate) return null;
    const end = new Date(task.plannedEndDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (isCompleted) {
      return { text: 'Completed', color: 'text-emerald-600' };
    }
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-rose-600 font-bold' };
    }
    if (diffDays === 0) {
      return { text: 'Due today', color: 'text-amber-600 font-bold' };
    }
    return { text: `${diffDays}d left`, color: 'text-slate-500' };
  };

  const dueInfo = getDueDateLabel();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white rounded-xl p-3.5 border transition-all duration-150 select-none group ${priorityStyle.cardBorder} ${
        isOverlay
          ? 'shadow-2xl ring-2 ring-emerald-500 rotate-1 border-emerald-400 cursor-grabbing z-50'
          : isDragging
          ? 'opacity-40 border-dashed border-emerald-400 shadow-inner'
          : isCompleted
          ? 'border-emerald-200 hover:border-emerald-400 shadow-xs hover:shadow-md'
          : isBlocked
          ? 'border-rose-300 ring-1 ring-rose-200/80 shadow-xs hover:shadow-md'
          : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Top Bar: Grip & Priority Pill & Blocker Warning */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5">
          {canEdit && (
            <div
              {...listeners}
              {...attributes}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition"
              title="Drag to move task"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}
          <span
            className={`text-[9px] uppercase px-2 py-0.5 rounded-full border flex items-center ${priorityStyle.badge}`}
          >
            {priorityStyle.icon}
            {priorityStyle.label}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {/* Blocked Dependency Alert Badge */}
          {isBlocked && (
            <div
              className="flex items-center space-x-1 text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300"
              title={`Waiting on ${unresolvedBlockers.length} dependency task(s): ${unresolvedBlockers.map((b) => b.title).join(', ')}`}
            >
              <AlertOctagon className="w-3 h-3 text-rose-600 shrink-0" />
              <span>Blocked ({unresolvedBlockers.length})</span>
            </div>
          )}

          {/* Linked M&E Indicator Sync Pill */}
          {linkedIndicator && (
            <div
              className={`flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
              title={`Linked to M&E Indicator [${linkedIndicator.code}]: ${linkedIndicator.title}`}
            >
              <Zap className={`w-3 h-3 ${isCompleted ? 'text-emerald-700' : 'text-emerald-600'}`} />
              <span>+{task.indicatorIncrementValue ?? 1} {linkedIndicator.code}</span>
            </div>
          )}
        </div>
      </div>

      {/* Blocked Detail Banner if unresolved */}
      {isBlocked && (
        <div className="mb-2 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-900 flex items-start space-x-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-tight truncate">
            <span className="font-bold">Waiting on: </span>
            <span className="italic">{unresolvedBlockers[0]?.title}</span>
            {unresolvedBlockers.length > 1 && (
              <span className="font-medium text-rose-700"> (+{unresolvedBlockers.length - 1} more)</span>
            )}
          </div>
        </div>
      )}

      {/* Title & Clickable Area */}
      <div 
        onClick={() => onSelectTask(task)} 
        className="cursor-pointer space-y-1"
      >
        <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition">
          {task.title}
        </h4>
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      </div>

      {/* Field Operations Evidence Tags (GPS, Signoff, Photos) */}
      {task.fieldData && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px]">
          {task.fieldData.gpsCoordinates && (
            <span
              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium"
              title={`Field GPS: ${task.fieldData.gpsCoordinates.lat.toFixed(4)}, ${task.fieldData.gpsCoordinates.lng.toFixed(4)}`}
            >
              <MapPin className="w-2.5 h-2.5 text-blue-600" />
              <span>GPS Verified</span>
            </span>
          )}

          {task.fieldData.digitalSignatureUri && (
            <span
              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium"
              title="Chief / Stakeholder digital signoff attached"
            >
              <FileCheck2 className="w-2.5 h-2.5 text-purple-600" />
              <span>Signed</span>
            </span>
          )}

          {task.fieldData.photoUris && task.fieldData.photoUris.length > 0 && (
            <span
              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium"
              title={`${task.fieldData.photoUris.length} field photos attached`}
            >
              <Camera className="w-2.5 h-2.5 text-amber-600" />
              <span>{task.fieldData.photoUris.length} proof</span>
            </span>
          )}
        </div>
      )}

      {/* Footer: Assignee, Due Date & Quick Move */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center space-x-1.5 min-w-0">
          <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[8px] text-slate-700">
            {task.assigneeName ? task.assigneeName.charAt(0) : 'U'}
          </div>
          <span className="font-medium text-slate-700 truncate max-w-[80px]">
            {task.assigneeName || 'Unassigned'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {dueInfo && (
            <span className={`flex items-center space-x-1 ${dueInfo.color}`}>
              <Clock className="w-2.5 h-2.5" />
              <span>{dueInfo.text}</span>
            </span>
          )}

          {/* Quick status mover dropdown */}
          <select
            value={task.status}
            onChange={(e) => onQuickMove(task.id, e.target.value as TaskStatus)}
            onClick={(e) => e.stopPropagation()}
            className="text-[9px] font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 cursor-pointer focus:outline-none"
            title="Move to another status column"
          >
            <option value="BACKLOG">Backlog</option>
            <option value="TODO">To-Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="VERIFICATION">Verification</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
};

