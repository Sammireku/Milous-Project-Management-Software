import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  KanbanSquare, 
  BarChart3, 
  FileSpreadsheet, 
  ShieldAlert, 
  X, 
  Check, 
  ExternalLink,
  Filter,
  Trash2,
  Inbox,
  Mail,
  MessageSquare
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { AppNotification, NotificationCategory } from '../../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const { 
    appNotifications, 
    unreadNotificationsCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    dismissAppNotification, 
    clearAllAppNotifications,
    sendInboundMessage
  } = useFirestore();

  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');
  const [filterByMyRole, setFilterByMyRole] = useState(true);
  const [showSimulateInput, setShowSimulateInput] = useState(false);
  const [simSender, setSimSender] = useState('Dr. Amina Bello (Field Coordinator)');
  const [simText, setSimText] = useState('Borehole water quality report for Tamale site is ready.');

  if (!isOpen) return null;

  // Filter notifications by role and category
  const filteredNotifications = appNotifications.filter((notif) => {
    // Category filter
    if (selectedCategory !== 'all' && notif.category !== selectedCategory) {
      return false;
    }

    // Role filter
    if (filterByMyRole && userRole && notif.targetRoles && notif.targetRoles.length > 0) {
      return notif.targetRoles.includes(userRole);
    }

    return true;
  });

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'approval':
        return <DollarSign className="w-4 h-4 text-amber-600" />;
      case 'donor_deadline':
        return <Clock className="w-4 h-4 text-rose-600" />;
      case 'project_update':
        return <KanbanSquare className="w-4 h-4 text-blue-600" />;
      case 'survey':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'compliance':
        return <ShieldAlert className="w-4 h-4 text-purple-600" />;
      case 'inbound_message':
        return <Mail className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getSeverityBadge = (severity: AppNotification['severity']) => {
    switch (severity) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            Action Req.
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            Info
          </span>
        );
    }
  };

  const handleActionClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    onClose();
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const approvalCount = appNotifications.filter((n) => n.category === 'approval').length;
  const deadlineCount = appNotifications.filter((n) => n.category === 'donor_deadline').length;
  const projectCount = appNotifications.filter((n) => n.category === 'project_update').length;
  const surveyCount = appNotifications.filter((n) => n.category === 'survey').length;
  const messageCount = appNotifications.filter((n) => n.category === 'inbound_message').length;
  const taskCount = appNotifications.filter((n) => n.category === 'task').length;

  const handleSendSimulatedMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim()) return;
    await sendInboundMessage(simSender, 'Partner/Field', simText.trim(), 'Rural WASH');
    setSimText('');
    setShowSimulateInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight text-white">Agency Notification Center</h2>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500 text-white shadow-xs">
                    {unreadNotificationsCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Live operational alerts, expense approvals, donor reporting deadlines &amp; survey streams.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All ({appNotifications.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('approval')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
                selectedCategory === 'approval'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Approvals ({approvalCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('donor_deadline')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
                selectedCategory === 'donor_deadline'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Donor Deadlines ({deadlineCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('project_update')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
                selectedCategory === 'project_update'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              <span>Projects ({projectCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('survey')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
                selectedCategory === 'survey'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Surveys ({surveyCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('inbound_message')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
                selectedCategory === 'inbound_message'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Inbound Messages ({messageCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('task')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${
                selectedCategory === 'task'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tasks & Assignees ({taskCount})</span>
            </button>
          </div>

          {/* Role Filter & Actions */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowSimulateInput(!showSimulateInput)}
              className="px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition flex items-center space-x-1"
              title="Simulate inbound message to test alerts"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Simulate Message</span>
            </button>

            <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer select-none bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={filterByMyRole}
                onChange={(e) => setFilterByMyRole(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="font-semibold">My Role ({userRole || 'Staff'})</span>
            </label>

            {unreadNotificationsCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Simulate Inbound Message Bar */}
        {showSimulateInput && (
          <form onSubmit={handleSendSimulatedMessage} className="p-3 bg-indigo-50/70 border-b border-indigo-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-indigo-950 flex items-center space-x-1">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>Test Inbound Message:</span>
            </span>
            <input
              type="text"
              value={simSender}
              onChange={(e) => setSimSender(e.target.value)}
              placeholder="Sender name..."
              className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-xs w-48 text-slate-800"
            />
            <input
              type="text"
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              placeholder="Message body..."
              className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-xs flex-1 min-w-[200px] text-slate-800"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
            >
              Dispatch Alert
            </button>
          </form>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-100">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No notifications in this view</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {filterByMyRole 
                  ? `No active alerts currently assigned to your role (${userRole}). Uncheck "My Role" to see all agency alerts.` 
                  : 'All notifications cleared or no updates available.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`pt-3 first:pt-0 p-3 rounded-2xl transition border ${
                  !notif.read
                    ? 'bg-indigo-50/40 border-indigo-200/80 shadow-xs'
                    : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0 mt-0.5">
                      {getCategoryIcon(notif.category)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 leading-snug">
                          {notif.title}
                        </span>
                        {getSeverityBadge(notif.severity)}
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-indigo-200 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                        <span>{formatRelativeTime(notif.timestamp)}</span>
                        {notif.targetRoles && notif.targetRoles.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-slate-500">
                              Roles: {notif.targetRoles.join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 shrink-0">
                    {notif.actionLabel && (
                      <button
                        type="button"
                        onClick={() => handleActionClick(notif)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center space-x-1 transition shadow-xs"
                      >
                        <span>{notif.actionLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => markNotificationAsRead(notif.id)}
                      title="Mark as read"
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissAppNotification(notif.id)}
                      title="Dismiss notification"
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={clearAllAppNotifications}
            className="flex items-center space-x-1 text-slate-500 hover:text-rose-600 font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear all</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Target Role: <strong className="text-slate-700">{userRole || 'Staff'}</strong></span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
