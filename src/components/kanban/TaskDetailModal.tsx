import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  MapPin, 
  FileCheck2, 
  Camera, 
  Zap, 
  Calendar, 
  User, 
  Save, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Link2,
  AlertOctagon,
  Plus
} from 'lucide-react';
import { Task, Indicator, TaskStatus, TaskPriority, UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TaskDetailModalProps {
  task: Task;
  indicators: Indicator[];
  allUsers: UserProfile[];
  allTasks?: Task[];
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<{ syncedIndicator?: { code: string; title: string; increment: number } }>;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  indicators,
  allUsers,
  allTasks = [],
  onClose,
  onUpdateTask,
  onDeleteTask,
  onUpdateStatus,
}) => {
  const { permissions } = useAuth();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || '');
  const [linkedIndicatorId, setLinkedIndicatorId] = useState(task.linkedIndicatorId || '');
  const [indicatorIncrementValue, setIndicatorIncrementValue] = useState(task.indicatorIncrementValue ?? 1);
  const [plannedStartDate, setPlannedStartDate] = useState(task.plannedStartDate?.split('T')[0] || '');
  const [plannedEndDate, setPlannedEndDate] = useState(task.plannedEndDate?.split('T')[0] || '');

  // Blocked By Task Dependencies
  const [blockedBy, setBlockedBy] = useState<string[]>(
    task.blockedBy || task.dependencies || []
  );
  const [selectedBlockerToAdd, setSelectedBlockerToAdd] = useState('');

  // Field Data
  const [hasGps, setHasGps] = useState(!!task.fieldData?.gpsCoordinates);
  const [latitude, setLatitude] = useState(task.fieldData?.gpsCoordinates?.lat ?? 9.4074);
  const [longitude, setLongitude] = useState(task.fieldData?.gpsCoordinates?.lng ?? -0.8533);
  const [hasSignature, setHasSignature] = useState(!!task.fieldData?.digitalSignatureUri);
  const [photoEvidence, setPhotoEvidence] = useState<string[]>(task.fieldData?.photoUris || []);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddBlocker = () => {
    if (!selectedBlockerToAdd || blockedBy.includes(selectedBlockerToAdd)) return;
    setBlockedBy([...blockedBy, selectedBlockerToAdd]);
    setSelectedBlockerToAdd('');
  };

  const handleRemoveBlocker = (idToRemove: string) => {
    setBlockedBy(blockedBy.filter((id) => id !== idToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const selectedAssignee = allUsers.find((u) => u.id === assigneeId);

    const updates: Partial<Task> = {
      title,
      description,
      priority,
      blockedBy,
      dependencies: blockedBy,
      assigneeId: selectedAssignee ? selectedAssignee.id : undefined,
      assigneeName: selectedAssignee ? selectedAssignee.displayName : undefined,
      linkedIndicatorId: linkedIndicatorId || undefined,
      indicatorIncrementValue: linkedIndicatorId ? Number(indicatorIncrementValue) : 0,
      plannedStartDate: plannedStartDate ? new Date(plannedStartDate).toISOString() : task.plannedStartDate,
      plannedEndDate: plannedEndDate ? new Date(plannedEndDate).toISOString() : task.plannedEndDate,
      fieldData: {
        gpsCoordinates: hasGps ? { lat: latitude, lng: longitude } : undefined,
        digitalSignatureUri: hasSignature
          ? task.fieldData?.digitalSignatureUri || 'gs://milous-signatures/field_signoff_' + Date.now() + '.png'
          : undefined,
        photoUris: photoEvidence,
      },
    };

    await onUpdateTask(task.id, updates);

    // If status changed, handle status update & auto-sync trigger
    if (status !== task.status) {
      await onUpdateStatus(task.id, status);
    }

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 500);
  };

  const handleSimulateGps = () => {
    // Generate slight variance around Ghana Tamale water project coordinates
    const lat = 9.4074 + (Math.random() - 0.5) * 0.02;
    const lng = -0.8533 + (Math.random() - 0.5) * 0.02;
    setLatitude(Number(lat.toFixed(6)));
    setLongitude(Number(lng.toFixed(6)));
    setHasGps(true);
  };

  const handleAddPhotoProof = () => {
    const newProof = `gs://milous-proof/borehole_inspection_${photoEvidence.length + 1}.jpg`;
    setPhotoEvidence([...photoEvidence, newProof]);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this field task?')) {
      await onDeleteTask(task.id);
      onClose();
    }
  };

  const linkedIndicator = indicators.find((ind) => ind.id === linkedIndicatorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                priority === 'URGENT'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : priority === 'HIGH'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {priority}
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {task.id}</span>
          </div>

          <div className="flex items-center space-x-2">
            {permissions.canEditTasks && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Task Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Description &amp; Milestones</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Status, Priority & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Column</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To-Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="VERIFICATION">Verification</option>
                <option value="COMPLETED">Completed (Triggers Auto-Sync)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="">-- Select Assignee --</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Planned Start Date</label>
              <input
                type="date"
                value={plannedStartDate}
                onChange={(e) => setPlannedStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Planned Completion Date</label>
              <input
                type="date"
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* Blocked By Task Dependencies Field */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                <Link2 className="w-4 h-4 text-rose-600" />
                <span>Task Dependencies &amp; &apos;Blocked By&apos;</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {blockedBy.length} {blockedBy.length === 1 ? 'dependency' : 'dependencies'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Link tasks that must finish before this task can proceed. Blocked cards will show a dependency alert on the Kanban board.
            </p>

            {/* Linked Blockers List */}
            {blockedBy.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {blockedBy.map((blockerId) => {
                  const depTask = allTasks.find((t) => t.id === blockerId);
                  const isResolved = depTask?.status === 'COMPLETED';

                  return (
                    <div
                      key={blockerId}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                        isResolved
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0 pr-2">
                        {isResolved ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        )}
                        <span className="font-semibold truncate">
                          {depTask?.title || `Task #${blockerId}`}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            isResolved
                              ? 'bg-emerald-200 text-emerald-800'
                              : 'bg-rose-200 text-rose-800'
                          }`}
                        >
                          {depTask?.status || 'PENDING'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveBlocker(blockerId)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Remove dependency"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Blocker Dropdown + Button */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedBlockerToAdd}
                onChange={(e) => setSelectedBlockerToAdd(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="">-- Select a task to link as dependency --</option>
                {allTasks
                  .filter((t) => t.id !== task.id && !blockedBy.includes(t.id))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.status}] {t.title}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleAddBlocker}
                disabled={!selectedBlockerToAdd}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1 disabled:opacity-40 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Link Dependency</span>
              </button>
            </div>
          </div>

          {/* Core Feature 2: Task-to-Indicator Auto-Sync Configuration */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-bold text-emerald-950">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>M&amp;E LogFrame Auto-Sync Link</span>
              </div>
              {linkedIndicator && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  Current: {linkedIndicator.actualValue} / {linkedIndicator.target} {linkedIndicator.unit}
                </span>
              )}
            </div>

            <p className="text-[11px] text-emerald-800">
              When this task transitions to <strong>COMPLETED</strong>, it automatically updates the quantitative indicator count in Firestore.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1 text-[10px]">Target M&amp;E Indicator</label>
                <select
                  value={linkedIndicatorId}
                  onChange={(e) => setLinkedIndicatorId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="">-- No Indicator Link --</option>
                  {indicators.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      [{ind.code}] {ind.title} ({ind.actualValue}/{ind.target} {ind.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px]">Increment Count</label>
                <input
                  type="number"
                  min="1"
                  value={indicatorIncrementValue}
                  onChange={(e) => setIndicatorIncrementValue(Number(e.target.value))}
                  disabled={!linkedIndicatorId}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Field Operations Verification Evidence */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
              <FileCheck2 className="w-4 h-4 text-purple-600" />
              <span>Field Verification Evidence (Auditor Proof)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* GPS Coordinates */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-blue-600" />
                    <span>GPS Geotag</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={hasGps}
                    onChange={(e) => setHasGps(e.target.checked)}
                    className="accent-blue-600 cursor-pointer"
                  />
                </div>
                {hasGps ? (
                  <div>
                    <p className="text-[10px] font-mono text-slate-600">
                      {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </p>
                    <button
                      type="button"
                      onClick={handleSimulateGps}
                      className="text-[9px] text-blue-600 font-bold hover:underline mt-1"
                    >
                      Refresh GPS Fix
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSimulateGps}
                    className="w-full py-1 text-[10px] rounded bg-blue-50 text-blue-700 font-bold hover:bg-blue-100"
                  >
                    Capture Field GPS
                  </button>
                )}
              </div>

              {/* Digital Signoff */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center space-x-1">
                    <FileCheck2 className="w-3 h-3 text-purple-600" />
                    <span>Chief Sign-off</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={hasSignature}
                    onChange={(e) => setHasSignature(e.target.checked)}
                    className="accent-purple-600 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {hasSignature ? 'Digital token attached & verified' : 'No signoff record'}
                </p>
                {!hasSignature && (
                  <button
                    type="button"
                    onClick={() => setHasSignature(true)}
                    className="w-full py-1 text-[10px] rounded bg-purple-50 text-purple-700 font-bold hover:bg-purple-100"
                  >
                    Attach Signature
                  </button>
                )}
              </div>

              {/* Photo Evidence */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center space-x-1">
                    <Camera className="w-3 h-3 text-amber-600" />
                    <span>Photo Proof</span>
                  </span>
                  <span className="font-black text-slate-800 text-[10px]">
                    {photoEvidence.length} files
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddPhotoProof}
                  className="w-full py-1 text-[10px] rounded bg-amber-50 text-amber-800 font-bold hover:bg-amber-100"
                >
                  + Upload Field Photo
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Last updated: {new Date(task.updatedAt).toLocaleTimeString()}
            </span>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Task Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
