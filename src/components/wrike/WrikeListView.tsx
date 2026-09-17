import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Calendar, 
  User, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown, 
  Zap, 
  Tag, 
  Clock, 
  ShieldAlert,
  Layers,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent, triggerTaskCompletedEmailAlert } from '../../lib/auditLogger';

interface WrikeListViewProps {
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; badgeClass: string }> = {
  BACKLOG: { label: 'Backlog', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  TODO: { label: 'Ready for Field', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'In Progress', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  VERIFICATION: { label: 'Field Verification', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  COMPLETED: { label: 'Completed', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const PRIORITY_BADGES: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-800',
  URGENT: 'bg-rose-100 text-rose-800 font-bold',
};

export const WrikeListView: React.FC<WrikeListViewProps> = ({ tasks, onSelectTask }) => {
  const { updateTaskStatus, indicators, activeProject } = useFirestore();
  const { currentUser, userRole, permissions } = useAuth();

  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<'status' | 'priority' | 'assignee'>('status');

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map((t) => t.id));
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (newStatus === 'COMPLETED' && !permissions.canCompleteTasks) {
      alert('Your role does not have permission to mark tasks as COMPLETED.');
      return;
    }

    await updateTaskStatus(task.id, newStatus);

    await logAuditEvent({
      projectId: task.projectId || activeProject?.id,
      projectName: activeProject?.title || 'WASH Initiative Ghana',
      actionType: 'TASK_STATUS_CHANGED',
      entityType: 'Task',
      entityId: task.id,
      entityTitle: task.title,
      modifiedByUserId: currentUser?.id || 'usr-field-01',
      modifiedByUserName: currentUser?.displayName || 'Ama Osei',
      modifiedByUserRole: userRole || 'FIELD_OFFICER',
      previousValue: task.status,
      newValue: newStatus,
      changeSummary: `Status changed from '${task.status}' to '${newStatus}' in List View`,
    });

    if (newStatus === 'COMPLETED') {
      await triggerTaskCompletedEmailAlert({
        taskId: task.id,
        taskTitle: task.title,
        projectName: activeProject?.title || 'WASH Initiative Ghana',
        completedByName: currentUser?.displayName || 'Ama Osei',
        projectManagerEmails: ['kofi.mensah@milous-ngo.org'],
      });
    }
  };

  const bulkMarkCompleted = async () => {
    if (selectedTaskIds.length === 0) return;
    for (const id of selectedTaskIds) {
      const task = tasks.find((t) => t.id === id);
      if (task && task.status !== 'COMPLETED') {
        await handleStatusChange(task, 'COMPLETED');
      }
    }
    setSelectedTaskIds([]);
  };

  // Grouping logic
  const groupedSections = React.useMemo(() => {
    if (groupBy === 'status') {
      const statuses: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'VERIFICATION', 'COMPLETED'];
      return statuses.map((st) => ({
        key: st,
        title: STATUS_CONFIG[st].label,
        items: tasks.filter((t) => t.status === st),
      }));
    } else if (groupBy === 'priority') {
      const priorities: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
      return priorities.map((pr) => ({
        key: pr,
        title: `${pr} Priority`,
        items: tasks.filter((t) => t.priority === pr),
      }));
    } else {
      const assignees = Array.from(new Set(tasks.map((t) => t.assigneeName || 'Unassigned')));
      return assignees.map((a) => ({
        key: a,
        title: `Assigned to: ${a}`,
        items: tasks.filter((t) => (t.assigneeName || 'Unassigned') === a),
      }));
    }
  }, [tasks, groupBy]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4 p-4 sm:p-5">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-bold text-slate-500">Group By:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
            {(['status', 'priority', 'assignee'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setGroupBy(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                  groupBy === mode
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {selectedTaskIds.length > 0 && (
          <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs">
            <span className="font-bold text-emerald-800">
              {selectedTaskIds.length} tasks selected
            </span>
            <button
              type="button"
              onClick={bulkMarkCompleted}
              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition shadow-xs flex items-center space-x-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Completed</span>
            </button>
          </div>
        )}
      </div>

      {/* List Header */}
      <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        <div className="col-span-5 flex items-center space-x-2">
          <button type="button" onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-700">
            {selectedTaskIds.length === tasks.length && tasks.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
          <span>Task Title &amp; Description</span>
        </div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Assignee</div>
        <div className="col-span-2">Due Date &amp; Indicator</div>
        <div className="col-span-1 text-right">Priority</div>
      </div>

      {/* Grouped Sections */}
      <div className="space-y-4">
        {groupedSections.map((section) => {
          if (section.items.length === 0) return null;
          return (
            <div key={section.key} className="space-y-2">
              <div className="flex items-center space-x-2 px-2 py-1 text-xs font-extrabold text-slate-800 bg-slate-100/70 rounded-lg">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>{section.title}</span>
                <span className="px-2 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
                  {section.items.length}
                </span>
              </div>

              <div className="space-y-1.5">
                {section.items.map((task) => {
                  const isExpanded = expandedTasks[task.id];
                  const isSelected = selectedTaskIds.includes(task.id);
                  const linkedInd = indicators.find((i) => i.id === task.linkedIndicatorId);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask && onSelectTask(task)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/50 border-emerald-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        {/* Title & expand button */}
                        <div className="md:col-span-5 flex items-center space-x-2.5">
                          <button
                            type="button"
                            onClick={(e) => toggleSelect(task.id, e)}
                            className="text-slate-400 hover:text-emerald-600 shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => toggleExpand(task.id, e)}
                            className="text-slate-400 hover:text-slate-700 shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Select */}
                        <div className="md:col-span-2">
                          <select
                            value={task.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusChange(task, e.target.value as TaskStatus);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                              STATUS_CONFIG[task.status].badgeClass
                            }`}
                          >
                            <option value="BACKLOG">Backlog</option>
                            <option value="TODO">Ready for Field</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="VERIFICATION">Field Verification</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>

                        {/* Assignee */}
                        <div className="md:col-span-2 flex items-center space-x-1.5 text-xs text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{task.assigneeName || 'Unassigned'}</span>
                        </div>

                        {/* Due Date & Auto-Sync Indicator */}
                        <div className="md:col-span-2 text-xs space-y-0.5">
                          <div className="flex items-center space-x-1 text-slate-500">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              {task.plannedEndDate
                                ? new Date(task.plannedEndDate).toLocaleDateString()
                                : 'No date'}
                            </span>
                          </div>
                          {linkedInd && (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                              <Zap className="w-2.5 h-2.5 text-blue-600" />
                              <span>{linkedInd.code} (+{task.indicatorIncrementValue ?? 1})</span>
                            </span>
                          )}
                        </div>

                        {/* Priority Badge */}
                        <div className="md:col-span-1 text-right">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                              PRIORITY_BADGES[task.priority]
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Details Drawer */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              Field Location &amp; Coordinates
                            </span>
                            <div className="flex items-center space-x-1.5 mt-1 text-slate-700 font-mono">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>
                                {task.fieldData?.gpsCoordinates
                                  ? `${task.fieldData.gpsCoordinates.lat.toFixed(4)}, ${task.fieldData.gpsCoordinates.lng.toFixed(4)}`
                                  : 'GPS Pending Field Sign-off'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              Linked M&amp;E Indicator
                            </span>
                            <p className="font-semibold text-slate-800 mt-1">
                              {linkedInd ? `${linkedInd.code}: ${linkedInd.title}` : 'Direct Task'}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              Reporting Period
                            </span>
                            <p className="text-slate-700 mt-1">
                              Start: {new Date(task.plannedStartDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WrikeListView;
