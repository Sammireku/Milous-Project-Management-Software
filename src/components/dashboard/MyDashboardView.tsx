import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  Pin, 
  Plus, 
  LayoutGrid, 
  SlidersHorizontal, 
  Edit3, 
  Share2, 
  Globe, 
  MoreHorizontal, 
  GripVertical, 
  Maximize2, 
  Check, 
  CheckCircle2, 
  Circle, 
  Clock, 
  X, 
  HelpCircle,
  FolderPlus,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';
import { DashboardFilterModal, DashboardFilterParams } from './DashboardFilterModal';
import { DashboardDesignModal, DashboardDesignTheme, DEFAULT_DASHBOARD_THEME } from './DashboardDesignModal';
import { DashboardShareModal } from './DashboardShareModal';
import { DashboardPublicLinkModal } from './DashboardPublicLinkModal';
import { DashboardOptionsDropdown } from './DashboardOptionsModal';
import { DashboardHelpModal } from './DashboardHelpModal';

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'todo_count' | 'overdue_count' | 'completed_count' | 'active_projects' | 'tasks_this_week' | 'overdue_list' | 'pending_approvals';
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'w-todo', title: 'My to-do list', type: 'todo_count' },
  { id: 'w-overdue', title: 'Late items', type: 'overdue_count' },
  { id: 'w-completed', title: 'Finished work', type: 'completed_count' },
  { id: 'w-projects', title: "Projects I'm working on", type: 'active_projects' },
  { id: 'w-week', title: 'Things due this week', type: 'tasks_this_week' },
  { id: 'w-overdue-list', title: 'Late items tracker', type: 'overdue_list' },
  { id: 'w-approvals', title: 'Waiting for my approval', type: 'pending_approvals' },
];

export const MyDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, updateTask, createTask, projects, createProject, addAppNotification } = useFirestore();
  const { user, allUsers, isAdmin } = useAuth();

  // Layout mode: Horizontal vs Vertical
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);

  // Filters state
  const INITIAL_FILTERS: DashboardFilterParams = {
    assignee: 'ALL',
    location: 'ALL',
    project: 'ALL',
    priority: 'ALL',
    status: 'ALL',
  };
  const [filters, setFilters] = useState<DashboardFilterParams>(INITIAL_FILTERS);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Design theme state
  const [designTheme, setDesignTheme] = useState<DashboardDesignTheme>(() => {
    const saved = localStorage.getItem('milous_dashboard_theme');
    return saved ? JSON.parse(saved) : DEFAULT_DASHBOARD_THEME;
  });
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);

  // Share, Public Link, and Options dropdown state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPublicLinkModalOpen, setIsPublicLinkModalOpen] = useState(false);
  const [isOptionsDropdownOpen, setIsOptionsDropdownOpen] = useState(false);

  // Tabs
  const [tabs, setTabs] = useState(['Main']);
  const [activeTab, setActiveTab] = useState('Main');
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');

  // Widgets state
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem('milous_my_dashboard_widgets_v2');
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
  });

  // Drag and drop state
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);

  // Quick Inline creation
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');

  const saveWidgets = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem('milous_my_dashboard_widgets_v2', JSON.stringify(newWidgets));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedWidgetId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedWidgetId;
    if (!sourceId || sourceId === targetId) return;

    const current = [...widgets];
    const sourceIndex = current.findIndex((w) => w.id === sourceId);
    const targetIndex = current.findIndex((w) => w.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const [removed] = current.splice(sourceIndex, 1);
      current.splice(targetIndex, 0, removed);
      saveWidgets(current);
    }
    setDraggedWidgetId(null);
  };

  const removeWidget = (id: string) => {
    saveWidgets(widgets.filter((w) => w.id !== id));
  };

  const addWidget = (widget: DashboardWidget) => {
    if (!widgets.some((w) => w.id === widget.id)) {
      saveWidgets([...widgets, widget]);
    }
    setIsAddWidgetModalOpen(false);
  };

  const handleCreateNewTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabName.trim()) return;
    setTabs([...tabs, newTabName.trim()]);
    setActiveTab(newTabName.trim());
    setNewTabName('');
    setIsAddingTab(false);
  };

  // Filter application check
  const isAnyFilterActive = 
    filters.assignee !== 'ALL' ||
    filters.location !== 'ALL' ||
    filters.project !== 'ALL' ||
    filters.priority !== 'ALL' ||
    filters.status !== 'ALL';

  const filteredTasks = tasks.filter((t) => {
    if (filters.assignee !== 'ALL') {
      if (filters.assignee === 'UNASSIGNED') {
        if (t.assigneeName && t.assigneeName !== 'Unassigned') return false;
      } else if (t.assigneeName !== filters.assignee && t.assigneeId !== filters.assignee) {
        return false;
      }
    }
    if (filters.project !== 'ALL' && t.projectId !== filters.project) {
      return false;
    }
    if (filters.priority !== 'ALL' && t.priority !== filters.priority) {
      return false;
    }
    if (filters.status !== 'ALL' && t.status !== filters.status) {
      return false;
    }
    if (filters.location !== 'ALL') {
      const taskProj = projects.find((p) => p.id === t.projectId);
      if (taskProj && taskProj.location !== filters.location) {
        return false;
      }
    }
    return true;
  });

  // Metrics based on filtered tasks
  const myTasks = filteredTasks.filter((t) => t.status !== 'COMPLETED');
  const overdueTasks = filteredTasks.filter((t) => {
    if (!t.plannedEndDate || t.status === 'COMPLETED') return false;
    return new Date(t.plannedEndDate) < new Date();
  });
  const completedTasks = filteredTasks.filter((t) => t.status === 'COMPLETED');
  const reviewTasks = filteredTasks.filter((t) => t.status === 'VERIFICATION' || t.status === 'IN_PROGRESS');

  const handleApprove = (task: Task) => {
    updateTask(task.id, {
      status: 'COMPLETED',
    });
  };

  const handleCreateProjectInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await createProject({
      code: newProjectName.trim().substring(0, 6).toUpperCase(),
      title: newProjectName.trim(),
      description: 'Project in workspace',
      status: 'ACTIVE',
      country: 'General',
      location: 'Workspace',
      sector: 'GENERAL',
      leadManagerId: user?.id || 'usr-milou-01',
      leadManagerName: user?.displayName || 'Milou Mireku',
      donors: [],
      teamMemberIds: [],
      totalBudget: 10000,
      currency: 'USD',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
    });
    setNewProjectName('');
    setIsAddingProject(false);
  };

  const handleCreateTaskInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    await createTask({
      projectId: projects[0]?.id || 'default-proj',
      title: newTaskName.trim(),
      description: 'Due this week',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: user?.id || 'usr-milou-01',
      assigneeName: user?.displayName || 'Milou Mireku',
      plannedStartDate: new Date().toISOString(),
      plannedEndDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      dependencies: [],
      blockedBy: [],
    });
    setNewTaskName('');
    setIsAddingTask(false);
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Title & Sub-bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-1.5">
              <span>My dashboard</span>
              <ChevronDown className="w-4 h-4 text-slate-400 cursor-pointer" />
            </h1>
            <Pin className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <span>By {user?.displayName || 'Milou M.'}</span>
            <span>•</span>
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How do Dashboards work?</span>
            </button>
          </div>
        </div>

        {/* Toolbar row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Tabs */}
          <div className="flex items-center space-x-1.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}

            {isAddingTab ? (
              <form onSubmit={handleCreateNewTab} className="flex items-center space-x-1">
                <input
                  type="text"
                  value={newTabName}
                  onChange={(e) => setNewTabName(e.target.value)}
                  placeholder="Tab name..."
                  className="px-2 py-1 text-xs border border-slate-300 rounded-md outline-none focus:border-emerald-600 w-24"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-1 text-xs bg-emerald-600 text-white font-semibold rounded-md"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTab(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingTab(true)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Add new tab"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Change layout dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLayoutDropdownOpen(!isLayoutDropdownOpen)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                <span>Change layout</span>
              </button>

              {isLayoutDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 z-30 space-y-1 text-xs">
                  <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Select dashboard layout
                  </div>

                  <button
                    onClick={() => {
                      setLayoutMode('horizontal');
                      setIsLayoutDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg flex flex-col space-y-0.5 transition-colors ${
                      layoutMode === 'horizontal' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Horizontal layout</span>
                      {layoutMode === 'horizontal' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Widgets are organized into columns that scroll horizontally. Best for Kanban-like boards.
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setLayoutMode('vertical');
                      setIsLayoutDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg flex flex-col space-y-0.5 transition-colors ${
                      layoutMode === 'vertical' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Vertical layout</span>
                      {layoutMode === 'vertical' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Widgets are organized into rows that scroll vertically. Best for reporting and analytics.
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 1. Filter button */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`p-1.5 rounded-lg transition relative ${
                isAnyFilterActive
                  ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-300 font-bold'
                  : 'text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100'
              }`}
              title="Set dashboard parameters (assignee, location, project)"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {isAnyFilterActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
              )}
            </button>

            {/* 2. Write / Edit (Design) button */}
            <button
              onClick={() => setIsDesignModalOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
              title="Design dashboard (colors, look and feel)"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* 3. Share button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
              title="Share dashboard (Admin only: Email/WhatsApp)"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* 4. Globe / Public link button */}
            <button
              onClick={() => setIsPublicLinkModalOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
              title="Create external public link (read-only)"
            >
              <Globe className="w-4 h-4" />
            </button>

            {/* 5. Three dots dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsOptionsDropdownOpen(!isOptionsDropdownOpen)}
                className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${
                  isOptionsDropdownOpen ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="More dashboard actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              <DashboardOptionsDropdown
                isOpen={isOptionsDropdownOpen}
                onClose={() => setIsOptionsDropdownOpen(false)}
                activeTabTitle={activeTab}
                tabsCount={tabs.length}
                onRename={(newName) => {
                  const updatedTabs = tabs.map((t) => (t === activeTab ? newName : t));
                  setTabs(updatedTabs);
                  setActiveTab(newName);
                  addAppNotification({
                    category: 'project_update',
                    title: `Dashboard Renamed: ${newName}`,
                    message: `Active dashboard tab was successfully renamed to "${newName}".`,
                    severity: 'low',
                  });
                }}
                onDuplicate={() => {
                  const dupName = `${activeTab} (Copy)`;
                  setTabs([...tabs, dupName]);
                  setActiveTab(dupName);
                  addAppNotification({
                    category: 'project_update',
                    title: `Dashboard Duplicated`,
                    message: `Created duplicate tab "${dupName}" with matching widgets.`,
                    severity: 'low',
                  });
                }}
                onExportPdf={() => {
                  window.print();
                }}
                onSetAsHome={() => {
                  localStorage.setItem('milous_home_dashboard_tab', activeTab);
                  addAppNotification({
                    category: 'project_update',
                    title: `Default Dashboard Set`,
                    message: `The "${activeTab}" tab is now your primary workspace home.`,
                    severity: 'low',
                  });
                }}
                onMove={(targetSpace) => {
                  addAppNotification({
                    category: 'project_update',
                    title: `Dashboard Repositioned`,
                    message: `The "${activeTab}" dashboard was moved to "${targetSpace}".`,
                    severity: 'low',
                  });
                }}
                onDelete={() => {
                  if (tabs.length > 1) {
                    const remaining = tabs.filter((t) => t !== activeTab);
                    setTabs(remaining);
                    setActiveTab(remaining[0]);
                  } else {
                    setWidgets(DEFAULT_WIDGETS);
                    localStorage.setItem('milous_my_dashboard_widgets_v2', JSON.stringify(DEFAULT_WIDGETS));
                  }
                }}
              />
            </div>

            {/* 6. Question mark / Help button */}
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
              title="Help & Contact support"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* + Add widget green button */}
            <button
              onClick={() => setIsAddWidgetModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add widget</span>
            </button>
          </div>
        </div>

        {/* Active Filter Parameters Bar */}
        {isAnyFilterActive && (
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-emerald-950 animate-in fade-in duration-150">
            <span className="font-bold flex items-center space-x-1 text-emerald-800 text-[11px]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Active Parameters:</span>
            </span>
            {filters.assignee !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium text-[11px]">
                Assignee: {filters.assignee}
              </span>
            )}
            {filters.location !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium text-[11px]">
                Location: {filters.location}
              </span>
            )}
            {filters.project !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium text-[11px]">
                Project: {projects.find((p) => p.id === filters.project)?.code || filters.project}
              </span>
            )}
            {filters.priority !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium text-[11px]">
                Priority: {filters.priority}
              </span>
            )}
            {filters.status !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium text-[11px]">
                Status: {filters.status}
              </span>
            )}
            <button
              type="button"
              onClick={() => setFilters(INITIAL_FILTERS)}
              className="ml-auto text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Main Widgets Canvas (Horizontal or Vertical) */}
      <div
        className={`flex-1 overflow-auto pb-6 ${
          designTheme.backgroundStyle === 'subtle'
            ? 'bg-slate-50/60'
            : designTheme.backgroundStyle === 'tinted'
            ? 'bg-emerald-50/20'
            : ''
        } ${
          layoutMode === 'horizontal'
            ? 'flex space-x-4 min-w-full overflow-x-auto items-start'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
        }`}
      >
        {widgets.map((w) => (
          <div
            key={w.id}
            draggable
            onDragStart={(e) => handleDragStart(e, w.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, w.id)}
            className={`bg-white ${designTheme.cornerRadius} border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col transition-all ${
              layoutMode === 'horizontal' ? 'w-80 shrink-0 min-h-[380px]' : 'min-h-[320px]'
            } ${draggedWidgetId === w.id ? 'opacity-40 border-dashed border-emerald-500' : ''}`}
          >
            {/* Widget Top Header */}
            <div className={`px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50`}>
              <div className="flex items-center space-x-2">
                <GripVertical className="w-4 h-4 text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600" />
                <h3 
                  onClick={() => {
                    if (w.type === 'todo_count' || w.type === 'overdue_count' || w.type === 'completed_count' || w.type === 'overdue_list') navigate('/tasks');
                    else if (w.type === 'active_projects') navigate('/projects-dashboard');
                    else if (w.type === 'tasks_this_week') navigate('/calendars');
                    else if (w.type === 'pending_approvals') navigate('/timesheets');
                  }}
                  className="text-xs font-bold text-slate-900 cursor-pointer hover:text-emerald-700 flex items-center space-x-1"
                  title="Click to open section"
                >
                  <span>{w.title}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 hover:text-emerald-600" />
                </h3>
              </div>

              <div className="flex items-center space-x-1 text-slate-400">
                <button 
                  onClick={() => {
                    if (w.type === 'todo_count' || w.type === 'overdue_count' || w.type === 'completed_count' || w.type === 'overdue_list') navigate('/tasks');
                    else if (w.type === 'active_projects') navigate('/projects-dashboard');
                    else if (w.type === 'tasks_this_week') navigate('/calendars');
                    else if (w.type === 'pending_approvals') navigate('/timesheets');
                  }}
                  className="p-1 hover:text-slate-700 rounded" 
                  title="Open full page"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeWidget(w.id)}
                  className="p-1 hover:text-rose-600 rounded"
                  title="Remove widget"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Widget Body */}
            <div className="p-4 flex-1 flex flex-col text-xs text-slate-700 overflow-y-auto">
              {/* Type: todo_count */}
              {w.type === 'todo_count' && (
                <div 
                  onClick={() => navigate('/tasks')}
                  className="flex-1 flex flex-col justify-between space-y-4 cursor-pointer group"
                >
                  <div>
                    <span className="text-4xl font-black text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">{myTasks.length}</span>
                    <p className="text-xs text-slate-500 mt-1">To-dos assigned to you that are not completed</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500">Updated just now</span>
                    <span className="text-emerald-600 font-semibold group-hover:underline flex items-center space-x-0.5">
                      <span>View all to-dos</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              )}

              {/* Type: overdue_count */}
              {w.type === 'overdue_count' && (
                <div 
                  onClick={() => navigate('/tasks')}
                  className="flex-1 flex flex-col justify-between space-y-4 cursor-pointer group"
                >
                  <div>
                    <span className="text-4xl font-black text-rose-600 tracking-tight group-hover:scale-105 transition-transform inline-block">{overdueTasks.length}</span>
                    <p className="text-xs text-slate-500 mt-1">Items that passed their target finish date</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500">Target date review</span>
                    <span className="text-rose-600 font-semibold group-hover:underline flex items-center space-x-0.5">
                      <span>Resolve late items</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              )}

              {/* Type: completed_count */}
              {w.type === 'completed_count' && (
                <div 
                  onClick={() => navigate('/tasks')}
                  className="flex-1 flex flex-col justify-between space-y-4 cursor-pointer group"
                >
                  <div>
                    <span className="text-4xl font-black text-emerald-600 tracking-tight group-hover:scale-105 transition-transform inline-block">{completedTasks.length}</span>
                    <p className="text-xs text-slate-500 mt-1">Total finished tasks across all your work</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500">Good progress</span>
                    <span className="text-emerald-600 font-semibold group-hover:underline flex items-center space-x-0.5">
                      <span>100% On Track</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              )}

              {/* Type: active_projects */}
              {w.type === 'active_projects' && (
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  {projects.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-3">
                      <FolderPlus className="w-8 h-8 text-slate-300" />
                      <p className="text-xs text-slate-500">No active projects yet.</p>
                      {isAddingProject ? (
                        <form onSubmit={handleCreateProjectInline} className="w-full space-y-2">
                          <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Project name (e.g. milos)..."
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-emerald-600"
                            autoFocus
                          />
                          <div className="flex space-x-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => setIsAddingProject(false)}
                              className="px-2 py-1 text-slate-500 text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-3 py-1 bg-emerald-600 text-white rounded-md text-xs font-semibold"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setIsAddingProject(true)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          + Create project
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 divide-y divide-slate-100">
                      {projects.map((p) => (
                        <div 
                          key={p.id} 
                          onClick={() => navigate('/projects-dashboard')}
                          className="pt-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition"
                          title="Click to view project details"
                        >
                          <span className="font-semibold text-slate-900 flex items-center space-x-1">
                            <span>{p.title}</span>
                            <ArrowUpRight className="w-3 h-3 text-slate-300 hover:text-slate-600" />
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Type: tasks_this_week */}
              {w.type === 'tasks_this_week' && (
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {tasks.slice(0, 4).map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateTask(t.id, { status: t.status === 'COMPLETED' ? 'TODO' : 'COMPLETED' })}
                            className="text-slate-400 hover:text-emerald-600"
                          >
                            {t.status === 'COMPLETED' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <span className={t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'font-medium text-slate-800'}>
                            {t.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {t.status === 'COMPLETED' ? 'Finished' : 'In review'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {isAddingTask ? (
                    <form onSubmit={handleCreateTaskInline} className="pt-2 border-t border-slate-100 space-y-1.5">
                      <input
                        type="text"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        placeholder="New to-do title..."
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-emerald-600"
                        autoFocus
                      />
                      <div className="flex space-x-1.5 justify-end">
                        <button type="button" onClick={() => setIsAddingTask(false)} className="px-2 py-1 text-slate-500 text-xs">
                          Cancel
                        </button>
                        <button type="submit" className="px-3 py-1 bg-emerald-600 text-white rounded-md text-xs font-semibold">
                          Add
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => setIsAddingTask(true)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to-do</span>
                      </button>
                      <button
                        onClick={() => navigate('/calendars')}
                        className="text-[11px] text-slate-500 hover:text-emerald-700 font-medium flex items-center space-x-1"
                      >
                        <span>View timeline & dates</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Type: overdue_list */}
              {w.type === 'overdue_list' && (
                <div 
                  onClick={() => navigate('/tasks')}
                  className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-rose-300 group-hover:text-rose-600 transition">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 group-hover:text-rose-700 transition">Nothing to show... yet!</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs">
                    All deadlines are currently under control. Click to inspect full to-do lists.
                  </p>
                  <span className="text-xs text-emerald-600 font-semibold group-hover:underline flex items-center space-x-1 pt-1">
                    <span>Inspect to-do list</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              )}

              {/* Type: pending_approvals */}
              {w.type === 'pending_approvals' && (
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {reviewTasks.slice(0, 3).map((t) => (
                      <div key={t.id} className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center">
                              MM
                            </span>
                            <span className="font-medium text-slate-900">{t.title}</span>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            In review
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span className="text-slate-500">Sign-off required</span>
                          <button
                            onClick={() => handleApprove(t)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold flex items-center space-x-1 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {reviewTasks.length === 0 && (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No pending approvals right now. Everything is signed off!
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => navigate('/timesheets')}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
                    >
                      <span>Open Timesheets approval page</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Parameters Modal */}
      <DashboardFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        projects={projects}
        allUsers={allUsers}
        filters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
        }}
      />

      {/* Dashboard Look & Feel Design Modal */}
      <DashboardDesignModal
        isOpen={isDesignModalOpen}
        onClose={() => setIsDesignModalOpen(false)}
        currentTheme={designTheme}
        onSaveTheme={(newTheme) => {
          setDesignTheme(newTheme);
          localStorage.setItem('milous_dashboard_theme', JSON.stringify(newTheme));
          addAppNotification({
            category: 'project_update',
            title: 'Dashboard Theme Applied',
            message: `Updated dashboard accent to ${newTheme.primaryColor} with ${newTheme.cornerRadius} styling.`,
            severity: 'low',
          });
        }}
      />

      {/* Share Dashboard Modal */}
      <DashboardShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        allUsers={allUsers}
        currentUser={user}
        isAdmin={isAdmin}
        activeTabTitle={activeTab}
        onSendInvite={(channel, target, recipientName) => {
          addAppNotification({
            category: 'project_update',
            title: `Dashboard Shared via ${channel.toUpperCase()}`,
            message: `Dispatched direct dashboard invite to ${target}.`,
            severity: 'low',
          });
        }}
      />

      {/* External Public Link Modal */}
      <DashboardPublicLinkModal
        isOpen={isPublicLinkModalOpen}
        onClose={() => setIsPublicLinkModalOpen(false)}
        activeTabTitle={activeTab}
      />

      {/* Help & Contact / Chat Modal */}
      <DashboardHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        currentUser={user}
        onSendMessage={(subject, message) => {
          addAppNotification({
            category: 'inbound_message',
            title: `Support Ticket Dispatched: ${subject}`,
            message: `Your inquiry has been submitted to the operations desk. We will respond promptly.`,
            severity: 'medium',
          });
        }}
      />

      {/* Add Widget Modal */}
      {isAddWidgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add a widget</h3>
              <button onClick={() => setIsAddWidgetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {DEFAULT_WIDGETS.map((dw) => {
                const isAlreadyAdded = widgets.some((w) => w.id === dw.id);
                return (
                  <button
                    key={dw.id}
                    disabled={isAlreadyAdded}
                    onClick={() => addWidget(dw)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isAlreadyAdded
                        ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-2xs cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{dw.title}</span>
                      {isAlreadyAdded ? (
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {isAlreadyAdded ? 'Already on board' : 'Click to add to dashboard'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
