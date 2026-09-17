import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFirestore } from '../../context/FirestoreContext';
import { 
  Building2, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  ChevronDown, 
  ShieldCheck, 
  UserCheck, 
  LogIn,
  LogOut,
  Menu,
  Sparkles,
  Bell,
  Search
} from 'lucide-react';
import { UserRole } from '../../types';
import { AdminTeamCredentialsModal } from '../admin/AdminTeamCredentialsModal';
import { NotificationCenterModal } from '../notifications/NotificationCenterModal';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { currentUser, userRole, isAdmin, allUsers, switchDemoUser, login, logout } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = React.useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = React.useState(false);
  const { 
    projects, 
    activeProjectId, 
    setActiveProjectId, 
    activeProject, 
    isOnline, 
    setIsOnline, 
    pendingSyncCount, 
    triggerManualSync,
    unreadNotificationsCount,
    setCommandPaletteOpen
  } = useFirestore();

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Administrator', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'PROJECT_MANAGER':
        return { label: 'Project Lead', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'ME_OFFICER':
        return { label: 'M&E Officer', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'FINANCE_OFFICER':
        return { label: 'Finance & Grants', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'FIELD_OFFICER':
        return { label: 'Field Operations', bg: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'DONOR_AUDITOR':
        return { label: 'Donor Auditor', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      default:
        return { label: role, bg: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const roleInfo = currentUser ? getRoleBadge(currentUser.role) : null;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Toggle & Project Context */}
          <div className="flex items-center space-x-3">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Toggle Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shrink-0">
                M
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-black tracking-tight text-white">Milous Project</span>
                  <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    NGO Enterprise
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Offline-First Firestore • Google SSO • Donor Compliance
                </p>
              </div>
            </div>
          </div>

          {/* Center: Mission Project Selector */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 max-w-xs truncate">
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium shrink-0">Mission:</span>
            <select
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-2 max-w-[200px] truncate"
            >
              <option value="ALL" className="bg-slate-800 text-white font-bold">
                🌐 All Projects (Consolidated)
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-800 text-white">
                  [{p.code}] {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Offline / Online Mode & User Card */}
          <div className="flex items-center space-x-3">
            {/* Search Button (Opens Unified Search Popup) */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-700/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer"
              title="Search tasks, projects, donors, reports, files (⌘K)"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden md:inline text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-700 px-1 py-0.2 rounded">
                ⌘K
              </kbd>
            </button>

            {/* Notification Center Bell Launcher */}
            <button
              type="button"
              onClick={() => setIsNotificationModalOpen(true)}
              className="relative p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Agency Notifications & Approvals"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Admin-Only Team Credentials Provisioner Button */}
            {(isAdmin || userRole === 'ADMIN') && (
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-200 text-xs font-bold transition shadow-xs"
                title="Only Administrators can issue team credentials"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Team Credentials</span>
              </button>
            )}

            {/* Offline-First Persistence Status Toggle */}
            <div className="flex items-center space-x-1.5 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                title={isOnline ? 'Online (Click to simulate field offline mode)' : 'Offline (Click to go online)'}
                className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg font-medium transition-colors ${
                  isOnline 
                    ? 'text-emerald-400 hover:bg-emerald-950/40' 
                    : 'text-amber-400 hover:bg-amber-950/40'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-[11px] hidden sm:inline">Online DB</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="font-bold text-[11px] hidden sm:inline">Offline Cache</span>
                  </>
                )}
              </button>

              {pendingSyncCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {pendingSyncCount}
                </span>
              )}

              <button
                type="button"
                onClick={triggerManualSync}
                title="Sync queued changes to Firestore"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Google SSO / User Card */}
            {currentUser ? (
              <div className="relative group">
                <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer hover:border-slate-600 transition">
                  <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs text-white border border-emerald-500 shrink-0">
                    {currentUser.displayName.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-semibold leading-tight text-white flex items-center space-x-1">
                      <span className="truncate max-w-[110px]">{currentUser.displayName}</span>
                      {roleInfo && (
                        <span className={`text-[9px] px-1 py-0.2 rounded border font-bold ${roleInfo.bg}`}>
                          {roleInfo.label}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">
                      {currentUser.email}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Persona Switcher Dropdown */}
                <div className="absolute right-0 mt-2 w-72 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 py-2 hidden group-hover:block z-50">
                  <div className="px-3.5 py-1.5 border-b border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Google SSO Staff Personas</span>
                    <span className="text-[9px] text-emerald-400">RBAC Testing</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {allUsers.map((user) => {
                      const isSelected = user.id === currentUser.id;
                      const uRole = getRoleBadge(user.role);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => switchDemoUser(user.id)}
                          className={`w-full text-left px-3 py-2 flex items-center space-x-3 hover:bg-slate-700/70 transition text-xs ${
                            isSelected ? 'bg-slate-700/50 border-l-2 border-emerald-400' : ''
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-xs text-white">
                            {user.displayName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate text-xs">{user.displayName}</p>
                            <div className="flex items-center space-x-1">
                              <span className={`text-[9px] px-1 rounded border font-medium ${uRole.bg}`}>
                                {uRole.label}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-2 border-t border-slate-700 space-y-1">
                    <button
                      type="button"
                      onClick={() => login()}
                      className="w-full px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Connect Google SSO</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => login()}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <AdminTeamCredentialsModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </header>
  );
};
