import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Mail, 
  MessageSquare, 
  Lock, 
  ShieldAlert, 
  Check, 
  Send,
  Users
} from 'lucide-react';
import { User } from '../../types';

interface DashboardShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUsers: User[];
  currentUser: User | null;
  isAdmin: boolean;
  activeTabTitle: string;
  onSendInvite: (channel: 'email' | 'whatsapp', target: string, recipientName: string) => void;
}

export const DashboardShareModal: React.FC<DashboardShareModalProps> = ({
  isOpen,
  onClose,
  allUsers,
  currentUser,
  isAdmin,
  activeTabTitle,
  onSendInvite,
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(['usr-pm-01', 'usr-field-01']);
  const [targetEmail, setTargetEmail] = useState('');
  const [targetPhone, setTargetPhone] = useState('+233 ');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((uid) => uid !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!targetEmail.trim()) return;

    onSendInvite('email', targetEmail.trim(), 'Recipient');
    setSuccessMsg(`Dashboard invitation dispatched via Email to ${targetEmail.trim()}`);
    setTargetEmail('');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!targetPhone.trim()) return;

    onSendInvite('whatsapp', targetPhone.trim(), 'Recipient');
    setSuccessMsg(`Dashboard link dispatched via WhatsApp to ${targetPhone.trim()}`);
    setTargetPhone('+233 ');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Share "{activeTabTitle}" Dashboard</h3>
              <p className="text-[10px] text-slate-400">Share to team members or dispatch notifications</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Admin vs Non-Admin notice banner */}
          {!isAdmin ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Admin Privileges Enforced</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Only <strong>Administrators</strong> and <strong>Executive Directors (CEO)</strong> can dispatch direct invitations via Email or WhatsApp. As a team member, you may share view permissions with listed workspace colleagues.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-[11px] leading-relaxed">
                <strong>Admin Verified ({currentUser?.displayName})</strong>: You are authorized to dispatch official dashboard invites via Email and WhatsApp.
              </p>
            </div>
          )}

          {/* Section 1: Listed Workspace Members */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <div className="flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Share with Listed Workspace Members</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {selectedUserIds.length} shared
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-44 overflow-y-auto">
              {allUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-[10px]">
                        {u.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{u.displayName}</div>
                        <div className="text-[10px] text-slate-400">{u.email} • <span className="capitalize">{u.role.replace('_', ' ')}</span></div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleUser(u.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? 'Shared' : 'Share'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Admin Dispatch via Email */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Send via Email (Admin Only)</span>
              </label>
              {!isAdmin && (
                <span className="text-[10px] text-slate-400 flex items-center space-x-1 font-semibold">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Admin Locked</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSendEmail} className="flex space-x-2">
              <input
                type="email"
                disabled={!isAdmin}
                placeholder="colleague@alliance.ngo"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!isAdmin || !targetEmail.trim()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold flex items-center space-x-1.5 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Send Email</span>
              </button>
            </form>
          </div>

          {/* Section 3: Admin Dispatch via WhatsApp */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Send via WhatsApp (Admin Only)</span>
              </label>
              {!isAdmin && (
                <span className="text-[10px] text-slate-400 flex items-center space-x-1 font-semibold">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Admin Locked</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSendWhatsApp} className="flex space-x-2">
              <input
                type="text"
                disabled={!isAdmin}
                placeholder="+233 24 123 4567"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!isAdmin || !targetPhone.trim()}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold flex items-center space-x-1.5 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send WhatsApp</span>
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
