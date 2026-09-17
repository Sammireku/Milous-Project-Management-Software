import React, { useState } from 'react';
import { 
  Table as TableIcon, 
  ArrowUpDown, 
  User, 
  Calendar, 
  Zap, 
  CheckCircle2, 
  Clock, 
  MapPin,
  Sparkles,
  Filter,
  DollarSign
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { logAuditEvent, triggerTaskCompletedEmailAlert } from '../../lib/auditLogger';

interface WrikeTableViewProps {
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
}

export const WrikeTableView: React.FC<WrikeTableViewProps> = ({ tasks, onSelectTask }) => {
  const { updateTaskStatus, indicators, activeProject } = useFirestore();
  const { currentUser, userRole, permissions } = useAuth();

  const [sortField, setSortField] = useState<keyof Task>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof Task) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTasks = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      const valA = a[sortField] ?? '';
      const valB = b[sortField] ?? '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, sortField, sortOrder]);

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
      changeSummary: `Status changed to '${newStatus}' in Wrike Table View`,
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Bar Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <TableIcon className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Wrike Spreadsheet Table ({sortedTasks.length} tasks)
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Click column headers to sort. Double click or select inline controls to update tasks instantly.
        </p>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th
                onClick={() => handleSort('title')}
                className="p-3.5 cursor-pointer hover:bg-slate-200/70 transition"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Task Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="p-3.5 cursor-pointer hover:bg-slate-200/70 transition"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('priority')}
                className="p-3.5 cursor-pointer hover:bg-slate-200/70 transition"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('assigneeName')}
                className="p-3.5 cursor-pointer hover:bg-slate-200/70 transition"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Field Officer</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3.5">Linked M&amp;E Indicator</th>
              <th
                onClick={() => handleSort('plannedStartDate')}
                className="p-3.5 cursor-pointer hover:bg-slate-200/70 transition"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Start Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('plannedEndDate')}
                className="p-3.5 cursor-pointer hover:bg-slate-200/70 transition"
              >
                <div className="flex items-center space-x-1.5">
                  <span>End Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3.5 text-right">GPS Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedTasks.map((task) => {
              const ind = indicators.find((i) => i.id === task.linkedIndicatorId);

              return (
                <tr
                  key={task.id}
                  onClick={() => onSelectTask && onSelectTask(task)}
                  className="hover:bg-slate-50/80 transition cursor-pointer"
                >
                  {/* Task Name */}
                  <td className="p-3.5 font-bold text-slate-900 max-w-xs truncate">
                    {task.title}
                    {task.description && (
                      <p className="text-[11px] font-normal text-slate-500 truncate mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </td>

                  {/* Status Dropdown */}
                  <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                      className="bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold px-2 py-1 text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="BACKLOG">Backlog</option>
                      <option value="TODO">Ready for Field</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="VERIFICATION">Field Verification</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </td>

                  {/* Priority */}
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        task.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-800'
                          : task.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>

                  {/* Field Officer */}
                  <td className="p-3.5 text-slate-700">
                    <div className="flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{task.assigneeName || 'Unassigned'}</span>
                    </div>
                  </td>

                  {/* Linked Indicator */}
                  <td className="p-3.5">
                    {ind ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Zap className="w-3 h-3 text-emerald-600" />
                        <span>{ind.code} (+{task.indicatorIncrementValue ?? 1})</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">Direct Task</span>
                    )}
                  </td>

                  {/* Start Date */}
                  <td className="p-3.5 font-mono text-slate-600 text-[11px]">
                    {new Date(task.plannedStartDate).toLocaleDateString()}
                  </td>

                  {/* End Date */}
                  <td className="p-3.5 font-mono text-slate-600 text-[11px]">
                    {new Date(task.plannedEndDate).toLocaleDateString()}
                  </td>

                  {/* GPS Status */}
                  <td className="p-3.5 text-right font-mono">
                    {task.fieldData?.gpsCoordinates ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] inline-flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Pending</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WrikeTableView;
