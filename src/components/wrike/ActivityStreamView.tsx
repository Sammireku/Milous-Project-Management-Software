import React, { useState } from 'react';
import { 
  Send, 
  Paperclip, 
  AtSign, 
  Smile, 
  Bold, 
  CheckCircle2, 
  MessageSquare, 
  Clock, 
  Calendar,
  Filter,
  Check
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';

interface StreamComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
  taskTitle?: string;
  projectTitle?: string;
}

export const ActivityStreamView: React.FC = () => {
  const { tasks, projects } = useFirestore();
  const { user } = useAuth();

  const [filterMode, setFilterMode] = useState<'all' | 'followed' | 'assigned' | 'conversations'>('all');
  const [hideAutoUpdates, setHideAutoUpdates] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<StreamComment[]>([]);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newComment: StreamComment = {
      id: `comm-${Date.now()}`,
      author: user?.displayName || 'Milou Mireku',
      avatar: 'MM',
      text: commentText.trim(),
      timestamp: 'Just now',
      projectTitle: projects[0]?.title || 'First space',
    };
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  return (
    <div className="flex h-full gap-5 overflow-hidden">
      {/* Center Feed */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col overflow-hidden">
        {/* Stream Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Activity updates</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Follow recent progress, team conversations, and task status updates
          </p>
        </div>

        {/* Feed Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Post a comment/update box */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-start space-x-3">
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                MM
              </span>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Try @mentioning people to get their attention..."
                rows={2}
                className="w-full text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-1 pl-11 text-slate-400">
                <button type="button" title="Attach file" className="p-1.5 hover:text-slate-700 rounded hover:bg-slate-200/60">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button type="button" title="Mention someone" className="p-1.5 hover:text-slate-700 rounded hover:bg-slate-200/60">
                  <AtSign className="w-4 h-4" />
                </button>
                <button type="button" title="Emoji" className="p-1.5 hover:text-slate-700 rounded hover:bg-slate-200/60">
                  <Smile className="w-4 h-4" />
                </button>
                <button type="button" title="Formatting" className="p-1.5 hover:text-slate-700 rounded hover:bg-slate-200/60">
                  <Bold className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleSendComment}
                disabled={!commentText.trim()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>

          {/* User Comments Feed */}
          {comments.map((comm) => (
            <div key={comm.id} className="flex items-start space-x-3 p-3.5 bg-emerald-50/30 rounded-xl border border-emerald-100">
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {comm.avatar}
              </span>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{comm.author}</span>
                  <span className="text-[11px] text-slate-400">{comm.timestamp}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{comm.text}</p>
              </div>
            </div>
          ))}

          {/* Tasks Updates Feed */}
          {!hideAutoUpdates && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Recent work</span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              {tasks.slice(0, 5).map((t) => (
                <div key={t.id} className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 shadow-2xs space-y-2 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{t.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {t.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Today'}</span>
                    </span>
                    <span>•</span>
                    <span>Assigned to {t.assigneeName || 'Milou Mireku'}</span>
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No activity updates recorded yet. Post a message above or create a new task to see updates appear here.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Filter Sidebar */}
      <div className="w-64 bg-white rounded-xl border border-slate-200/80 p-5 shrink-0 shadow-2xs flex flex-col space-y-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Show updates
          </h3>
          <div className="space-y-2 text-xs">
            <label className="flex items-center space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
              <input
                type="radio"
                name="streamFilter"
                checked={filterMode === 'all'}
                onChange={() => setFilterMode('all')}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-slate-800">Everything</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
              <input
                type="radio"
                name="streamFilter"
                checked={filterMode === 'followed'}
                onChange={() => setFilterMode('followed')}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-slate-800">Everything I followed</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
              <input
                type="radio"
                name="streamFilter"
                checked={filterMode === 'assigned'}
                onChange={() => setFilterMode('assigned')}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-slate-800">Assigned to me</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
              <input
                type="radio"
                name="streamFilter"
                checked={filterMode === 'conversations'}
                onChange={() => setFilterMode('conversations')}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-slate-800">My conversations</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <label className="flex items-center space-x-2.5 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={hideAutoUpdates}
              onChange={(e) => setHideAutoUpdates(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-slate-700 font-medium">Hide auto updates</span>
          </label>
        </div>
      </div>
    </div>
  );
};
