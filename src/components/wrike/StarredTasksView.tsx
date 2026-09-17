import React, { useState } from 'react';
import { 
  Star, 
  Filter, 
  Layers, 
  SlidersHorizontal, 
  MoreHorizontal, 
  CheckCircle2, 
  Circle,
  Plus
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { Task } from '../../types';

export const StarredTasksView: React.FC = () => {
  const { tasks, updateTask } = useFirestore();
  const [starredIds, setStarredIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('milous_starred_task_ids');
    return saved ? JSON.parse(saved) : [];
  });

  const starredTasks = tasks.filter((t) => starredIds.includes(t.id));

  const toggleStar = (id: string) => {
    let next: string[];
    if (starredIds.includes(id)) {
      next = starredIds.filter((x) => x !== id);
    } else {
      next = [...starredIds, id];
    }
    setStarredIds(next);
    localStorage.setItem('milous_starred_task_ids', JSON.stringify(next));
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
          <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter</span>
          </button>

          <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Group</span>
          </button>

          <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Fields</span>
          </button>
        </div>

        <div className="text-xs text-slate-400">
          {starredTasks.length} starred {starredTasks.length === 1 ? 'item' : 'items'}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {starredTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shadow-xs">
              <Star className="w-8 h-8 text-amber-500 fill-amber-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No starred tasks</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Star important tasks across your workspace so you can access them quickly from here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="w-10 px-4 py-2.5 text-center"></th>
                <th className="px-4 py-2.5 font-bold">Name</th>
                <th className="px-4 py-2.5 w-36 font-bold">Assigned to</th>
                <th className="px-4 py-2.5 w-28 font-bold">Status</th>
                <th className="w-12 px-4 py-2.5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {starredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => toggleTaskComplete(t)}
                      className="text-slate-400 hover:text-emerald-600"
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
                  <td className="px-4 py-2.5 text-slate-600">{t.assigneeName || 'Milou Mireku'}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => toggleStar(t.id)}
                      className="text-amber-500 hover:text-slate-400"
                      title="Unstar"
                    >
                      <Star className="w-4 h-4 fill-amber-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
