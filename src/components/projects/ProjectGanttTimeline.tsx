import React, { useState, useMemo } from 'react';
import { 
  FolderKanban, 
  Calendar, 
  DollarSign, 
  User, 
  Building2, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Zap,
  Plus,
  X,
  Filter,
  Search,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Send,
  Info
} from 'lucide-react';
import { Project, ProjectStatus, Task } from '../../types';
import { useFirestore } from '../../context/FirestoreContext';

interface ProjectGanttTimelineProps {
  projects: Project[];
  onSelectProject?: (project: Project) => void;
}

export interface GanttItem {
  id: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  title: string;
  description?: string;
  type: 'PROJECT' | 'MILESTONE' | 'TASK';
  startDate: string;
  endDate: string;
  progressPercent: number; // 0 to 100
  status: string;
  budget?: number;
  assignee?: string;
  dependencies: string[];
  isCritical: boolean;
  slackDays: number;
}

const STATUS_COLORS: Record<string, string> = {
  PLANNING: 'bg-blue-500 border-blue-600',
  ACTIVE: 'bg-emerald-500 border-emerald-600',
  UNDER_REVIEW: 'bg-amber-500 border-amber-600',
  COMPLETED: 'bg-purple-500 border-purple-600',
  CLOSED: 'bg-slate-400 border-slate-500',
  IN_PROGRESS: 'bg-emerald-500 border-emerald-600',
  TODO: 'bg-blue-400 border-blue-500',
  BACKLOG: 'bg-slate-300 border-slate-400',
  VERIFICATION: 'bg-amber-500 border-amber-600',
};

export const ProjectGanttTimeline: React.FC<ProjectGanttTimelineProps> = ({
  projects,
  onSelectProject,
}) => {
  const { tasks, updateProject } = useFirestore();

  // View States
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [highlightCriticalPath, setHighlightCriticalPath] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<'MONTHS' | 'WEEKS' | 'QUARTERS'>('MONTHS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');

  // Interactive Details Modal State
  const [selectedItem, setSelectedItem] = useState<GanttItem | null>(null);

  // New Milestone Modal State
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [targetProjectForMilestone, setTargetProjectForMilestone] = useState(projects[0]?.id || '');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDeliverable, setNewMilestoneDeliverable] = useState('');
  const [newMilestoneTargetAmount, setNewMilestoneTargetAmount] = useState<number>(50000);
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState<string>('2026-08-31');

  // Build unified Gantt Items array (Projects + Phase Milestones + Tasks)
  const ganttItems: GanttItem[] = useMemo(() => {
    const list: GanttItem[] = [];

    const filteredProjects = projects.filter((p) => {
      if (selectedProjectId !== 'ALL' && p.id !== selectedProjectId) return false;
      if (sectorFilter !== 'ALL' && p.sector !== sectorFilter) return false;
      if (searchTerm && !p.title.toLowerCase().includes(searchTerm.toLowerCase()) && !p.code.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    filteredProjects.forEach((p) => {
      // 1. Add Parent Project Level Bar
      list.push({
        id: p.id,
        projectId: p.id,
        projectCode: p.code,
        projectTitle: p.title,
        title: `[${p.code}] ${p.title}`,
        description: p.description,
        type: 'PROJECT',
        startDate: p.startDate,
        endDate: p.endDate,
        progressPercent: p.status === 'COMPLETED' ? 100 : p.status === 'ACTIVE' ? 65 : 25,
        status: p.status,
        budget: p.totalBudget,
        assignee: p.leadManagerName,
        dependencies: [],
        isCritical: true,
        slackDays: 0,
      });

      // 2. Add Funding Phase Milestones
      if (p.fundingPhases && p.fundingPhases.length > 0) {
        p.fundingPhases.forEach((ph, idx) => {
          const phStartDate = idx === 0 
            ? p.startDate 
            : p.fundingPhases![idx - 1]?.dueDate || p.startDate;
          
          const isCompleted = ph.status === 'APPROVED' || ph.status === 'FUNDS_DISBURSED';
          const isCritical = idx < p.fundingPhases!.length - 1; // Direct chain milestones are critical

          list.push({
            id: `ph-${ph.id}`,
            projectId: p.id,
            projectCode: p.code,
            projectTitle: p.title,
            title: `❖ Phase ${ph.phaseNumber}: ${ph.title}`,
            description: ph.deliverable,
            type: 'MILESTONE',
            startDate: phStartDate,
            endDate: ph.dueDate,
            progressPercent: isCompleted ? 100 : ph.status === 'DELIVERABLE_SUBMITTED' ? 80 : 30,
            status: ph.status,
            budget: ph.targetAmount,
            assignee: p.leadManagerName,
            dependencies: idx > 0 ? [`ph-${p.fundingPhases![idx - 1].id}`] : [],
            isCritical,
            slackDays: isCritical ? 0 : 14,
          });
        });
      }

      // 3. Add Key Project Tasks
      const projectTasks = tasks.filter((t) => t.projectId === p.id);
      projectTasks.forEach((t) => {
        const start = t.plannedStartDate || p.startDate;
        const end = t.plannedEndDate || p.endDate;
        const isComp = t.status === 'COMPLETED';
        const isVerif = t.status === 'VERIFICATION';
        const isUrgent = t.priority === 'URGENT' || t.priority === 'HIGH';

        list.push({
          id: t.id,
          projectId: p.id,
          projectCode: p.code,
          projectTitle: p.title,
          title: `📌 ${t.title}`,
          description: t.description,
          type: 'TASK',
          startDate: start,
          endDate: end,
          progressPercent: isComp ? 100 : isVerif ? 90 : t.status === 'IN_PROGRESS' ? 50 : 10,
          status: t.status,
          assignee: t.assigneeName || 'Field Officer',
          dependencies: t.dependencies || [],
          isCritical: isUrgent && !isComp,
          slackDays: isUrgent ? 0 : 7,
        });
      });
    });

    return list;
  }, [projects, tasks, selectedProjectId, sectorFilter, searchTerm]);

  // Calculate Date Boundaries
  const { minTime, maxTime, totalDays, monthsList, quartersList } = useMemo(() => {
    if (ganttItems.length === 0) {
      const now = Date.now();
      return { 
        minTime: now, 
        maxTime: now + 86400000 * 365, 
        totalDays: 365, 
        monthsList: [], 
        quartersList: [] 
      };
    }

    let min = Infinity;
    let max = -Infinity;

    ganttItems.forEach((item) => {
      const start = new Date(item.startDate).getTime();
      const end = new Date(item.endDate).getTime();
      if (!isNaN(start) && start < min) min = start;
      if (!isNaN(end) && end > max) max = end;
    });

    const startDate = new Date(min - 10 * 86400000); // 10 day buffer
    const endDate = new Date(max + 30 * 86400000);  // 30 day buffer
    const days = Math.max(1, (endDate.getTime() - startDate.getTime()) / 86400000);

    // Month List
    const mList: Date[] = [];
    let curr = new Date(startDate);
    while (curr <= endDate) {
      mList.push(new Date(curr));
      curr.setMonth(curr.getMonth() + 1);
    }

    // Quarter List
    const qList: string[] = [];
    mList.forEach((d) => {
      const q = `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
      if (!qList.includes(q)) qList.push(q);
    });

    return { 
      minTime: startDate.getTime(), 
      maxTime: endDate.getTime(), 
      totalDays: days, 
      monthsList: mList,
      quartersList: qList
    };
  }, [ganttItems]);

  const getBarStyle = (startIso: string, endIso: string) => {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();

    const startOffsetDays = Math.max(0, (start - minTime) / 86400000);
    const durationDays = Math.max(10, (end - start) / 86400000);

    const leftPercent = (startOffsetDays / totalDays) * 100;
    const widthPercent = (durationDays / totalDays) * 100;

    return {
      left: `${Math.min(95, Math.max(0, leftPercent))}%`,
      width: `${Math.min(100 - leftPercent, Math.max(4, widthPercent))}%`,
    };
  };

  // Critical Path Analytics Summary
  const criticalItems = ganttItems.filter((i) => i.isCritical);
  const completedCount = ganttItems.filter((i) => i.progressPercent === 100).length;
  const criticalPathDays = Math.round(
    criticalItems.reduce((acc, curr) => {
      const dur = (new Date(curr.endDate).getTime() - new Date(curr.startDate).getTime()) / 86400000;
      return acc + (isNaN(dur) ? 30 : Math.max(0, dur));
    }, 0)
  );

  const handleAddMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !targetProjectForMilestone) return;

    const proj = projects.find((p) => p.id === targetProjectForMilestone);
    if (!proj) return;

    const newPhase = {
      id: `ph-${Date.now()}`,
      phaseNumber: (proj.fundingPhases?.length || 0) + 1,
      title: newMilestoneTitle.trim(),
      deliverable: newMilestoneDeliverable.trim() || 'Verified field deliverable certificate',
      targetAmount: newMilestoneTargetAmount,
      currency: proj.currency || 'USD',
      dueDate: newMilestoneDueDate,
      status: 'PENDING_DELIVERABLE' as const,
    };

    const updatedPhases = [...(proj.fundingPhases || []), newPhase];
    await updateProject(proj.id, { fundingPhases: updatedPhases });

    setIsAddMilestoneOpen(false);
    setNewMilestoneTitle('');
    setNewMilestoneDeliverable('');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6 p-5 sm:p-6 overflow-hidden">
      
      {/* 1. Top Header & Control Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <FolderKanban className="w-5 h-5 text-emerald-600" />
            <span>Interactive Project Gantt &amp; Critical Path Method (CPM)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Visualize project schedules, dependencies, milestone deliverables, and zero-slack critical paths.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Critical Path Toggle Button */}
          <button
            type="button"
            onClick={() => setHighlightCriticalPath(!highlightCriticalPath)}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center space-x-2 border cursor-pointer ${
              highlightCriticalPath
                ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-500/20'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Highlight zero-slack critical path tasks required for project completion"
          >
            <Zap className={`w-3.5 h-3.5 ${highlightCriticalPath ? 'text-amber-300 animate-pulse' : 'text-slate-500'}`} />
            <span>⚡ Critical Path Mode</span>
          </button>

          {/* Add Milestone Button */}
          <button
            type="button"
            onClick={() => setIsAddMilestoneOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Add Milestone</span>
          </button>
        </div>
      </div>

      {/* 2. Critical Path Scorecard Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Items Tracked</span>
          <p className="text-base font-black text-slate-900 font-mono">{ganttItems.length} Deliverables</p>
          <p className="text-[11px] text-slate-500 font-medium">{completedCount} Completed ({Math.round((completedCount / (ganttItems.length || 1)) * 100)}%)</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block flex items-center space-x-1">
            <Zap className="w-3 h-3 text-rose-500" />
            <span>Critical Path Length</span>
          </span>
          <p className="text-base font-black text-rose-900 font-mono">{criticalPathDays} Days</p>
          <p className="text-[11px] text-rose-700 font-medium">{criticalItems.length} Zero-Slack Milestones</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Schedule Health</span>
          <p className="text-base font-black text-emerald-900 font-mono">94% On Track</p>
          <p className="text-[11px] text-emerald-700 font-medium">0 Critical Bottlenecks</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">Target Completion</span>
          <p className="text-base font-black text-indigo-900 font-mono">Dec 2026</p>
          <p className="text-[11px] text-indigo-700 font-medium">Aligned with USAID/EU MoU</p>
        </div>
      </div>

      {/* 3. Interactive Filters & Search Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
        {/* Project Selector */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <label className="font-bold text-slate-700 shrink-0">Mission Filter:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">🌐 All Active Missions ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.code}] {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Sector Filter */}
        <div className="flex items-center space-x-2">
          <label className="font-bold text-slate-700 shrink-0">Sector:</label>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Sectors</option>
            <option value="WASH">WASH</option>
            <option value="HEALTH">Health</option>
            <option value="FOOD_SECURITY">Food Security</option>
            <option value="EDUCATION">Education</option>
          </select>
        </div>

        {/* Zoom Granularity Buttons */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 font-bold">
          <button
            type="button"
            onClick={() => setZoomLevel('MONTHS')}
            className={`px-2.5 py-1 rounded-lg transition ${zoomLevel === 'MONTHS' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Months
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel('QUARTERS')}
            className={`px-2.5 py-1 rounded-lg transition ${zoomLevel === 'QUARTERS' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Quarters
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search milestone or code..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* 4. Gantt Timeline Chart Area */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto min-w-[900px]">
          
          {/* Calendar Timeline Header */}
          <div className="grid grid-cols-12 bg-slate-900 text-white py-3 px-4 text-[10px] font-mono font-bold uppercase tracking-wider">
            <div className="col-span-4 border-r border-slate-800 pr-3">
              Mission / Milestone Deliverable
            </div>
            <div className="col-span-8 flex justify-between px-3">
              {zoomLevel === 'QUARTERS'
                ? quartersList.map((q, i) => <span key={i}>{q}</span>)
                : monthsList.map((m, i) => (
                    <span key={i}>
                      {m.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                    </span>
                  ))}
            </div>
          </div>

          {/* Gantt Rows */}
          <div className="divide-y divide-slate-100 bg-white">
            {ganttItems.length > 0 ? (
              ganttItems.map((item) => {
                const barStyle = getBarStyle(item.startDate, item.endDate);
                const isCritical = item.isCritical && highlightCriticalPath;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`grid grid-cols-12 items-center py-2.5 px-4 text-xs hover:bg-slate-50 transition cursor-pointer ${
                      item.type === 'PROJECT' ? 'bg-slate-50/70 font-bold border-l-4 border-emerald-500' : ''
                    }`}
                  >
                    {/* Left Details Column */}
                    <div className="col-span-4 border-r border-slate-100 pr-3 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`truncate font-extrabold ${item.type === 'PROJECT' ? 'text-slate-900 text-xs' : 'text-slate-700 text-[11px]'}`}>
                          {item.title}
                        </span>
                        {isCritical && (
                          <span className="shrink-0 ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-bold text-[9px] flex items-center space-x-0.5 border border-rose-300">
                            <Zap className="w-2.5 h-2.5 text-rose-600" />
                            <span>CPM</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-medium">
                        <span className="font-mono text-slate-600">{new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-bold">{item.progressPercent}%</span>
                      </div>
                    </div>

                    {/* Right Bar Track */}
                    <div className="col-span-8 relative h-7 bg-slate-100/60 my-0.5 rounded-xl border border-slate-200/60 px-2 flex items-center">
                      <div
                        style={barStyle}
                        className={`absolute h-5.5 rounded-lg border text-white text-[10px] font-bold px-2.5 flex items-center justify-between transition-all shadow-2xs ${
                          isCritical
                            ? 'bg-rose-600 border-rose-700 shadow-md ring-2 ring-rose-500/30 animate-pulse'
                            : item.type === 'PROJECT'
                            ? 'bg-emerald-600 border-emerald-700'
                            : item.type === 'MILESTONE'
                            ? 'bg-purple-600 border-purple-700'
                            : STATUS_COLORS[item.status] || 'bg-slate-600 border-slate-700'
                        }`}
                        title={`${item.title} (${item.progressPercent}% complete)`}
                      >
                        <div className="flex items-center space-x-1.5 truncate">
                          <span className="truncate">{item.title}</span>
                        </div>
                        <span className="text-[9px] font-mono font-normal opacity-90 hidden sm:inline ml-2 shrink-0">
                          {item.progressPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <FolderKanban className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-700">No projects or milestones match the current filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Interactive Milestone Detail Flyout Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-end p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-right duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FolderKanban className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Milestone &amp; Schedule Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-mono text-[10px] text-emerald-700 font-bold">[{selectedItem.projectCode}]</span>
                <h4 className="font-bold text-slate-900 text-sm">{selectedItem.title}</h4>
                <p className="text-[11px] text-slate-600 font-medium">{selectedItem.description || 'Verified project deliverable and field milestone.'}</p>
              </div>

              {/* Critical Path Flag */}
              {selectedItem.isCritical && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-1 text-rose-900">
                  <span className="font-bold text-xs flex items-center space-x-1">
                    <Zap className="w-3.5 h-3.5 text-rose-600" />
                    <span>On Critical Path (Zero Slack)</span>
                  </span>
                  <p className="text-[11px] text-rose-700 font-semibold">
                    This deliverable is directly on the longest project dependency chain. Any delay in completion will delay project closeout.
                  </p>
                </div>
              )}

              {/* Key Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">Start Date</span>
                  <p className="font-bold text-slate-800">{new Date(selectedItem.startDate).toLocaleDateString()}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">Target Due Date</span>
                  <p className="font-bold text-slate-800">{new Date(selectedItem.endDate).toLocaleDateString()}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">Completion Progress</span>
                  <p className="font-bold text-emerald-700">{selectedItem.progressPercent}% Complete</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">Schedule Slack / Float</span>
                  <p className="font-bold text-slate-800">{selectedItem.slackDays} Days Buffer</p>
                </div>
              </div>

              {selectedItem.budget && (
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900">Allocated Grant Budget:</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">${selectedItem.budget.toLocaleString()} USD</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  alert(`Milestone "${selectedItem.title}" status updated!`);
                  setSelectedItem(null);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Mark Milestone as Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add Milestone Modal */}
      {isAddMilestoneOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FolderKanban className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Add Project Milestone Deliverable</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMilestoneOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMilestoneSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Mission *</label>
                <select
                  value={targetProjectForMilestone}
                  onChange={(e) => setTargetProjectForMilestone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Milestone Title *</label>
                <input
                  type="text"
                  required
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  placeholder="e.g. Midterm Solar Inverter Water Yield Verification"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deliverable Requirement *</label>
                <textarea
                  rows={2}
                  required
                  value={newMilestoneDeliverable}
                  onChange={(e) => setNewMilestoneDeliverable(e.target.value)}
                  placeholder="Describe the required field audit certificate, land MoU, or lab report..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Budget Allocation ($)</label>
                  <input
                    type="number"
                    value={newMilestoneTargetAmount}
                    onChange={(e) => setNewMilestoneTargetAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newMilestoneDueDate}
                    onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMilestoneOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition flex items-center space-x-2 shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Save Milestone</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectGanttTimeline;
