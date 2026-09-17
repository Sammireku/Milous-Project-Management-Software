import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { 
  Plus, 
  Zap, 
  CheckCircle2, 
  Sparkles, 
  X, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  User,
  Flame,
  CalendarClock,
  Archive,
  AlertOctagon,
  Filter,
  Check,
  RotateCcw
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { KanbanColumn } from '../kanban/KanbanColumn';
import { DraggableTaskCard } from '../kanban/DraggableTaskCard';
import { TaskDetailModal } from '../kanban/TaskDetailModal';
import { DetailFlyout } from '../common/DetailFlyout';
import { TaskFilterBar } from '../kanban/TaskFilterBar';
import { GlobalFilterToolbar, FilterState } from '../common/GlobalFilterToolbar';
import { logAuditEvent, triggerTaskCompletedEmailAlert } from '../../lib/auditLogger';


interface ColumnConfig {
  id: TaskStatus;
  label: string;
  description: string;
  dotColor: string;
}

const COLUMNS: ColumnConfig[] = [
  { 
    id: 'BACKLOG', 
    label: 'Backlog', 
    description: 'Unscheduled field activities', 
    dotColor: 'bg-slate-400' 
  },
  { 
    id: 'TODO', 
    label: 'Ready for Field', 
    description: 'Mobilized & assigned', 
    dotColor: 'bg-blue-500' 
  },
  { 
    id: 'IN_PROGRESS', 
    label: 'In Progress', 
    description: 'Field execution active', 
    dotColor: 'bg-amber-500' 
  },
  { 
    id: 'VERIFICATION', 
    label: 'Field Verification', 
    description: 'GPS & Sign-off audit', 
    dotColor: 'bg-purple-500' 
  },
  { 
    id: 'COMPLETED', 
    label: 'Completed', 
    description: 'Auto-syncs M&E LogFrame', 
    dotColor: 'bg-emerald-500' 
  },
];

export const KanbanView: React.FC = () => {
  const { 
    tasks, 
    allTasks,
    indicators, 
    updateTaskStatus, 
    updateTask, 
    deleteTask, 
    createTask, 
    activeProject,
    archiveOldCompletedTasks,
    unarchiveTask
  } = useFirestore();
  const { currentUser, userRole, allUsers, permissions } = useAuth();

  // Active dragging state
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Selected task for full detail modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Floating quick filter bar states
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [dueThisWeekOnly, setDueThisWeekOnly] = useState(false);
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Auto-archive prompt state
  const [isArchivePromptDismissed, setIsArchivePromptDismissed] = useState(false);
  const [archiveSuccessMsg, setArchiveSuccessMsg] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // New task modal state
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskInitialStatus, setNewTaskInitialStatus] = useState<TaskStatus>('TODO');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('HIGH');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');
  const [linkedIndicatorId, setLinkedIndicatorId] = useState<string>(indicators[0]?.id || '');
  const [indicatorIncrementValue, setIndicatorIncrementValue] = useState<number>(1);
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');

  // Layout mode & Swimlanes state
  const [layoutMode, setLayoutMode] = useState<'columns' | 'horizontal_swimlanes' | 'vertical_swimlanes'>('columns');
  const [swimlaneGroupBy, setSwimlaneGroupBy] = useState<'priority' | 'project'>('priority');

  const { projects } = useFirestore();

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [indicatorFilter, setIndicatorFilter] = useState('');
  const [autoSyncOnly, setAutoSyncOnly] = useState(false);

  // Auto-sync trigger celebration banner
  const [syncFeedback, setSyncFeedback] = useState<{
    taskTitle: string;
    indicatorCode: string;
    indicatorTitle: string;
    increment: number;
    newTotal?: number;
    unit?: string;
  } | null>(null);

  // Configure Dnd sensors with a 5px threshold to allow clean clicks inside cards
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Check if a task is due this week (within next 7 days or overdue)
  const isDueThisWeek = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr).getTime();
    const now = Date.now();
    const sevenDays = now + 7 * 86400000;
    return date <= sevenDays;
  };

  // Check if a task is waiting on unfinished dependencies
  const isTaskBlocked = (task: Task) => {
    const blockers = (task.blockedBy && task.blockedBy.length > 0)
      ? task.blockedBy
      : (task.dependencies || []);
    if (blockers.length === 0) return false;
    const taskPool = allTasks && allTasks.length > 0 ? allTasks : tasks;
    return blockers.some((bId) => {
      const dep = taskPool.find((t) => t.id === bId);
      return !dep || dep.status !== 'COMPLETED';
    });
  };

  // Completed tasks older than 30 days eligible for archiving
  const oldCompletedCandidates = useMemo(() => {
    const thresholdMs = 30 * 86400000;
    const now = Date.now();
    const pool = allTasks && allTasks.length > 0 ? allTasks : tasks;
    return pool.filter((t) => {
      if (t.isArchived) return false;
      if (t.status !== 'COMPLETED') return false;
      const completedDate = t.actualEndDate || t.updatedAt || t.plannedEndDate;
      const taskTime = new Date(completedDate).getTime();
      return (now - taskTime) >= thresholdMs;
    });
  }, [allTasks, tasks]);

  // Quick trigger to archive old completed tasks
  const handleExecuteAutoArchive = async () => {
    try {
      setIsArchiving(true);
      const archivedCount = await archiveOldCompletedTasks(30);
      setArchiveSuccessMsg(`Successfully archived ${archivedCount} completed task${archivedCount !== 1 ? 's' : ''} older than 30 days.`);
      setTimeout(() => setArchiveSuccessMsg(null), 6000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsArchiving(false);
    }
  };

  // Quick filter counts
  const assignedToMeCount = useMemo(() => {
    if (!currentUser?.id) return 0;
    return tasks.filter((t) => t.assigneeId === currentUser.id).length;
  }, [tasks, currentUser]);

  const highPriorityCount = useMemo(() => {
    return tasks.filter((t) => t.priority === 'HIGH' || t.priority === 'URGENT').length;
  }, [tasks]);

  const dueThisWeekCount = useMemo(() => {
    return tasks.filter((t) => isDueThisWeek(t.plannedEndDate)).length;
  }, [tasks]);

  const blockedCount = useMemo(() => {
    return tasks.filter((t) => isTaskBlocked(t)).length;
  }, [tasks, allTasks]);

  const archivedTotalCount = useMemo(() => {
    const pool = allTasks && allTasks.length > 0 ? allTasks : tasks;
    return pool.filter((t) => t.isArchived).length;
  }, [allTasks, tasks]);

  const hasActiveQuickFilters = assignedToMeOnly || highPriorityOnly || dueThisWeekOnly || blockedOnly || showArchived;

  const handleClearQuickFilters = () => {
    setAssignedToMeOnly(false);
    setHighPriorityOnly(false);
    setDueThisWeekOnly(false);
    setBlockedOnly(false);
    setShowArchived(false);
    setSearchQuery('');
    setPriorityFilter('ALL');
    setIndicatorFilter('');
    setAutoSyncOnly(false);
  };

  // Filter tasks based on global filters + floating filter bar
  const filteredTasks = useMemo(() => {
    const pool = showArchived 
      ? (allTasks && allTasks.length > 0 ? allTasks.filter((t) => t.isArchived) : [])
      : tasks;

    return pool.filter((t) => {
      // 1. Assigned to Me filter
      if (assignedToMeOnly) {
        if (!currentUser?.id || t.assigneeId !== currentUser.id) return false;
      }

      // 2. High Priority filter (HIGH or URGENT)
      if (highPriorityOnly) {
        if (t.priority !== 'HIGH' && t.priority !== 'URGENT') return false;
      }

      // 3. Due This Week filter
      if (dueThisWeekOnly) {
        if (!isDueThisWeek(t.plannedEndDate)) return false;
      }

      // 4. Blocked tasks filter
      if (blockedOnly) {
        if (!isTaskBlocked(t)) return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesAssignee = t.assigneeName?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesAssignee) return false;
      }

      // 6. Priority dropdown filter
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) {
        return false;
      }

      // 7. Indicator dropdown filter
      if (indicatorFilter && t.linkedIndicatorId !== indicatorFilter) {
        return false;
      }

      // 8. Auto sync toggle
      if (autoSyncOnly && !t.linkedIndicatorId) {
        return false;
      }

      return true;
    });
  }, [
    tasks, 
    allTasks, 
    showArchived, 
    assignedToMeOnly, 
    highPriorityOnly, 
    dueThisWeekOnly, 
    blockedOnly, 
    searchQuery, 
    priorityFilter, 
    indicatorFilter, 
    autoSyncOnly, 
    currentUser
  ]);

  const swimlaneGroups = useMemo(() => {
    if (swimlaneGroupBy === 'priority') {
      const priorities: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
      return priorities.map((p) => ({
        key: p,
        title: `${p} Priority Swimlane`,
        badgeClass: p === 'URGENT' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-800 border-slate-200',
        tasks: filteredTasks.filter((t) => t.priority === p),
      }));
    } else {
      const projectMap = new Map<string, Task[]>();
      filteredTasks.forEach((t) => {
        const pKey = t.projectId || 'Default Mission';
        if (!projectMap.has(pKey)) projectMap.set(pKey, []);
        projectMap.get(pKey)!.push(t);
      });
      return Array.from(projectMap.entries()).map(([pId, pTasks]) => {
        const proj = projects.find((p) => p.id === pId);
        return {
          key: pId,
          title: proj ? `[${proj.code}] ${proj.title}` : 'Mission Operations',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          tasks: pTasks,
        };
      });
    }
  }, [filteredTasks, swimlaneGroupBy, projects]);

  // Overall Kanban statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const withAutoSync = tasks.filter((t) => !!t.linkedIndicatorId).length;
    const gpsVerified = tasks.filter((t) => !!t.fieldData?.gpsCoordinates).length;
    const percentCompleted = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, withAutoSync, gpsVerified, percentCompleted };
  }, [tasks]);

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const found = tasks.find((t) => t.id === active.id);
    if (found) {
      setActiveTask(found);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const draggedTask = tasks.find((t) => t.id === activeId);
    if (!draggedTask) return;

    // Determine target column and optional swimlane category
    let destinationStatus: TaskStatus | null = null;
    let targetCategoryKey: string | null = null;

    const overIdStr = String(over.id);
    if (overIdStr.includes('::')) {
      const [colStatus, catKey] = overIdStr.split('::');
      destinationStatus = colStatus as TaskStatus;
      targetCategoryKey = catKey;
    } else if (COLUMNS.some((col) => col.id === over.id)) {
      destinationStatus = over.id as TaskStatus;
    } else {
      // It was dropped over another task card; find that card's status
      const targetCard = tasks.find((t) => t.id === over.id);
      if (targetCard) {
        destinationStatus = targetCard.status;
        targetCategoryKey = swimlaneGroupBy === 'priority' ? targetCard.priority : (targetCard.projectId || 'Default Mission');
      }
    }

    if (destinationStatus) {
      // If moving to completed and permissions check passes
      if (destinationStatus === 'COMPLETED' && !permissions.canCompleteTasks) {
        alert('Your role does not have permission to mark tasks as COMPLETED.');
        return;
      }

      // Check if category changed (priority or project)
      let needsTaskUpdate = false;
      const updatedFields: Partial<Task> = { status: destinationStatus };

      if (targetCategoryKey) {
        if (swimlaneGroupBy === 'priority' && draggedTask.priority !== targetCategoryKey) {
          updatedFields.priority = targetCategoryKey as TaskPriority;
          needsTaskUpdate = true;
        } else if (swimlaneGroupBy === 'project' && draggedTask.projectId !== targetCategoryKey) {
          updatedFields.projectId = targetCategoryKey;
          needsTaskUpdate = true;
        }
      }

      if (destinationStatus !== draggedTask.status || needsTaskUpdate) {
        if (needsTaskUpdate) {
          await updateTask(draggedTask.id, updatedFields);
        } else {
          await updateTaskStatus(draggedTask.id, destinationStatus);
        }

        // Record activity history audit log
        await logAuditEvent({
          projectId: draggedTask.projectId || activeProject?.id,
          projectName: activeProject?.title || 'WASH Initiative Ghana',
          actionType: 'TASK_STATUS_CHANGED',
          entityType: 'Task',
          entityId: draggedTask.id,
          entityTitle: draggedTask.title,
          modifiedByUserId: currentUser?.id || 'usr-field-01',
          modifiedByUserName: currentUser?.displayName || 'Ama Osei',
          modifiedByUserRole: userRole || 'FIELD_OFFICER',
          previousValue: draggedTask.status,
          newValue: destinationStatus,
          changeSummary: `Updated status to '${destinationStatus}'${targetCategoryKey ? ` and category to '${targetCategoryKey}'` : ''}`,
        });

        // Trigger email alert to Project Managers if status changed to COMPLETED
        if (destinationStatus === 'COMPLETED' && draggedTask.status !== 'COMPLETED') {
          await triggerTaskCompletedEmailAlert({
            taskId: draggedTask.id,
            taskTitle: draggedTask.title,
            projectName: activeProject?.title || 'WASH Initiative Ghana',
            completedByName: currentUser?.displayName || 'Ama Osei',
            projectManagerEmails: ['kofi.mensah@milous-ngo.org'],
          });
        }

        // Trigger Celebration Banner if auto-sync happened
        if (destinationStatus === 'COMPLETED' && draggedTask.linkedIndicatorId) {
          const ind = indicators.find((i) => i.id === draggedTask.linkedIndicatorId);
          if (ind) {
            const inc = draggedTask.indicatorIncrementValue ?? 1;
            setSyncFeedback({
              taskTitle: draggedTask.title,
              indicatorCode: ind.code,
              indicatorTitle: ind.title,
              increment: inc,
              newTotal: ind.actualValue + inc,
              unit: ind.unit,
            });
            setTimeout(() => {
              setSyncFeedback((current) => (current?.taskTitle === draggedTask.title ? null : current));
            }, 7000);
          }
        }
      }
    }
  };

  const handleQuickMove = async (taskId: string, newStatus: TaskStatus) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.status === newStatus) return;

    const result = await updateTaskStatus(taskId, newStatus);

    await logAuditEvent({
      projectId: target.projectId || activeProject?.id,
      projectName: activeProject?.title || 'WASH Initiative Ghana',
      actionType: 'TASK_STATUS_CHANGED',
      entityType: 'Task',
      entityId: target.id,
      entityTitle: target.title,
      modifiedByUserId: currentUser?.id || 'usr-field-01',
      modifiedByUserName: currentUser?.displayName || 'Ama Osei',
      modifiedByUserRole: userRole || 'FIELD_OFFICER',
      previousValue: target.status,
      newValue: newStatus,
      changeSummary: `Updated status from '${target.status}' to '${newStatus}'`,
    });

    if (newStatus === 'COMPLETED') {
      await triggerTaskCompletedEmailAlert({
        taskId: target.id,
        taskTitle: target.title,
        projectName: activeProject?.title || 'WASH Initiative Ghana',
        completedByName: currentUser?.displayName || 'Ama Osei',
        projectManagerEmails: ['kofi.mensah@milous-ngo.org'],
      });
    }

    if (newStatus === 'COMPLETED' && target.linkedIndicatorId) {
      const ind = indicators.find((i) => i.id === target.linkedIndicatorId);
      if (ind) {
        const inc = target.indicatorIncrementValue ?? 1;
        setSyncFeedback({
          taskTitle: target.title,
          indicatorCode: ind.code,
          indicatorTitle: ind.title,
          increment: inc,
          newTotal: ind.actualValue + inc,
          unit: ind.unit,
        });
      }
    }
  };


  const handleOpenNewTask = (initialStatus: TaskStatus = 'TODO') => {
    setNewTaskInitialStatus(initialStatus);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('HIGH');
    setNewTaskAssigneeId(currentUser.id);
    setLinkedIndicatorId(indicators[0]?.id || '');
    setIndicatorIncrementValue(1);
    setPlannedStartDate(new Date().toISOString().split('T')[0]);
    setPlannedEndDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setIsNewTaskOpen(true);
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const assignee = allUsers.find((u) => u.id === newTaskAssigneeId) || currentUser;

    await createTask({
      projectId: activeProject?.id || 'proj-gh-wash-2025',
      title: newTaskTitle,
      description: newTaskDescription,
      status: newTaskInitialStatus,
      priority: newTaskPriority,
      assigneeId: assignee.id,
      assigneeName: assignee.displayName,
      plannedStartDate: plannedStartDate ? new Date(plannedStartDate).toISOString() : new Date().toISOString(),
      plannedEndDate: plannedEndDate ? new Date(plannedEndDate).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
      dependencies: [],
      linkedIndicatorId: linkedIndicatorId || undefined,
      indicatorIncrementValue: linkedIndicatorId ? Number(indicatorIncrementValue) : 0,
      fieldData: {
        gpsCoordinates: {
          lat: 9.4074 + (Math.random() - 0.5) * 0.01,
          lng: -0.8533 + (Math.random() - 0.5) * 0.01,
        },
      },
    });

    setIsNewTaskOpen(false);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setPriorityFilter('ALL');
    setIndicatorFilter('');
    setAutoSyncOnly(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner: Header + Stats + Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Field Operations &amp; Task Kanban
              </h2>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                <Zap className="w-3 h-3 text-emerald-700" />
                <span>Auto-Sync Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Drag tasks across field operation stages. Dragging or setting a task to{' '}
              <strong className="text-emerald-700 font-bold">COMPLETED</strong> automatically executes an atomic
              increment on linked M&amp;E LogFrame indicators with an immutable donor audit log.
            </p>
          </div>

          {permissions.canEditTasks && (
            <button
              type="button"
              onClick={() => handleOpenNewTask('TODO')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-2 shadow-sm transition whitespace-nowrap self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Field Task</span>
            </button>
          )}
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Tasks</div>
              <div className="text-sm font-black text-slate-800">{stats.total}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Completed</div>
              <div className="text-sm font-black text-slate-800">
                {stats.completed} ({stats.percentCompleted}%)
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Linked to M&amp;E</div>
              <div className="text-sm font-black text-slate-800">{stats.withAutoSync} tasks</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">GPS Verified</div>
              <div className="text-sm font-black text-slate-800">{stats.gpsVerified} items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Filter Toolbar */}
      <GlobalFilterToolbar
        filters={{
          searchQuery,
          projectId: 'ALL',
          donorCode: 'ALL',
          startDate: '',
          endDate: '',
        }}
        onFilterChange={(updated) => {
          if (updated.searchQuery !== undefined) setSearchQuery(updated.searchQuery);
        }}
        onResetFilters={resetFilters}
        placeholder="Filter Kanban tasks by title, description or field officer..."
      />

      {/* Auto-Sync Live Event Alert Banner */}

      {syncFeedback && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-black tracking-wide flex items-center space-x-1.5">
                <span>Task-to-Indicator Auto-Sync Executed!</span>
                <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-mono font-bold">
                  +{syncFeedback.increment}
                </span>
              </div>
              <p className="text-xs text-white/90">
                Task &ldquo;{syncFeedback.taskTitle}&rdquo; completed. Indicator{' '}
                <strong className="text-white font-bold">[{syncFeedback.indicatorCode}] {syncFeedback.indicatorTitle}</strong>{' '}
                auto-incremented to{' '}
                <strong className="text-yellow-200 font-black">
                  {syncFeedback.newTotal} {syncFeedback.unit}
                </strong>
                .
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <TaskFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        indicatorFilter={indicatorFilter}
        onIndicatorFilterChange={setIndicatorFilter}
        autoSyncOnly={autoSyncOnly}
        onAutoSyncOnlyToggle={() => setAutoSyncOnly(!autoSyncOnly)}
        indicators={indicators}
        totalTasks={tasks.length}
        filteredTasksCount={filteredTasks.length}
        onResetFilters={resetFilters}
      />

      {/* Layout Mode Switcher & Swimlane Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-bold text-slate-500">Board Layout:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setLayoutMode('columns')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                layoutMode === 'columns'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standard Columns
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('horizontal_swimlanes')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                layoutMode === 'horizontal_swimlanes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Horizontal Swimlanes
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('vertical_swimlanes')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                layoutMode === 'vertical_swimlanes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vertical Swimlanes
            </button>
          </div>
        </div>

        {layoutMode !== 'columns' && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-bold text-slate-500">Group Swimlanes By:</span>
            <select
              value={swimlaneGroupBy}
              onChange={(e) => setSwimlaneGroupBy(e.target.value as 'priority' | 'project')}
              className="bg-slate-50 border border-slate-200 rounded-lg font-bold px-2.5 py-1 text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="priority">Priority Category</option>
              <option value="project">Project / Mission</option>
            </select>
          </div>
        )}
      </div>

      {/* Auto-Archive Notification & Prompt Banner (Quality of Life) */}
      {archiveSuccessMsg && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{archiveSuccessMsg}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowArchived(true)}
              className="text-[11px] font-bold text-emerald-700 underline hover:text-emerald-800 cursor-pointer"
            >
              View Archived Tasks
            </button>
            <button
              type="button"
              onClick={() => setArchiveSuccessMsg(null)}
              className="p-1 text-emerald-600 hover:text-emerald-800 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {oldCompletedCandidates.length > 0 && !isArchivePromptDismissed && !showArchived && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/80 border border-amber-200/90 rounded-2xl shadow-xs text-xs">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
              <Archive className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-amber-950">Kanban Board Cleanliness &amp; Auto-Archive</h4>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-200/70 text-amber-900 rounded-full">
                  {oldCompletedCandidates.length} Completed Task{oldCompletedCandidates.length > 1 ? 's' : ''} &gt; 30 Days Old
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed max-w-3xl">
                Keep your active Kanban board uncluttered! You have finished field operations completed over 30 days ago. 
                Archiving removes them from active columns while safely retaining all M&amp;E LogFrame indicator logs, donor audit reports, and history.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleExecuteAutoArchive}
              disabled={isArchiving}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{isArchiving ? 'Archiving...' : `Archive ${oldCompletedCandidates.length} Old Tasks`}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsArchivePromptDismissed(true)}
              className="px-3 py-2 bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-amber-200 rounded-xl font-medium transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Floating Filter Bar Above Kanban Board */}
      <div className="sticky top-2 z-20 backdrop-blur-md bg-white/95 border border-slate-200/90 rounded-2xl p-3 shadow-md transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px] mr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Quick Filters:</span>
            </div>

            {/* Assigned to Me */}
            <button
              type="button"
              onClick={() => setAssignedToMeOnly(!assignedToMeOnly)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                assignedToMeOnly
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-400/30'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Assigned to Me</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                assignedToMeOnly ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-700 font-bold'
              }`}>
                {assignedToMeCount}
              </span>
            </button>

            {/* High Priority */}
            <button
              type="button"
              onClick={() => setHighPriorityOnly(!highPriorityOnly)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                highPriorityOnly
                  ? 'bg-rose-700 text-white border-rose-700 shadow-xs ring-2 ring-rose-400/30'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>High Priority</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                highPriorityOnly ? 'bg-rose-900 text-rose-100' : 'bg-slate-200 text-slate-700 font-bold'
              }`}>
                {highPriorityCount}
              </span>
            </button>

            {/* Due This Week */}
            <button
              type="button"
              onClick={() => setDueThisWeekOnly(!dueThisWeekOnly)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                dueThisWeekOnly
                  ? 'bg-blue-700 text-white border-blue-700 shadow-xs ring-2 ring-blue-400/30'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Due This Week</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                dueThisWeekOnly ? 'bg-blue-900 text-blue-100' : 'bg-slate-200 text-slate-700 font-bold'
              }`}>
                {dueThisWeekCount}
              </span>
            </button>

            {/* Blocked Dependencies Toggle */}
            <button
              type="button"
              onClick={() => setBlockedOnly(!blockedOnly)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                blockedOnly
                  ? 'bg-amber-700 text-white border-amber-700 shadow-xs ring-2 ring-amber-400/30'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Blocked Tasks</span>
              {blockedCount > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  blockedOnly ? 'bg-amber-900 text-amber-100' : 'bg-amber-100 text-amber-800 font-bold'
                }`}>
                  {blockedCount}
                </span>
              )}
            </button>

            {/* Archived Tasks Toggle */}
            <button
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                showArchived
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs ring-2 ring-slate-400/30'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{showArchived ? 'Active Board' : 'Show Archived'}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                showArchived ? 'bg-slate-950 text-slate-200' : 'bg-slate-200 text-slate-700 font-bold'
              }`}>
                {archivedTotalCount}
              </span>
            </button>

            {/* Reset Filter Button */}
            {hasActiveQuickFilters && (
              <button
                type="button"
                onClick={handleClearQuickFilters}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg border border-slate-200/60 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Right: Quick Archive Action & Results Counter */}
          <div className="flex items-center space-x-3 text-xs">
            <button
              type="button"
              onClick={handleExecuteAutoArchive}
              disabled={isArchiving || oldCompletedCandidates.length === 0}
              className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 disabled:opacity-40 transition cursor-pointer"
              title="Archive all completed tasks older than 30 days"
            >
              <Archive className="w-3.5 h-3.5 text-amber-700" />
              <span>Archive Old (&gt;30d)</span>
              {oldCompletedCandidates.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 font-bold">
                  {oldCompletedCandidates.length}
                </span>
              )}
            </button>

            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Showing <strong className="text-slate-900">{filteredTasks.length}</strong> of {showArchived ? archivedTotalCount : tasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive DnD Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {layoutMode === 'columns' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4 items-start">
            {COLUMNS.map((column) => {
              const colTasks = filteredTasks.filter((t) => t.status === column.id);

              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  statusId={column.id}
                  label={column.label}
                  description={column.description}
                  dotColor={column.dotColor}
                  tasks={colTasks}
                  allTasks={allTasks && allTasks.length > 0 ? allTasks : tasks}
                  indicators={indicators}
                  onSelectTask={(task) => setSelectedTask(task)}
                  onQuickMove={handleQuickMove}
                  onOpenNewTaskModal={(status) => handleOpenNewTask(status)}
                  canEdit={permissions.canEditTasks}
                />
              );
            })}
          </div>
        ) : layoutMode === 'horizontal_swimlanes' ? (
          <div className="space-y-6">
            {swimlaneGroups.map((group) => {
              return (
                <div key={group.key} className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-slate-600" />
                      <h4 className="text-xs font-black text-slate-900">{group.title}</h4>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${group.badgeClass}`}>
                        {group.tasks.length} tasks
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 overflow-x-auto items-start">
                    {COLUMNS.map((column) => {
                      const colTasks = group.tasks.filter((t) => t.status === column.id);
                      return (
                        <KanbanColumn
                          key={`${group.key}-${column.id}`}
                          id={`${column.id}::${group.key}`}
                          statusId={column.id}
                          label={column.label}
                          description={column.description}
                          dotColor={column.dotColor}
                          tasks={colTasks}
                          allTasks={allTasks && allTasks.length > 0 ? allTasks : tasks}
                          indicators={indicators}
                          onSelectTask={(task) => setSelectedTask(task)}
                          onQuickMove={handleQuickMove}
                          onOpenNewTaskModal={(status) => handleOpenNewTask(status)}
                          canEdit={permissions.canEditTasks}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Vertical Swimlanes View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 items-start">
            {swimlaneGroups.map((group) => {
              return (
                <div key={group.key} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/90 space-y-3 flex flex-col">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-black text-slate-900 truncate">{group.title}</h4>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${group.badgeClass}`}>
                      {group.tasks.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {COLUMNS.map((column) => {
                      const colTasks = group.tasks.filter((t) => t.status === column.id);
                      return (
                        <div key={`${group.key}-${column.id}`} className="space-y-1">
                          <KanbanColumn
                            id={`${column.id}::${group.key}`}
                            statusId={column.id}
                            label={column.label}
                            description={column.description}
                            dotColor={column.dotColor}
                            tasks={colTasks}
                            allTasks={allTasks && allTasks.length > 0 ? allTasks : tasks}
                            indicators={indicators}
                            onSelectTask={(task) => setSelectedTask(task)}
                            onQuickMove={handleQuickMove}
                            onOpenNewTaskModal={(status) => handleOpenNewTask(status)}
                            canEdit={permissions.canEditTasks}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Drag Overlay: Displays a smooth preview of the dragged task */}
        <DragOverlay>
          {activeTask ? (
            <DraggableTaskCard
              task={activeTask}
              linkedIndicator={indicators.find((i) => i.id === activeTask.linkedIndicatorId)}
              allTasks={allTasks && allTasks.length > 0 ? allTasks : tasks}
              onSelectTask={() => {}}
              onQuickMove={() => {}}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          indicators={indicators}
          allUsers={allUsers}
          allTasks={allTasks && allTasks.length > 0 ? allTasks : tasks}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={async (taskId, updates) => {
            await updateTask(taskId, updates);
            setSelectedTask((prev) => (prev && prev.id === taskId ? { ...prev, ...updates } : prev));
          }}
          onDeleteTask={async (taskId) => {
            await deleteTask(taskId);
            setSelectedTask(null);
          }}
          onUpdateStatus={async (taskId, newStatus) => {
            const res = await updateTaskStatus(taskId, newStatus);
            setSelectedTask((prev) => (prev && prev.id === taskId ? { ...prev, status: newStatus } : prev));
            return res;
          }}
        />
      )}

      {/* New Task Modal */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Field Task &amp; Link M&amp;E</h3>
                <p className="text-[11px] text-slate-500">
                  Target Column: <span className="font-bold text-slate-700">{newTaskInitialStatus}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTaskOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Conduct Community Water Committee Training in Diare"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description &amp; Specifications</label>
                <textarea
                  rows={3}
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Include technical specs, target beneficiary communities, or verification requirements..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Column</label>
                  <select
                    value={newTaskInitialStatus}
                    onChange={(e) => setNewTaskInitialStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={newTaskAssigneeId}
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={plannedEndDate}
                    onChange={(e) => setPlannedEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Task-to-Indicator Auto-Sync Linker */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-emerald-950">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Task-to-Indicator Auto-Sync Setup</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-normal">
                  When this task reaches &apos;COMPLETED&apos;, it will increment this quantitative LogFrame metric in real-time.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Linked M&amp;E Indicator</label>
                    <select
                      value={linkedIndicatorId}
                      onChange={(e) => setLinkedIndicatorId(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    >
                      <option value="">-- No M&amp;E Link --</option>
                      {indicators.map((ind) => (
                        <option key={ind.id} value={ind.id}>
                          [{ind.code}] {ind.title} ({ind.actualValue}/{ind.target} {ind.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Increment Value</label>
                    <input
                      type="number"
                      min="1"
                      value={indicatorIncrementValue}
                      onChange={(e) => setIndicatorIncrementValue(Number(e.target.value))}
                      disabled={!linkedIndicatorId}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
