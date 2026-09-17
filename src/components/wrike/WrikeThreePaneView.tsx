import React, { useState, useMemo } from 'react';
import { 
  FolderKanban, 
  Building2, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  User, 
  Tag, 
  Plus, 
  Calendar, 
  Sparkles, 
  MessageSquare, 
  Play, 
  Pause, 
  FileText, 
  Paperclip, 
  Layers, 
  Search, 
  Zap, 
  Flame, 
  ListTodo, 
  Send,
  SlidersHorizontal,
  FolderTree
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskPriority, TaskStatus, Project } from '../../types';

export const WrikeThreePaneView: React.FC = () => {
  const { tasks, projects, activeProject, updateTaskStatus, createTask } = useFirestore();
  const { currentUser } = useAuth();

  // Navigation State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedItemTypeFilter, setSelectedItemTypeFilter] = useState<string>('ALL');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(tasks[0]?.id || null);

  // Time Logger State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [logHoursInput, setLogHoursInput] = useState<string>('');
  const [logNoteInput, setLogNoteInput] = useState<string>('');

  // Subtask Input
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Comment Input
  const [newCommentText, setNewCommentText] = useState('');

  // Proofing Markup Input
  const [markupText, setMarkupText] = useState('');
  const [selectedMarkupPos, setSelectedMarkupPos] = useState<{ x: number; y: number } | null>(null);

  // Active Task
  const activeTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || tasks[0] || null;
  }, [tasks, selectedTaskId]);

  // Center Pane Filtered Tasks
  const centerTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedProjectId !== 'ALL' && t.projectId !== selectedProjectId) return false;
      if (selectedItemTypeFilter !== 'ALL' && (t.customItemType || 'Task') !== selectedItemTypeFilter) return false;
      return true;
    });
  }, [tasks, selectedProjectId, selectedItemTypeFilter]);

  // Timer interval effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim() || !activeTask) return;
    const subtask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    activeTask.subtasks = [...(activeTask.subtasks || []), subtask];
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subId: string) => {
    if (!activeTask || !activeTask.subtasks) return;
    activeTask.subtasks = activeTask.subtasks.map((st) =>
      st.id === subId ? { ...st, completed: !st.completed } : st
    );
  };

  const handleAddComment = () => {
    if (!newCommentText.trim() || !activeTask) return;
    const comment = {
      id: `cmt-${Date.now()}`,
      userId: currentUser?.id || 'usr-01',
      userName: currentUser?.displayName || 'Ama Osei',
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };
    activeTask.comments = [...(activeTask.comments || []), comment];
    setNewCommentText('');
  };

  const handleLogTime = () => {
    const hrs = parseFloat(logHoursInput);
    if (isNaN(hrs) || hrs <= 0 || !activeTask) return;
    const log = {
      id: `log-${Date.now()}`,
      userId: currentUser?.id || 'usr-01',
      userName: currentUser?.displayName || 'Ama Osei',
      hours: hrs,
      note: logNoteInput.trim() || 'Work session',
      date: new Date().toISOString().split('T')[0],
    };
    activeTask.timeLogs = [...(activeTask.timeLogs || []), log];
    setLogHoursInput('');
    setLogNoteInput('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-[820px] flex flex-col">
      {/* Header Bar */}
      <div className="p-3.5 px-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Wrike Three-Pane Central Workstation</span>
              <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                Drill-Down Architecture
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Left: Workspaces &amp; Custom Item Trees • Center: Activity Stream • Right: Details, Proofing &amp; Time Log
            </p>
          </div>
        </div>

        {/* Custom Item Type Filter Pills */}
        <div className="hidden lg:flex items-center space-x-1.5 text-xs">
          <span className="text-slate-400 text-[11px] font-bold">Item Type:</span>
          {['ALL', 'Task', 'Campaign', 'Support Ticket', 'Field Inspection', 'Audit'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedItemTypeFilter(type)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                selectedItemTypeFilter === type
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-Pane Grid Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 divide-x divide-slate-200 overflow-hidden">
        
        {/* PANE 1: LEFT NAV TREE (3 Cols) */}
        <div className="md:col-span-3 bg-slate-50/70 p-4 space-y-4 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center space-x-1.5">
              <FolderTree className="w-3.5 h-3.5 text-emerald-600" />
              <span>Folders &amp; Missions</span>
            </h4>
            <span className="text-[10px] font-mono font-bold bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
              {projects.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedProjectId('ALL')}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
              selectedProjectId === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Building2 className={`w-4 h-4 ${selectedProjectId === 'ALL' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>All Workspaces &amp; Grants</span>
            </div>
            <span className="text-[10px] font-mono font-bold">{tasks.length}</span>
          </button>

          <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
            {projects.map((proj) => {
              const projTasks = tasks.filter((t) => t.projectId === proj.id);
              const isSelected = selectedProjectId === proj.id;

              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition space-y-1 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/10'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.2 bg-slate-900 text-emerald-400 rounded">
                      {proj.code}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">{projTasks.length} items</span>
                  </div>
                  <p className="truncate text-xs font-bold leading-snug">{proj.title}</p>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                    <span>{proj.sector}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">${proj.totalBudget.toLocaleString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PANE 2: CENTER TASK STREAM (4 Cols) */}
        <div className="md:col-span-4 bg-white p-4 space-y-3 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center space-x-1.5">
              <ListTodo className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active Work Items ({centerTasks.length})</span>
            </h4>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {centerTasks.map((t) => {
              const isSelected = activeTask?.id === t.id;
              const subtaskCount = t.subtasks?.length || 0;
              const completedSubtasks = t.subtasks?.filter((s) => s.completed).length || 0;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTaskId(t.id)}
                  className={`p-3.5 rounded-xl border text-xs transition cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white border-slate-200/90 text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                        isSelected
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.customItemType || 'Task'}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        t.priority === 'URGENT'
                          ? 'bg-rose-500 text-white'
                          : t.priority === 'HIGH'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <h5 className="font-bold text-xs leading-snug line-clamp-2">{t.title}</h5>

                  <div className="flex items-center justify-between text-[10px] pt-1 opacity-90">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span className="truncate">{t.assigneeName || 'Field Team'}</span>
                    </div>
                    {subtaskCount > 0 && (
                      <span className="font-mono font-bold">
                        Subtasks {completedSubtasks}/{subtaskCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANE 3: RIGHT DETAIL & PROOFING WORKSPACE (5 Cols) */}
        <div className="md:col-span-5 bg-slate-50/50 p-5 space-y-5 overflow-y-auto flex flex-col">
          {activeTask ? (
            <>
              {/* Task Header & Quick Status Change */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {activeTask.customItemType || 'Task Work Item'}
                  </span>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-bold text-slate-500">Status:</span>
                    <select
                      value={activeTask.status}
                      onChange={(e) => updateTaskStatus(activeTask.id, e.target.value as TaskStatus)}
                      className="bg-slate-100 font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 cursor-pointer"
                    >
                      <option value="BACKLOG">Backlog</option>
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="VERIFICATION">Field Verification</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>

                <h2 className="text-base font-extrabold text-slate-900">{activeTask.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed">{activeTask.description}</p>
              </div>

              {/* Built-in Time Tracker Widget */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Built-In Direct Task Time Tracker</span>
                  </h4>
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    {formatTimer(timerSeconds)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                      isTimerRunning
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isTimerRunning ? 'Pause Timer' : 'Start Live Timer'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsTimerRunning(false);
                      setTimerSeconds(0);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    Reset
                  </button>
                </div>

                <div className="flex items-center space-x-2 pt-1 text-xs">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Hrs (e.g. 2.5)"
                    value={logHoursInput}
                    onChange={(e) => setLogHoursInput(e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Session work note..."
                    value={logNoteInput}
                    onChange={(e) => setLogNoteInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleLogTime}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
                  >
                    Log Time
                  </button>
                </div>

                {/* Logged Hours Summary */}
                {activeTask.timeLogs && activeTask.timeLogs.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px]">
                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Logged Work History ({activeTask.timeLogs.reduce((acc, l) => acc + l.hours, 0)} Total Hrs)
                    </p>
                    {activeTask.timeLogs.map((log) => (
                      <div key={log.id} className="flex justify-between text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100">
                        <span>{log.userName}: {log.note}</span>
                        <span className="font-bold text-emerald-800">{log.hours} hrs</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtasks Section */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-3 shadow-xs">
                <h4 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Subtask Checklist &amp; Action Items</span>
                </h4>

                <div className="space-y-2 text-xs">
                  {(activeTask.subtasks || []).map((st) => (
                    <div
                      key={st.id}
                      onClick={() => handleToggleSubtask(st.id)}
                      className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition border border-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className={`font-medium ${st.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {st.title}
                      </span>
                    </div>
                  ))}

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      placeholder="+ Add new subtask..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Integrated Proofing & Document Attachments */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-3 shadow-xs">
                <h4 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                  <Paperclip className="w-4 h-4 text-emerald-600" />
                  <span>Integrated Proofing &amp; Versioned Attachments</span>
                </h4>

                <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-emerald-400">
                    <span>Field_Site_Inspection_Report_v2.pdf</span>
                    <span>Version 2.0 (Active)</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg text-slate-300 text-[11px] font-mono leading-relaxed relative cursor-crosshair border border-slate-700">
                    <p>[Site Image Proof Preview]</p>
                    <p className="text-slate-400 mt-1">Borehole depth verified at 45m. Water purity sample #GH-882 attached.</p>
                    <span className="absolute top-2 right-2 bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 text-[9px] rounded-full">
                      Markup Pin #1
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Click document preview to add visual markups &amp; threaded proof feedback.
                  </p>
                </div>
              </div>

              {/* Activity Comments */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-3 shadow-xs">
                <h4 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Threaded Team Comments</span>
                </h4>

                <div className="space-y-2 max-h-40 overflow-y-auto text-xs pr-1">
                  {(activeTask.comments || [
                    {
                      id: 'c1',
                      userId: 'u1',
                      userName: 'Kofi Mensah',
                      text: 'GPS site verification completed. Equipment delivered to sector B.',
                      createdAt: new Date().toISOString(),
                    },
                  ]).map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                        <span>{c.userName}</span>
                        <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-800 font-medium text-xs">{c.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-2 text-xs pt-1">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-bold">
              Select a task from center pane to inspect details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WrikeThreePaneView;
