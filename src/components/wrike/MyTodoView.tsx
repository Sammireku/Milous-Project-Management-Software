import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Filter, 
  Calendar, 
  Layers, 
  SlidersHorizontal, 
  MoreHorizontal,
  ChevronDown,
  User,
  ArrowUpDown
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';

export const MyTodoView: React.FC = () => {
  const { tasks, createTask, updateTask, projects } = useFirestore();
  const { user } = useAuth();

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('active');
  const [inlineTitle, setInlineTitle] = useState('');
  const [isAddingInline, setIsAddingInline] = useState(false);

  // Filter to items assigned to user or all items if none assigned
  const myTasks = tasks.filter((t) => {
    if (filterStatus === 'active') return t.status !== 'COMPLETED';
    if (filterStatus === 'completed') return t.status === 'COMPLETED';
    return true;
  });

  // Group tasks by timing
  const nextWeekTasks = myTasks.filter((t) => t.plannedEndDate && t.plannedEndDate.includes('2026-09'));
  const otherTasks = myTasks.filter((t) => !nextWeekTasks.includes(t));

  const handleCreateInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;
    await createTask({
      projectId: projects[0]?.id || 'default-proj',
      title: inlineTitle.trim(),
      description: 'Added from My to-do',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: user?.id || 'usr-milou-01',
      assigneeName: user?.displayName || 'Milou Mireku',
      plannedStartDate: new Date().toISOString(),
      plannedEndDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      dependencies: [],
      blockedBy: [],
    });
    setInlineTitle('');
    setIsAddingInline(false);
  };

  const toggleTaskComplete = (task: Task) => {
    updateTask(task.id, {
      status: task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* Top Filter Bar */}
      <div className="px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterStatus(filterStatus === 'active' ? 'all' : 'active')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <span>{filterStatus === 'active' ? 'All active' : 'All items'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Due date</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Group</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Fields</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAddingInline(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New item</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="w-10 px-4 py-2.5 text-center"></th>
              <th className="px-4 py-2.5 font-bold">Name</th>
              <th className="px-4 py-2.5 w-36 font-bold">Assigned to</th>
              <th className="px-4 py-2.5 w-28 font-bold">Status</th>
              <th className="px-4 py-2.5 w-32 font-bold">Start date</th>
              <th className="px-4 py-2.5 w-32 font-bold">Finish by</th>
              <th className="px-4 py-2.5 w-32 font-bold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {/* Group Header: Next week */}
            <tr className="bg-slate-100/60 font-bold text-slate-800 text-[11px]">
              <td colSpan={7} className="px-4 py-1.5">
                <span className="flex items-center space-x-1.5">
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Next week ({nextWeekTasks.length})</span>
                </span>
              </td>
            </tr>

            {nextWeekTasks.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/80 group transition-colors">
                <td className="px-4 py-2.5 text-center">
                  <button
                    onClick={() => toggleTaskComplete(t)}
                    className="text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    {t.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-2.5 font-medium text-slate-900">
                  <span className={t.status === 'COMPLETED' ? 'line-through text-slate-400' : ''}>
                    {t.title}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                      MM
                    </span>
                    <span className="truncate">{t.assigneeName || 'Milou Mireku'}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-500">{t.plannedStartDate?.split('T')[0] || '—'}</td>
                <td className="px-4 py-2.5 text-slate-500">{t.plannedEndDate?.split('T')[0] || '—'}</td>
                <td className="px-4 py-2.5 text-slate-400">{t.createdAt?.split('T')[0] || 'Today'}</td>
              </tr>
            ))}

            {/* Other items group */}
            {otherTasks.length > 0 && (
              <>
                <tr className="bg-slate-100/60 font-bold text-slate-800 text-[11px]">
                  <td colSpan={7} className="px-4 py-1.5">
                    <span className="flex items-center space-x-1.5">
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Other to-dos ({otherTasks.length})</span>
                    </span>
                  </td>
                </tr>
                {otherTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 group transition-colors">
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => toggleTaskComplete(t)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors"
                      >
                        {t.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      <span className={t.status === 'COMPLETED' ? 'line-through text-slate-400' : ''}>
                        {t.title}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                          MM
                        </span>
                        <span className="truncate">{t.assigneeName || 'Milou Mireku'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{t.plannedStartDate?.split('T')[0] || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500">{t.plannedEndDate?.split('T')[0] || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-400">{t.createdAt?.split('T')[0] || 'Today'}</td>
                  </tr>
                ))}
              </>
            )}

            {/* Inline Quick Add Row */}
            <tr className="bg-white hover:bg-slate-50/50">
              <td className="px-4 py-2.5 text-center text-slate-400">
                <Plus className="w-4 h-4 mx-auto" />
              </td>
              <td colSpan={6} className="px-4 py-2">
                {isAddingInline ? (
                  <form onSubmit={handleCreateInline} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={inlineTitle}
                      onChange={(e) => setInlineTitle(e.target.value)}
                      placeholder="Write to-do name and press Enter..."
                      className="w-full text-xs outline-none py-1 text-slate-900 placeholder:text-slate-400"
                      autoFocus
                      onBlur={() => {
                        if (!inlineTitle.trim()) setIsAddingInline(false);
                      }}
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 rounded"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingInline(false)}
                      className="text-slate-400 hover:text-slate-600 text-[11px]"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingInline(true)}
                    className="text-xs text-slate-400 hover:text-slate-700 font-medium flex items-center space-x-1"
                  >
                    <span>+ Item</span>
                  </button>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {myTasks.length === 0 && !isAddingInline && (
          <div className="p-8 text-center text-slate-400 text-xs">
            No to-dos yet. Click <span className="font-semibold text-emerald-600 cursor-pointer" onClick={() => setIsAddingInline(true)}>+ Item</span> above to add your first to-do!
          </div>
        )}
      </div>
    </div>
  );
};
