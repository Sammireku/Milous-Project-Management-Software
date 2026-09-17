import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Calendar, 
  FolderKanban, 
  User, 
  Check, 
  X, 
  Filter, 
  FileSpreadsheet, 
  Sparkles, 
  Send,
  Building,
  DollarSign
} from 'lucide-react';
import { useFirestore } from '../context/FirestoreContext';
import { useAuth } from '../context/AuthContext';
import { TimesheetEntry } from '../types/schema';
import { VoiceDictationButton } from '../components/common/VoiceDictationButton';

export const TimesheetsPage: React.FC = () => {
  const { 
    timesheets, 
    addTimesheet, 
    updateTimesheetStatus, 
    advanceTimesheetApproval, 
    projects, 
    tasks 
  } = useFirestore();
  const { user, isAdmin, isProjectManager, isCEO } = useAuth();

  const isApprover = isAdmin || isProjectManager || isCEO || user?.role === 'finance_officer';

  // New entry form state
  const [isAdding, setIsAdding] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [hours, setHours] = useState('8');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activityCategory, setActivityCategory] = useState('Field M&E Verification');
  const [description, setDescription] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LEVEL_1_PENDING' | 'LEVEL_2_PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'>('ALL');
  const [reviewNotes, setReviewNotes] = useState<{ [id: string]: string }>({});
  const [viewHistoryId, setViewHistoryId] = useState<string | null>(null);

  const projectTasks = tasks.filter(t => !selectedProjectId || t.projectId === selectedProjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const project = projects.find(p => p.id === selectedProjectId);
    const task = tasks.find(t => t.id === selectedTaskId);

    const newEntry = {
      userId: user?.id || 'demo-user',
      userName: user?.displayName || 'M&E Specialist',
      userRole: user?.role || 'me_officer',
      projectId: selectedProjectId,
      projectTitle: project?.title || 'General Field Mission',
      taskId: selectedTaskId || undefined,
      taskTitle: task?.title || 'Field Data Monitoring & Evaluation',
      date,
      hours: parseFloat(hours) || 8,
      activityCategory,
      description: description.trim(),
      status: 'LEVEL_1_PENDING' as const,
    };

    addTimesheet(newEntry);
    setDescription('');
    setIsAdding(false);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 4000);
  };

  const handleWorkflowAction = (tsId: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES') => {
    const comments = reviewNotes[tsId] || '';
    advanceTimesheetApproval(
      tsId, 
      action, 
      user?.displayName || 'Approver', 
      user?.role?.toUpperCase() || 'MANAGER', 
      comments
    );
    // Clear comment input
    setReviewNotes(prev => {
      const updated = { ...prev };
      delete updated[tsId];
      return updated;
    });
  };

  // Filtered timesheets
  const filteredTimesheets = timesheets.filter(t => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  // Aggregated Stats
  const totalHours = timesheets.reduce((acc, curr) => acc + (curr.hours || 0), 0);
  const pmPendingHours = timesheets.filter(t => t.status === 'LEVEL_1_PENDING').reduce((acc, curr) => acc + (curr.hours || 0), 0);
  const finPendingHours = timesheets.filter(t => t.status === 'LEVEL_2_PENDING').reduce((acc, curr) => acc + (curr.hours || 0), 0);
  const approvedHours = timesheets.filter(t => t.status === 'APPROVED').reduce((acc, curr) => acc + (curr.hours || 0), 0);

  const pmPendingCount = timesheets.filter(t => t.status === 'LEVEL_1_PENDING').length;
  const finPendingCount = timesheets.filter(t => t.status === 'LEVEL_2_PENDING').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                M&amp;E &amp; Team Timesheets
              </h1>
              <p className="text-xs text-slate-500">
                Log field monitoring hours and submit for Project Manager approval &amp; grant reconciliation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Close Timesheet Form' : '+ Log Field Hours'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center space-x-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Timesheet successfully logged and routed to Project Manager for verification!</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Hours Logged</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{totalHours}</span>
            <span className="text-xs font-semibold text-slate-500">hrs</span>
          </div>
          <span className="text-[10px] text-slate-400">All submissions</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/10 shadow-xs">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Level 1: PM Pending</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-amber-800">{pmPendingHours}</span>
            <span className="text-xs font-semibold text-amber-700">hrs ({pmPendingCount} entries)</span>
          </div>
          <span className="text-[10px] text-amber-600 font-medium">Requires PM review</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/10 shadow-xs">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Level 2: Finance Pending</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-blue-800">{finPendingHours}</span>
            <span className="text-xs font-semibold text-blue-700">hrs ({finPendingCount} entries)</span>
          </div>
          <span className="text-[10px] text-blue-600 font-medium">Requires Finance sign-off</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/10 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Approved &amp; Disbursed</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-800">{approvedHours}</span>
            <span className="text-xs font-semibold text-emerald-700">hrs</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Eligible for grant billing</span>
        </div>
      </div>

      {/* Log Timesheet Modal/Form */}
      {isAdding && (
        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-lg animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">New Timesheet Submission</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Project select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Project / Mission
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Assigned Deliverable / Task
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">General Project Operations</option>
                  {projectTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activity category */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  M&amp;E Activity Category
                </label>
                <select
                  value={activityCategory}
                  onChange={(e) => setActivityCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Field M&E Verification">Field M&amp;E Verification</option>
                  <option value="Community Household Survey">Community Household Survey</option>
                  <option value="Water Quality & Technical Testing">Water Quality &amp; Technical Testing</option>
                  <option value="Vendor Deliverable Inspection">Vendor Deliverable Inspection</option>
                  <option value="Donor Milestone Reporting">Donor Milestone Reporting</option>
                  <option value="Stakeholder Consultation">Stakeholder Consultation</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Date of Work
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Hours */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Hours Spent
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Description with Voice Dictation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Field Activities Completed &amp; Deliverable Evidence
                </label>
                <VoiceDictationButton
                  onAppendText={(dictated) => {
                    setDescription((prev) => (prev ? `${prev} ${dictated}` : dictated));
                  }}
                  label="Dictate Field Report"
                  size="sm"
                />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the specific indicators measured, GPS coordinates verified, community members interviewed, or milestone inspections completed..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-20"
                required
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit to Project Manager</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Timesheets Table with Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Filter Status:</span>
            <div className="flex flex-wrap gap-1">
              {([
                { key: 'ALL', label: 'All' },
                { key: 'LEVEL_1_PENDING', label: 'PM Pending (L1)' },
                { key: 'LEVEL_2_PENDING', label: 'Finance Pending (L2)' },
                { key: 'APPROVED', label: 'Approved' },
                { key: 'CHANGES_REQUESTED', label: 'Changes Requested' },
                { key: 'REJECTED', label: 'Rejected' },
              ] as const).map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setStatusFilter(st.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    statusFilter === st.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredTimesheets.length}</strong> timesheet entries
          </div>
        </div>

        {/* Entries List */}
        <div className="divide-y divide-slate-100">
          {filteredTimesheets.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">No timesheet records found for this filter.</p>
              <p className="text-[11px] text-slate-400">Click &ldquo;+ Log Field Hours&rdquo; to submit your work hours.</p>
            </div>
          ) : (
            filteredTimesheets.map((entry) => {
              // Determine if current logged-in user is the active assigned approver
              const isPMStep = entry.status === 'LEVEL_1_PENDING' || !entry.status; // fallback
              const isFinStep = entry.status === 'LEVEL_2_PENDING';
              
              const userCanApprove = 
                (isPMStep && (isProjectManager || isAdmin || isCEO)) ||
                (isFinStep && (user?.role === 'finance_officer' || isAdmin || isCEO));

              const activeRoleLabel = isPMStep ? 'Operations Lead / PM' : isFinStep ? 'Finance Officer' : 'Closed';

              return (
                <div key={entry.id} className="p-5 sm:p-6 hover:bg-slate-50/40 transition flex flex-col gap-5">
                  
                  {/* Row Top Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Submitter details */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{entry.userName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase font-semibold">
                          {entry.userRole?.replace('_', ' ')}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{entry.date}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                          {entry.hours} Hours
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 font-medium flex items-center space-x-2">
                        <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{entry.projectTitle}</span>
                        {entry.taskTitle && (
                          <>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-500 truncate">{entry.taskTitle}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stepper Status Progress */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {/* Step 1: Submission */}
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium ml-1">Submitted</span>
                      </div>
                      
                      <span className="text-slate-300">➔</span>

                      {/* Step 2: PM level */}
                      <div className="flex items-center">
                        {entry.status === 'LEVEL_1_PENDING' ? (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold animate-pulse">
                            1
                          </div>
                        ) : entry.status === 'LEVEL_2_PENDING' || entry.status === 'APPROVED' ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </div>
                        ) : entry.status === 'REJECTED' || entry.status === 'CHANGES_REQUESTED' ? (
                          <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">
                            ✕
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                            1
                          </div>
                        )}
                        <span className={`text-[10px] font-medium ml-1 ${
                          entry.status === 'LEVEL_1_PENDING' ? 'text-amber-600 font-bold' : 'text-slate-500'
                        }`}>PM L1</span>
                      </div>

                      <span className="text-slate-300">➔</span>

                      {/* Step 3: Finance level */}
                      <div className="flex items-center">
                        {entry.status === 'LEVEL_2_PENDING' ? (
                          <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold animate-pulse">
                            2
                          </div>
                        ) : entry.status === 'APPROVED' ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                            2
                          </div>
                        )}
                        <span className={`text-[10px] font-medium ml-1 ${
                          entry.status === 'LEVEL_2_PENDING' ? 'text-blue-600 font-bold' : 'text-slate-500'
                        }`}>Finance L2</span>
                      </div>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="space-y-2">
                    <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                      <strong className="text-slate-900 font-semibold">{entry.activityCategory}: </strong>
                      {entry.description}
                    </div>

                    {/* Dynamic Status / Assignee Information banner */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50/60 rounded-xl border border-slate-200/50">
                      <div className="flex items-center space-x-1.5 text-xs">
                        {entry.status === 'APPROVED' ? (
                          <span className="flex items-center text-emerald-700 font-bold">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Fully Approved &amp; Disbursed
                          </span>
                        ) : entry.status === 'LEVEL_1_PENDING' ? (
                          <span className="flex items-center text-amber-700 font-semibold">
                            <Clock className="w-4 h-4 mr-1 text-amber-500 animate-pulse" /> Awaiting Level 1: Project Manager Technical Verification
                          </span>
                        ) : entry.status === 'LEVEL_2_PENDING' ? (
                          <span className="flex items-center text-blue-700 font-semibold">
                            <Clock className="w-4 h-4 mr-1 text-blue-500 animate-pulse" /> Awaiting Level 2: Finance Payroll Authorization
                          </span>
                        ) : entry.status === 'CHANGES_REQUESTED' ? (
                          <span className="flex items-center text-amber-700 font-semibold">
                            <AlertCircle className="w-4 h-4 mr-1 text-amber-500" /> Changes Requested (Needs Submitter Update)
                          </span>
                        ) : (
                          <span className="flex items-center text-rose-700 font-semibold">
                            <XCircle className="w-4 h-4 mr-1" /> Request Rejected / Closed
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setViewHistoryId(viewHistoryId === entry.id ? null : entry.id)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline shrink-0 cursor-pointer"
                      >
                        {viewHistoryId === entry.id ? 'Hide Approval History' : 'View Approval History Log (' + (entry.approvalHistory?.length || 0) + ')'}
                      </button>
                    </div>
                  </div>

                  {/* Approval steps detail list */}
                  {viewHistoryId === entry.id && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3 animate-in slide-in-from-top-1">
                      <p className="font-bold text-slate-800 mb-1">Approval Flow Step History:</p>
                      {entry.approvalHistory && entry.approvalHistory.length > 0 ? (
                        <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                          {entry.approvalHistory.map((step, idx) => (
                            <div key={idx} className="pl-6 relative">
                              <div className="absolute left-[3px] top-[4px] w-2.5 h-2.5 rounded-full bg-slate-400 border border-white ring-2 ring-slate-100" />
                              <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <span className="font-bold text-slate-700">{step.stepName}</span>
                                <span>{new Date(step.timestamp).toLocaleString()}</span>
                              </div>
                              <p className="font-medium text-slate-600 mt-0.5">
                                Action: <strong className={`font-black ${
                                  step.action === 'APPROVED' || step.action === 'SUBMITTED' ? 'text-emerald-600' : step.action === 'CHANGES_REQUESTED' ? 'text-amber-600' : 'text-rose-600'
                                }`}>{step.action}</strong> by {step.approverName} ({step.approverRole})
                              </p>
                              {step.comments && (
                                <p className="text-slate-500 italic mt-0.5 bg-white p-1.5 rounded-md border border-slate-100">&ldquo;{step.comments}&rdquo;</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500">No step history has been logged for this timesheet yet.</p>
                      )}
                    </div>
                  )}

                  {/* Active Approver Actions Interface */}
                  {userCanApprove && (entry.status === 'LEVEL_1_PENDING' || entry.status === 'LEVEL_2_PENDING') && (
                    <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900">
                          ⚡ Approver Action Center (Authorized for: {activeRoleLabel})
                        </span>
                        <span className="text-[10px] font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase font-bold">
                          Step {entry.status === 'LEVEL_1_PENDING' ? '1 of 2' : '2 of 2'}
                        </span>
                      </div>

                      <div>
                        <textarea
                          placeholder="Provide approval comments, payroll notes, or detail required modifications..."
                          value={reviewNotes[entry.id] || ''}
                          onChange={(e) => setReviewNotes(prev => ({ ...prev, [entry.id]: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-14"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleWorkflowAction(entry.id, 'REQUEST_CHANGES')}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Request Changes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWorkflowAction(entry.id, 'REJECT')}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject Submission</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWorkflowAction(entry.id, 'APPROVE')}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve &amp; Advance Step</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
