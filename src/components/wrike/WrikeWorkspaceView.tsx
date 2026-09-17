import React, { useState, useMemo } from 'react';
import { 
  List, 
  KanbanSquare, 
  Table as TableIcon, 
  Calendar as CalendarIcon, 
  Users, 
  FileText, 
  Plus, 
  Zap, 
  CheckCircle2, 
  Sparkles, 
  History,
  Building2,
  Layers,
  Search,
  Eye
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskStatus, TaskPriority } from '../../types';

import { WrikeListView } from './WrikeListView';
import { WrikeTableView } from './WrikeTableView';
import { WrikeGanttChart } from './WrikeGanttChart';
import { WrikeWorkloadView } from './WrikeWorkloadView';
import { WrikeRequestForms } from './WrikeRequestForms';
import { WrikeThreePaneView } from './WrikeThreePaneView';
import { WrikeCalendarView } from './WrikeCalendarView';
import { WrikeAiAutomationView } from './WrikeAiAutomationView';
import { DocumentReviewModal } from './DocumentReviewModal';
import { KanbanView } from '../views/KanbanView';
import { TaskDetailModal } from '../kanban/TaskDetailModal';
import { AuditLogSidebar } from '../views/AuditLogSidebar';
import { GlobalFilterToolbar, FilterState } from '../common/GlobalFilterToolbar';

export type WrikeViewMode = 'three-pane' | 'board' | 'list' | 'table' | 'gantt' | 'workload' | 'calendar' | 'forms' | 'automation';

export const WrikeWorkspaceView: React.FC = () => {
  const { tasks, indicators, activeProject, activeProjectId, projects } = useFirestore();
  const { permissions, currentUser } = useAuth();

  const [activeMode, setActiveMode] = useState<WrikeViewMode>('three-pane');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isDocumentReviewOpen, setIsDocumentReviewOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    projectId: 'ALL',
    donorCode: 'ALL',
    startDate: '',
    endDate: '',
  });

  // Filter tasks for active views
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.projectId !== 'ALL' && t.projectId !== filters.projectId) {
        return false;
      }
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesAssignee = t.assigneeName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesAssignee) return false;
      }
      if (filters.startDate) {
        const d = t.plannedStartDate || t.createdAt;
        if (d && d < filters.startDate) return false;
      }
      if (filters.endDate) {
        const d = t.plannedStartDate || t.createdAt;
        if (d && d.split('T')[0] > filters.endDate) return false;
      }
      return true;
    });
  }, [tasks, filters]);

  const modes: { id: WrikeViewMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'three-pane', label: 'Columns View', icon: Layers },
    { id: 'board', label: 'Cards Board', icon: KanbanSquare },
    { id: 'list', label: 'To-Do List', icon: List },
    { id: 'table', label: 'Grid Table', icon: TableIcon },
    { id: 'gantt', label: 'Timeline & Dates', icon: CalendarIcon },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'workload', label: 'Team Workload', icon: Users },
    { id: 'forms', label: 'Intake Forms', icon: FileText },
    { id: 'automation', label: 'Helpful Automations', icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Team Workspace
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center space-x-1">
                <Zap className="w-3 h-3 text-emerald-700" />
                <span>Multi-View</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Switch between cards, lists, tables, calendar, and team workload to see your work however you like.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDocumentReviewOpen(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition shadow-xs border border-slate-200"
            >
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>Review Attachments</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAuditOpen(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
            >
              <History className="w-4 h-4 text-emerald-400" />
              <span>Recent Activity</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('forms')}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ New To-Do</span>
            </button>
          </div>
        </div>

        {/* Wrike Tab Mode Switcher Bar */}
        <div className="flex items-center space-x-1 overflow-x-auto pt-2 border-t border-slate-100">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = activeMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMode(m.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Filter Toolbar */}
      {activeMode !== 'forms' && (
        <GlobalFilterToolbar
          filters={filters}
          onFilterChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
          onResetFilters={() =>
            setFilters({
              searchQuery: '',
              projectId: 'ALL',
              donorCode: 'ALL',
              startDate: '',
              endDate: '',
            })
          }
          projects={projects}
          placeholder="Filter workspace tasks by title, description or field officer..."
        />
      )}

      {/* Active View Container */}
      <div>
        {activeMode === 'three-pane' && <WrikeThreePaneView />}
        {activeMode === 'board' && <KanbanView />}
        {activeMode === 'list' && (
          <WrikeListView
            tasks={filteredTasks}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        )}
        {activeMode === 'table' && (
          <WrikeTableView
            tasks={filteredTasks}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        )}
        {activeMode === 'gantt' && (
          <WrikeGanttChart
            tasks={filteredTasks}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        )}
        {activeMode === 'calendar' && (
          <WrikeCalendarView
            tasks={filteredTasks}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        )}
        {activeMode === 'workload' && (
          <WrikeWorkloadView
            tasks={filteredTasks}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        )}
        {activeMode === 'forms' && <WrikeRequestForms />}
        {activeMode === 'automation' && <WrikeAiAutomationView />}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Document Review & Proofing Modal */}
      <DocumentReviewModal
        isOpen={isDocumentReviewOpen}
        onClose={() => setIsDocumentReviewOpen(false)}
      />

      {/* Activity Log Drawer */}
      <AuditLogSidebar
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        selectedProjectId={activeProjectId}
      />
    </div>
  );
};

export default WrikeWorkspaceView;
