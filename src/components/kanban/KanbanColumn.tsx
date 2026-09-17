import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Zap, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Task, Indicator, TaskStatus } from '../../types';
import { DraggableTaskCard } from './DraggableTaskCard';

interface KanbanColumnProps {
  id: string;
  statusId?: TaskStatus;
  label: string;
  description: string;
  dotColor: string;
  tasks: Task[];
  allTasks?: Task[];
  indicators: Indicator[];
  onSelectTask: (task: Task) => void;
  onQuickMove: (taskId: string, newStatus: TaskStatus) => void;
  onOpenNewTaskModal: (status: TaskStatus) => void;
  canEdit?: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  statusId,
  label,
  description,
  dotColor,
  tasks,
  allTasks = [],
  indicators,
  onSelectTask,
  onQuickMove,
  onOpenNewTaskModal,
  canEdit = true,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { columnId: id, statusId: statusId || id },
  });

  const actualStatus = statusId || (id as TaskStatus);
  const isCompletedColumn = actualStatus === 'COMPLETED';

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border transition-all duration-200 min-w-[270px] w-full max-w-[310px] sm:max-w-none ${
        isOver
          ? isCompletedColumn
            ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg scale-[1.01]'
            : 'bg-slate-100/90 border-blue-400 ring-2 ring-blue-400/30 shadow-lg scale-[1.01]'
          : isCompletedColumn
          ? 'bg-emerald-50/40 border-emerald-200/80'
          : 'bg-slate-100/70 border-slate-200'
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 border-b border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></span>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">{label}</h3>
          </div>
          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-xs border border-slate-200">
            {tasks.length}
          </span>
        </div>

        {/* Sub-description or auto-sync badge */}
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-[10px] text-slate-500 truncate">{description}</p>
          {isCompletedColumn && (
            <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded-full flex items-center space-x-0.5">
              <Zap className="w-2.5 h-2.5 text-emerald-600" />
              <span>Auto-Sync</span>
            </span>
          )}
        </div>
      </div>

      {/* Task Cards Container */}
      <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[160px] scrollbar-thin">
        {tasks.map((task) => {
          const linkedInd = indicators.find((ind) => ind.id === task.linkedIndicatorId);
          return (
            <DraggableTaskCard
              key={task.id}
              task={task}
              linkedIndicator={linkedInd}
              allTasks={allTasks}
              onSelectTask={onSelectTask}
              onQuickMove={onQuickMove}
              canEdit={canEdit}
            />
          );
        })}

        {tasks.length === 0 && (
          <div
            className={`h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-3 text-center transition ${
              isOver
                ? 'border-emerald-500 bg-emerald-100/50 text-emerald-800'
                : 'border-slate-200 text-slate-400'
            }`}
          >
            <p className="text-xs font-semibold">
              {isOver ? 'Drop here to update' : 'No tasks in this stage'}
            </p>
            {isCompletedColumn && !isOver && (
              <p className="text-[10px] text-slate-400 mt-1">
                Drop finished tasks here to auto-increment M&amp;E indicators
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Add Button at column bottom */}
      {canEdit && (
        <div className="p-2 border-t border-slate-200/70">
          <button
            type="button"
            onClick={() => onOpenNewTaskModal(actualStatus)}
            className="w-full py-1.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-white text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center justify-center space-x-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to {label}</span>
          </button>
        </div>
      )}
    </div>
  );
};
