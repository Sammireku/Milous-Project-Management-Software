import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  MapPin, 
  Zap, 
  Paperclip, 
  MessageSquare, 
  Send, 
  FileText, 
  DollarSign, 
  Building2, 
  Clock,
  Upload,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { Task, Project } from '../../types';
import { useAuth } from '../../context/AuthContext';

export interface CommentItem {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  timestamp: string;
}

interface DetailFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  entity: (Task & { entityType?: 'task' }) | (Project & { entityType?: 'project' }) | null;
}

export const DetailFlyout: React.FC<DetailFlyoutProps> = ({ isOpen, onClose, entity }) => {
  const { currentUser, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'attachments' | 'comments'>('overview');

  const [comments, setComments] = useState<CommentItem[]>([
    {
      id: 'c-1',
      authorName: 'Kofi Mensah',
      authorRole: 'PROJECT_MANAGER',
      text: 'Verified initial procurement specs. Please ensure field photo attachments are logged upon delivery.',
      timestamp: new Date(Date.now() - 86400000 * 2).toLocaleDateString() + ' 10:30 AM',
    },
    {
      id: 'c-2',
      authorName: 'Ama Osei',
      authorRole: 'FIELD_OFFICER',
      text: 'GPS coordinates verified on site. Borehole drilling rig arrived safely at Tamale North site.',
      timestamp: new Date(Date.now() - 3600000 * 4).toLocaleDateString() + ' 02:15 PM',
    },
  ]);

  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; name: string; size: string; date: string }[]>([
    { id: 'att-1', name: 'Field_Verification_Receipt_042.jpg', size: '1.2 MB', date: '2025-02-10' },
    { id: 'att-2', name: 'LogFrame_Indicator_Signoff.pdf', size: '450 KB', date: '2025-02-11' },
  ]);

  if (!isOpen || !entity) return null;

  const isTask = 'status' in entity && 'priority' in entity && !('sector' in entity);
  const isProject = 'sector' in entity;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const item: CommentItem = {
      id: 'c-' + Date.now(),
      authorName: currentUser?.displayName || 'Ama Osei',
      authorRole: userRole || 'FIELD_OFFICER',
      text: newComment.trim(),
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setComments((prev) => [item, ...prev]);
    setNewComment('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newAtt = {
        id: 'att-' + Date.now(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        date: new Date().toISOString().split('T')[0],
      };
      setAttachments((prev) => [newAtt, ...prev]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Flyout Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
          <div className="min-w-0 pr-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              {isProject ? 'Project & Grant Workspace' : 'Task & Field Activity Details'}
            </span>
            <h3 className="text-base font-bold text-white truncate mt-0.5">
              {entity.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-600 space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attachments')}
            className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'attachments'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Files ({attachments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'comments'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comments ({comments.length})</span>
          </button>
        </div>

        {/* Flyout Body Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs space-y-5">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Status & Badges */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                  <p className="font-bold text-slate-900 mt-0.5">{entity.status}</p>
                </div>
                {isTask && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Priority</span>
                    <p className="font-bold text-amber-700 mt-0.5">{(entity as Task).priority}</p>
                  </div>
                )}
                {isProject && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Sector</span>
                    <p className="font-bold text-emerald-700 mt-0.5">{(entity as Project).sector}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
                <p className="text-slate-700 mt-1 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                  {entity.description || 'No description provided.'}
                </p>
              </div>

              {/* Key Attributes Grid */}
              <div className="grid grid-cols-2 gap-3">
                {isTask && (entity as Task).assigneeName && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Assignee</span>
                    <p className="font-bold text-slate-800 mt-0.5 flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{(entity as Task).assigneeName}</span>
                    </p>
                  </div>
                )}

                {isProject && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Budget</span>
                    <p className="font-extrabold text-emerald-800 mt-0.5 flex items-center space-x-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>${(entity as Project).totalBudget.toLocaleString()}</span>
                    </p>
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Start Date</span>
                  <p className="font-bold text-slate-800 mt-0.5 flex items-center space-x-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {new Date(
                        isTask
                          ? (entity as Task).plannedStartDate
                          : (entity as Project).startDate
                      ).toLocaleDateString()}
                    </span>
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">End Date</span>
                  <p className="font-bold text-slate-800 mt-0.5 flex items-center space-x-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {new Date(
                        isTask
                          ? (entity as Task).plannedEndDate
                          : (entity as Project).endDate
                      ).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>

              {/* GPS Coordinates for Tasks */}
              {isTask && (entity as Task).fieldData?.gpsCoordinates && (
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">Field GPS Verification</span>
                  <p className="font-mono text-emerald-900 font-bold mt-0.5 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {(entity as Task).fieldData?.gpsCoordinates?.lat.toFixed(4)},{' '}
                      {(entity as Task).fieldData?.gpsCoordinates?.lng.toFixed(4)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              {/* Upload Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">Attached Receipts &amp; Photos</span>
                <label className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer hover:bg-emerald-700 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Attachment List */}
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between hover:bg-white transition"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{att.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{att.size} • Uploaded {att.date}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4 flex flex-col h-full">
              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a field note or audit observation..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </form>

              {/* Comment Stream */}
              <div className="space-y-3 pt-2">
                {comments.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                        <span>{c.authorName}</span>
                        <span className="text-[9px] font-mono uppercase bg-slate-200 px-1 py-0.2 rounded text-slate-700">
                          {c.authorRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{c.timestamp}</span>
                    </div>
                    <p className="text-slate-700 pt-1 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailFlyout;
