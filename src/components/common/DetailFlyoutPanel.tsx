import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  User, 
  Calendar, 
  Building2, 
  DollarSign, 
  Paperclip, 
  MessageSquare, 
  Layers, 
  Plus, 
  Send, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Tag, 
  Share2, 
  Edit3,
  Search,
  Mail,
  Phone,
  Check
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { FieldOfficerVoiceRecorder } from '../tasks/FieldOfficerVoiceRecorder';

export const DetailFlyoutPanel: React.FC = () => {
  const { selectedFlyoutItem, closeFlyout, updateTaskStatus, updateExpenseStatus, updateTask, addAppNotification } = useFirestore();
  const { currentUser, allUsers } = useAuth();
  
  // Reassign state
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<Array<{ id: string; user: string; text: string; date: string; isVoiceVerified?: boolean }>>([
    {
      id: 'c-01',
      user: 'Ama Osei (Project Manager)',
      text: 'Verified field implementation logs against USAID compliance checklist.',
      date: '2 hours ago',
    },
    {
      id: 'voice-01',
      user: 'Ibrahim Tanko (Field Lead)',
      text: 'Borehole site #4 reached gravel aquifer at 58m. Static water level measured at 12.4m.',
      date: '1 hour ago',
      isVoiceVerified: true,
    },
  ]);

  if (!selectedFlyoutItem) return null;

  const { type, item } = selectedFlyoutItem;

  const handleVoicePostUpdate = (note: string, isVoiceVerified: boolean) => {
    setCommentsList((prev) => [
      ...prev,
      {
        id: `voice-${Date.now()}`,
        user: `${currentUser?.displayName || 'Ibrahim Tanko (Field Lead)'}`,
        text: note,
        date: 'Just now',
        isVoiceVerified,
      },
    ]);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentsList((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        user: currentUser?.displayName || 'Ama Osei',
        text: commentText,
        date: 'Just now',
      },
    ]);
    setCommentText('');
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between">
        <div className="flex items-center space-x-2 truncate pr-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-900 text-white">
            {type} Detail
          </span>
          <span className="text-xs font-bold text-slate-500 truncate">
            ID: {item.id || item.code}
          </span>
        </div>

        <button
          type="button"
          onClick={closeFlyout}
          className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
        {/* Title & Primary Metadata */}
        <div className="space-y-2">
          <h2 className="text-lg font-black text-slate-900 leading-snug">
            {item.title || item.description || `Record #${item.id}`}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            {item.status && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold font-mono text-[11px]">
                {item.status}
              </span>
            )}
            {item.customItemType && (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-[11px]">
                {item.customItemType}
              </span>
            )}
            {item.donorCode && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-[11px]">
                {item.donorCode}
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Controls */}
        {type === 'task' && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="font-bold text-slate-700 block text-[11px]">Quick Status Transition</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateTaskStatus(item.id, 'IN_PROGRESS')}
                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-center transition"
              >
                Mark In Progress
              </button>
              <button
                type="button"
                onClick={() => updateTaskStatus(item.id, 'COMPLETED')}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center transition"
              >
                Mark Completed
              </button>
            </div>
          </div>
        )}

        {type === 'expense' && (
          <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2">
            <span className="font-bold text-amber-900 block text-[11px]">Voucher Sign-Off</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateExpenseStatus(item.id, 'APPROVED')}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center transition"
              >
                Approve Voucher
              </button>
              <button
                type="button"
                onClick={() => updateExpenseStatus(item.id, 'REJECTED')}
                className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-center transition"
              >
                Reject Voucher
              </button>
            </div>
          </div>
        )}

        {/* Structured Details Matrix */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
          <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block border-b border-slate-200/80 pb-1.5">
            Metadata Matrix
          </span>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium block">Lead / Assignee</span>
                {type === 'task' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAssignee(!isEditingAssignee);
                      setSelectedUser(null);
                      setAssigneeSearch('');
                    }}
                    className="text-[10px] text-emerald-600 font-bold hover:underline"
                  >
                    {isEditingAssignee ? 'Cancel' : 'Change'}
                  </button>
                )}
              </div>
              <p className="font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{item.assigneeName || item.submittedByName || 'Unassigned'}</span>
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-medium block">Target Date</span>
              <p className="font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{item.plannedEndDate || item.dateIncurred || '2026-09-30'}</span>
              </p>
            </div>

            {item.totalAmount && (
              <div>
                <span className="text-slate-400 font-medium block">Voucher Amount</span>
                <p className="font-black text-slate-900 mt-0.5">
                  ${item.totalAmount.toLocaleString()} {item.currency || 'USD'}
                </p>
              </div>
            )}

            {item.totalBudget && (
              <div>
                <span className="text-slate-400 font-medium block">Total Allocation</span>
                <p className="font-black text-slate-900 mt-0.5">
                  ${item.totalBudget.toLocaleString()} USD
                </p>
              </div>
            )}
          </div>

          {/* Reassign Team Member Flow for Tasks */}
          {type === 'task' && isEditingAssignee && (
            <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200 shadow-sm space-y-2.5">
              <span className="text-[11px] font-bold text-slate-800 block">
                Assign or Change Team Member (Optional)
              </span>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={assigneeSearch}
                  onChange={(e) => setAssigneeSearch(e.target.value)}
                  placeholder="Search team member..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div className="max-h-32 overflow-y-auto space-y-1 divide-y divide-slate-50">
                <button
                  type="button"
                  onClick={() => setSelectedUser({ id: '', name: 'Unassigned' })}
                  className={`w-full text-left p-1.5 rounded text-[11px] ${
                    selectedUser?.name === 'Unassigned' ? 'bg-slate-200 font-bold' : 'hover:bg-slate-100 text-slate-500 italic'
                  }`}
                >
                  Leave Unassigned
                </button>
                {allUsers
                  .filter((u) => u.displayName.toLowerCase().includes(assigneeSearch.toLowerCase()) || u.role.toLowerCase().includes(assigneeSearch.toLowerCase()))
                  .map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUser({ id: u.id, name: u.displayName })}
                      className={`w-full text-left p-1.5 rounded flex items-center justify-between text-xs ${
                        selectedUser?.id === u.id ? 'bg-emerald-100 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{u.displayName}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{u.role.replace('_', ' ')}</span>
                    </button>
                  ))}
              </div>

              {selectedUser && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Notify Assignee Channels:
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <label className={`flex items-center space-x-1 p-1 rounded border text-[10px] cursor-pointer ${
                      notifyEmail ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                      <input
                        type="checkbox"
                        checked={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.checked)}
                        className="rounded text-emerald-600 w-3 h-3"
                      />
                      <Mail className="w-3 h-3 text-emerald-600" />
                      <span>Email</span>
                    </label>

                    <label className={`flex items-center space-x-1 p-1 rounded border text-[10px] cursor-pointer ${
                      notifySms ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold' : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                      <input
                        type="checkbox"
                        checked={notifySms}
                        onChange={(e) => setNotifySms(e.target.checked)}
                        className="rounded text-blue-600 w-3 h-3"
                      />
                      <Phone className="w-3 h-3 text-blue-600" />
                      <span>SMS</span>
                    </label>

                    <label className={`flex items-center space-x-1 p-1 rounded border text-[10px] cursor-pointer ${
                      notifyWhatsapp ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold' : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                      <input
                        type="checkbox"
                        checked={notifyWhatsapp}
                        onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                        className="rounded text-teal-600 w-3 h-3"
                      />
                      <MessageSquare className="w-3 h-3 text-teal-600" />
                      <span>WhatsApp</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedUser) return;
                      await updateTask(item.id, {
                        assigneeId: selectedUser.id || undefined,
                        assigneeName: selectedUser.name,
                      });

                      if (selectedUser.id && selectedUser.name !== 'Unassigned') {
                        const channels: string[] = [];
                        if (notifyEmail) channels.push('Email');
                        if (notifySms) channels.push('SMS');
                        if (notifyWhatsapp) channels.push('WhatsApp');
                        const channelStr = channels.length > 0 ? channels.join(', ') : 'In-App';

                        addAppNotification({
                          category: 'task',
                          title: `Task Reassigned: ${item.title}`,
                          message: `Assigned to ${selectedUser.name}. Alerts dispatched via [${channelStr}].`,
                          recipientRoles: ['project_manager', 'field_officer', 'ceo', 'admin'],
                          relatedEntityId: item.id,
                        });
                      }

                      setIsEditingAssignee(false);
                      // Update local item view
                      item.assigneeId = selectedUser.id || undefined;
                      item.assigneeName = selectedUser.name;
                    }}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition"
                  >
                    Confirm Assignment &amp; Send Alerts
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description / Statement */}
        <div className="space-y-1.5">
          <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block">
            Scope &amp; Description
          </span>
          <p className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
            {item.description || 'No extended description recorded for this item.'}
          </p>
        </div>

        {/* Proof Attachments Section */}
        <div className="space-y-2">
          <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block flex items-center space-x-1">
            <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
            <span>Proof Attachments &amp; Inspection Reports</span>
          </span>

          <div className="p-3 rounded-2xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 text-[11px] truncate">
                field_inspection_proof_v1.pdf
              </span>
              <span className="text-[10px] text-emerald-700 font-bold font-mono">Verified</span>
            </div>
            <button
              type="button"
              className="w-full py-2 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 text-slate-600 font-bold text-center transition hover:bg-slate-50"
            >
              + Attach Additional Proof File
            </button>
          </div>
        </div>

        {/* Voice-to-Text Progress Update Recorder for Tasks */}
        {type === 'task' && (
          <FieldOfficerVoiceRecorder
            taskId={item.id}
            taskTitle={item.title || 'Task Update'}
            onPostUpdate={handleVoicePostUpdate}
          />
        )}

        {/* Comment Stream */}
        <div className="space-y-3">
          <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block flex items-center space-x-1">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Audit &amp; Field Progress Stream</span>
          </span>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {commentsList.map((c) => (
              <div key={c.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-900 text-[11px]">{c.user}</span>
                    {c.isVoiceVerified && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 font-mono">
                        🎙️ Voice Log
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{c.date}</span>
                </div>
                <p className="text-slate-700 leading-snug">{c.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className="flex items-center space-x-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add audit note or comment..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center space-x-1 shrink-0 transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
        <span className="font-mono">Milous Detail Flyout v2.5</span>
        <button
          type="button"
          onClick={closeFlyout}
          className="font-bold text-slate-700 hover:text-slate-900"
        >
          Close Flyout
        </button>
      </div>
    </div>
  );
};
