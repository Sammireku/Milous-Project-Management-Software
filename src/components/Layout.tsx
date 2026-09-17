import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  Search,
  BookOpen,
  Inbox,
  PenTool,
  FileSpreadsheet,
  Users,
  Clock,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Calendar,
  LayoutDashboard,
  FolderKanban,
  Database,
  Plus,
  UserPlus,
  HelpCircle,
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  Menu,
  X,
  Star,
  Activity,
  CheckCircle2,
  Sparkles,
  Sliders,
  DollarSign,
  Building2,
  Truck,
  ShieldCheck,
  Zap,
  Wrench,
  Boxes,
  FileText,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFirestore } from '../context/FirestoreContext';
import { NotificationToast } from './common/NotificationToast';
import { GlobalCreateModal } from './common/GlobalCreateModal';
import { GlobalCreateDropdown, CreateType } from './common/GlobalCreateDropdown';
import { CommandPalette } from './common/CommandPalette';
import { DetailFlyoutPanel } from './common/DetailFlyoutPanel';
import { NotificationCenterModal } from './notifications/NotificationCenterModal';
import { CustomizeMenuModal } from './navigation/CustomizeMenuModal';
import { AiAssistantModal } from './ai/AiAssistantModal';
import { GlobalSearch } from './navigation/GlobalSearch';
import { PWAInstallButton } from './common/PWAInstallButton';
import { OfflineIndicator } from './common/OfflineIndicator';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isGlobalCreateOpen, setIsGlobalCreateOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [createInitialTab, setCreateInitialTab] = useState<CreateType>('task');
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isCustomizeMenuOpen, setIsCustomizeMenuOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSpaceExpanded, setIsSpaceExpanded] = useState(true);

  const { user, logout, allUsers, switchDemoUser, isAdmin, isProjectManager, isCEO } = useAuth();
  const { 
    tasks, 
    projects, 
    activeProjectId, 
    setActiveProjectId, 
    isOnline, 
    setIsOnline, 
    pendingSyncCount, 
    triggerManualSync,
    unreadNotificationsCount,
    setCommandPaletteOpen
  } = useFirestore();

  const canAccessAi = isAdmin || isProjectManager || isCEO;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Milous Project (MP) Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 bg-[#16202c] text-slate-200 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-16 lg:w-16' : 'w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            {/* Milous Project MP stylized Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-xs">
                MP
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-black text-white text-sm tracking-tight font-sans">
                    Milous Project
                  </span>
                  <span className="text-[9px] text-emerald-400 font-semibold tracking-wider uppercase">
                    Alliance
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User initials & quick status */}
        {!isCollapsed && (
          <div className="px-4 py-2.5 border-b border-slate-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'MP'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-xs truncate">
                  {user?.displayName || 'Milou Mireku'}
                </p>
                <p className="text-[10px] text-slate-400 truncate capitalize">
                  {user?.role?.replace('_', ' ') || 'Staff Member'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation List */}
        <div className="flex-1 overflow-y-auto px-2 py-2.5 space-y-3">
          {/* Quick Access Items */}
          <div className="space-y-0.5">
            {/* Search */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
              } rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer`}
              title="Search tasks, projects, donors, files (⌘K)"
            >
              <div className="flex items-center space-x-2.5">
                <Search className="w-4 h-4 text-slate-400" />
                {!isCollapsed && <span>Search</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded font-mono">
                  ⌘K
                </span>
              )}
            </button>

            {/* AI Assistant Button (Only for PM, CEO, and Admin) */}
            {canAccessAi && (
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-lg text-xs font-bold transition-all bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 text-emerald-300 hover:border-emerald-400 hover:text-white shadow-xs cursor-pointer`}
                title="AI Studio: Reports, Analysis &amp; Surveys"
              >
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  {!isCollapsed && <span>AI Studio</span>}
                </div>
                {!isCollapsed && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    AI
                  </span>
                )}
              </button>
            )}

            {/* Timesheets (for M&E and lower team members to fill & PM/Admin to approve) */}
            <NavLink
              to="/timesheets"
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              title="Timesheets"
            >
              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {!isCollapsed && <span>Timesheets</span>}
              </div>
            </NavLink>

            {/* Team Workload & Capacity */}
            <NavLink
              to="/workload"
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              title="Team workload"
            >
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4 text-slate-400" />
                {!isCollapsed && <span>Team workload</span>}
              </div>
            </NavLink>

            {/* Whiteboard with Klaxoon, Stickies, Google Docs/Slides/Sheets */}
            <NavLink
              to="/whiteboard"
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              title="Whiteboard &amp; Workstation"
            >
              <div className="flex items-center space-x-2.5">
                <PenTool className="w-4 h-4 text-slate-400" />
                {!isCollapsed && <span>Whiteboard</span>}
              </div>
            </NavLink>

            {/* Admin Panel (Logins, Authorizations & Roles) */}
            {(isAdmin || isCEO) && (
              <NavLink
                to="/admin-panel"
                className={({ isActive }) =>
                  `flex items-center ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                  } rounded-lg text-xs font-medium transition-colors ${
                    isActive ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
                title="Admin panel"
              >
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {!isCollapsed && <span>Admin panel</span>}
                </div>
              </NavLink>
            )}

            {/* Impact Analysis & Data Collection */}
            <NavLink
              to="/impact-analysis"
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              title="Impact Analysis & Field Collection"
            >
              <div className="flex items-center space-x-2.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                {!isCollapsed && <span>Impact Analysis</span>}
              </div>
            </NavLink>

            {/* Skills & Impact Academy */}
            <NavLink
              to="/skills-manager"
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              title="Skills Academy & Impact Ledger"
            >
              <div className="flex items-center space-x-2.5">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                {!isCollapsed && <span>Skills &amp; Impact</span>}
              </div>
            </NavLink>

            {/* Grant Proposals Database */}
            <NavLink
              to="/proposals"
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              title="Grant Proposal Database"
            >
              <div className="flex items-center space-x-2.5">
                <FileText className="w-4 h-4 text-slate-400" />
                {!isCollapsed && <span>Grant Proposals</span>}
              </div>
            </NavLink>

            {/* Maintenance & Equipment Tracking */}
            <NavLink
              to="/maintenance"
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              title="Maintenance & Equipment"
            >
              <div className="flex items-center space-x-2.5">
                <Wrench className="w-4 h-4 text-slate-400" />
                {!isCollapsed && <span>Maintenance</span>}
              </div>
            </NavLink>

            {/* Stocks & Inventory Management */}
            <NavLink
              to="/stocks"
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              title="Stocks & Inventory"
            >
              <div className="flex items-center space-x-2.5">
                <Boxes className="w-4 h-4 text-purple-400" />
                {!isCollapsed && <span>Stocks & Inventory</span>}
              </div>
            </NavLink>

            {/* ... More Button with flyout popup */}
            <div className="relative">
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer`}
                title="More: Dashboard, Reports, Created by me, Starred task, Customize menu"
              >
                <div className="flex items-center space-x-2.5">
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                  {!isCollapsed && <span>More</span>}
                </div>
                {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {/* More Popup Menu containing Dashboard, Reports, Created by me, Starred task, Customize menu */}
              {isMoreMenuOpen && (
                <div className="absolute left-full top-0 ml-2 w-56 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-xs font-medium animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Workspaces
                  </div>
                  
                  {/* Dashboard */}
                  <Link
                    to="/"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-emerald-700"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    <span>Dashboard</span>
                  </Link>

                  {/* Reports */}
                  <Link
                    to="/reports"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-emerald-700"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                    <span>Reports</span>
                  </Link>

                  {/* Created by me */}
                  <Link
                    to="/created-by-me"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-emerald-700"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Created by me</span>
                  </Link>

                  {/* Starred task */}
                  <Link
                    to="/starred"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-emerald-700"
                  >
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>Starred task</span>
                  </Link>

                  <div className="h-px bg-slate-100 my-1.5" />

                  {/* Customize menu */}
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsCustomizeMenuOpen(true);
                    }}
                    className="w-full text-left flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-emerald-700 cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-slate-400" />
                    <span>Customize menu</span>
                  </button>

                  <div className="h-px bg-slate-100 my-1.5" />
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Extended Tools
                  </div>

                  {/* To-do list */}
                  <Link
                    to="/tasks"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-emerald-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    <span>To-do list</span>
                  </Link>

                  {/* Reports */}
                  <Link
                    to="/reports"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-emerald-700"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                    <span>Reports</span>
                  </Link>

                  {/* Timeline & Dates */}
                  <Link
                    to="/calendars"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-emerald-700"
                  >
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Timeline &amp; Dates</span>
                  </Link>

                  {/* Multi Donor */}
                  <Link
                    to="/financials"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-emerald-700"
                  >
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span>Multi Donor</span>
                  </Link>

                  {/* Donor list */}
                  <Link
                    to="/donors"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-emerald-700"
                  >
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>Donor list</span>
                  </Link>

                  {/* Vendor list */}
                  <Link
                    to="/vendors"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-emerald-700"
                  >
                    <Truck className="w-4 h-4 text-slate-400" />
                    <span>Vendor list</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Spaces Section */}
          {!isCollapsed && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1">
              <button
                onClick={() => setIsSpaceExpanded(!isSpaceExpanded)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    ■
                  </div>
                  <span>Milous Missions</span>
                </div>
                {isSpaceExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {isSpaceExpanded && (
                <div className="pl-3 space-y-0.5 text-xs text-slate-300">
                  <div className="pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3">
                    Active Projects
                  </div>

                  {projects.map((p) => (
                    <NavLink
                      key={p.id}
                      to="/tasks"
                      onClick={() => setActiveProjectId(p.id)}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors ${
                        activeProjectId === p.id ? 'bg-emerald-600/20 text-emerald-300 font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{p.title}</span>
                      </div>
                    </NavLink>
                  ))}

                  <button
                    onClick={() => setIsGlobalCreateOpen(true)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors w-full text-left cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New project</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Add & Sign Out */}
        <div className="p-3 border-t border-slate-800/80 bg-[#121a24] shrink-0 space-y-2">
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsGlobalCreateOpen(true)}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add</span>
            </button>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400">
            {!isCollapsed && <span className="text-[11px] truncate max-w-[120px]">{user?.displayName}</span>}
            <button
              onClick={() => logout()}
              title="Sign out"
              className="p-1 hover:text-rose-400 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Space / View Selector */}
            <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-slate-800">
              <span className="text-slate-400 font-normal">Mission:</span>
              <select
                value={activeProjectId}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
              >
                <option value="ALL">🌐 All Projects (Consolidated)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* PWA Offline Install Button for remote field ops */}
            <PWAInstallButton />

            {/* AI Assistant Quick Pill (Only for PM, CEO, Admin) */}
            {canAccessAi && (
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="hidden xl:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>AI Intelligence</span>
              </button>
            )}

            {/* Global Search Component across Projects, Documents, Vendors, Tasks */}
            <GlobalSearch />

            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => setIsNotificationModalOpen(true)}
              className="relative p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
              )}
            </button>

            {/* Green Circular + Create Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer"
                title="Create task, project, folder, space, request, invite, or whiteboard"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>

              <GlobalCreateDropdown
                isOpen={isCreateDropdownOpen}
                onClose={() => setIsCreateDropdownOpen(false)}
                onSelect={(type) => {
                  setIsCreateDropdownOpen(false);
                  if (type === 'whiteboard') {
                    navigate('/whiteboard');
                  } else {
                    setCreateInitialTab(type);
                    setIsGlobalCreateOpen(true);
                  }
                }}
              />
            </div>

            {/* Developer/Admin Role Sandbox Swapper */}
            {(import.meta.env.DEV || user?.role === 'admin') && (
              <div className="flex items-center space-x-1.5 bg-slate-100/90 hover:bg-slate-200/50 px-2 py-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider hidden lg:inline">Role Sandbox:</span>
                <select
                  value={user?.id || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (selectedId) {
                      switchDemoUser(selectedId);
                    }
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-black text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="" disabled>Swap Profile...</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName} ({u.role?.replace('_', ' ').toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer">
              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'MP'}
            </div>

            {/* Online / Offline Sync Switcher */}
            <div className="hidden xl:flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                  isOnline ? 'text-emerald-700' : 'text-amber-800 animate-pulse'
                }`}
              >
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isOnline ? 'Live' : 'Offline'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden relative">
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-7">
            {children || <Outlet />}
          </main>

          <DetailFlyoutPanel />
        </div>

        {/* Floating + Action Button (FAB) on all screens */}
        <button
          type="button"
          onClick={() => setIsGlobalCreateOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-2 border-white/30 ring-4 ring-emerald-600/20 group cursor-pointer"
          title="Add new to-do or project"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 text-xs font-black tracking-wide uppercase transition-all duration-300">
            + Add
          </span>
        </button>

        {/* Modals, Assistants and Palettes */}
        <CommandPalette />
        <GlobalCreateModal
          isOpen={isGlobalCreateOpen}
          initialTab={createInitialTab}
          onClose={() => setIsGlobalCreateOpen(false)}
        />
        <NotificationCenterModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
        />
        <CustomizeMenuModal
          isOpen={isCustomizeMenuOpen}
          onClose={() => setIsCustomizeMenuOpen(false)}
        />
        <AiAssistantModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
        />
        <NotificationToast />
        <OfflineIndicator />
      </div>
    </div>
  );
};
