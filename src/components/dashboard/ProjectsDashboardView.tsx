import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar as CalendarIcon, 
  FileText, 
  UploadCloud, 
  Plus, 
  ChevronDown, 
  Pin,
  ChevronLeft,
  ChevronRight,
  User,
  Paperclip,
  ArrowUpRight
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';

export const ProjectsDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { projects, tasks, createProject, createTask } = useFirestore();
  const { user } = useAuth();

  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Metric counts
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;
  const overdueProjects = projects.filter((p) => p.endDate && new Date(p.endDate) < new Date()).length;
  const overdueTasks = tasks.filter((t) => t.plannedEndDate && t.status !== 'COMPLETED' && new Date(t.plannedEndDate) < new Date()).length;

  // Chart data: Projects by Status
  const statusCounts = [
    { name: 'Active', value: activeProjects || 1, color: '#10b981' },
    { name: 'Planning', value: projects.filter((p) => p.status === 'PLANNING').length, color: '#0ea5e9' },
    { name: 'Completed', value: projects.filter((p) => p.status === 'COMPLETED').length, color: '#64748b' },
  ];

  // Chart data: Projects by Team Member
  const teamData = [
    { name: 'Milou M.', count: projects.length || 1 },
    { name: 'Field Lead', count: 0 },
    { name: 'Partner', count: 0 },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const names = Array.from(files).map((f: File) => f.name);
    setUploadedFiles([...uploadedFiles, ...names]);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const names = Array.from(e.dataTransfer.files).map((f: File) => f.name);
      setUploadedFiles([...uploadedFiles, ...names]);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-1.5">
              <span>Projects dashboard</span>
              <ChevronDown className="w-4 h-4 text-slate-400 cursor-pointer" />
            </h1>
            <Pin className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">High-level overview of all team projects, schedules, and deliverables</p>
        </div>

        <div className="text-xs text-slate-500">
          Managed by <span className="font-semibold text-slate-800">{user?.displayName || 'Milou Mireku'}</span>
        </div>
      </div>

      {/* Row 1: Key Metrics - Clickable & Interactive */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => navigate('/tasks')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view all projects and tasks"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-800">Total projects</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 transition" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{totalProjects}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Click to view board →</span>
        </div>

        <div 
          onClick={() => navigate('/tasks')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view active projects"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider group-hover:text-emerald-800">Active projects</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300 group-hover:text-emerald-700 transition" />
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-2">{activeProjects}</p>
          <span className="text-[10px] text-emerald-600/70 mt-1 block">Click to view work in progress →</span>
        </div>

        <div 
          onClick={() => navigate('/calendars')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view project calendar & deadlines"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider group-hover:text-amber-800">Overdue projects</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-300 group-hover:text-amber-700 transition" />
          </div>
          <p className="text-3xl font-black text-amber-600 mt-2">{overdueProjects}</p>
          <span className="text-[10px] text-amber-600/70 mt-1 block">Click to view timelines →</span>
        </div>

        <div 
          onClick={() => navigate('/tasks')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view overdue to-dos"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider group-hover:text-rose-800">Overdue to-dos</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-300 group-hover:text-rose-700 transition" />
          </div>
          <p className="text-3xl font-black text-rose-600 mt-2">{overdueTasks}</p>
          <span className="text-[10px] text-rose-600/70 mt-1 block">Click to resolve late items →</span>
        </div>
      </div>

      {/* Row 2: Charts & Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projects by Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col h-64">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Projects by status</h3>
          <div className="flex-1 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCounts}
                  innerRadius={36}
                  outerRadius={56}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-3 text-[11px] text-slate-600 pt-1">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Active</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Planning</span>
            </span>
          </div>
        </div>

        {/* Projects by Team Member */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col h-64">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Projects by team member</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mini Calendar Widget */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col h-64">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Calendar</h3>
            <span className="text-xs text-slate-400 font-semibold">Sep 2026</span>
          </div>
          <div className="flex-1 grid grid-cols-7 text-center text-[10px] items-center gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i} className="font-bold text-slate-400">{d}</span>
            ))}
            {Array.from({ length: 30 }).map((_, i) => (
              <span
                key={i}
                className={`py-1 rounded-md ${
                  i + 1 === 12
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>

        {/* Files Dropzone */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col h-64">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Files</h3>
            <span className="text-xs text-slate-400">{uploadedFiles.length} files</span>
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={handleDropFile}
            className={`flex-1 border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center text-center transition-all ${
              isDraggingFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
            <p className="text-xs text-slate-600 font-medium">Drag and drop files here</p>
            <p className="text-[10px] text-slate-400 mt-0.5">or choose a file from your computer</p>
            <label className="mt-2 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer">
              Browse files
              <input type="file" multiple onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="pt-2 text-[10px] text-slate-500 truncate">
              Latest: {uploadedFiles[uploadedFiles.length - 1]}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Tables and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Projects Table */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Active projects</h3>
            <span className="text-xs text-slate-400">{projects.length}</span>
          </div>
          <div className="overflow-y-auto max-h-48 text-xs divide-y divide-slate-100">
            {projects.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No projects found. Create a project to track it here.
              </div>
            ) : (
              projects.map((p) => (
                <div key={p.id} className="py-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{p.title}</span>
                  <span className="px-2 py-0.5 text-[10px] rounded-full font-semibold bg-emerald-100 text-emerald-800">
                    {p.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active To-dos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Active to-dos</h3>
            <span className="text-xs text-slate-400">{tasks.length}</span>
          </div>
          <div className="overflow-y-auto max-h-48 text-xs divide-y divide-slate-100">
            {tasks.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No active to-dos right now.
              </div>
            ) : (
              tasks.slice(0, 5).map((t) => (
                <div key={t.id} className="py-2 flex items-center justify-between">
                  <span className="font-medium text-slate-800">{t.title}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Late Items */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center p-6 text-center space-y-2">
          <Clock className="w-8 h-8 text-slate-300" />
          <h4 className="text-xs font-bold text-slate-800">No late items</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All your work is on schedule.
          </p>
        </div>
      </div>
    </div>
  );
};
