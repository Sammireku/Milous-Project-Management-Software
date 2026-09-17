import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  KanbanSquare, 
  DollarSign, 
  BarChart3, 
  Sparkles, 
  DatabaseZap, 
  ShieldCheck,
  Building2,
  Lock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirestore } from '../../context/FirestoreContext';
import { UserRole } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, userRole, permissions } = useAuth();
  const { tasks, indicators, expenses, pendingSyncCount, activeProject } = useFirestore();

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const pendingExpenses = expenses.filter((e) => e.status === 'PENDING').length;
  const autoSyncIndicators = indicators.filter((i) => i.autoSyncEnabled).length;

  const canAccessFinancials = ['ADMIN', 'FINANCE_OFFICER', 'PROJECT_MANAGER', 'DONOR_AUDITOR'].includes(
    userRole || ''
  );

  const navigationItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'NGO Executive Overview',
    },
    {
      to: '/projects',
      label: 'Projects & Grants',
      icon: FolderKanban,
      badge: 'Active',
      badgeColor: 'bg-blue-100 text-blue-800',
      description: 'Multi-Donor Grant Tracking',
    },
    {
      to: '/kanban',
      label: 'Field Kanban',
      icon: KanbanSquare,
      badge: `${completedTasks}/${tasks.length}`,
      badgeColor: 'bg-emerald-100 text-emerald-800',
      description: 'Tasks & M&E Auto-Sync',
    },
    {
      to: '/financials',
      label: 'Financials & BVA',
      icon: DollarSign,
      badge: pendingExpenses > 0 ? `${pendingExpenses} Pending` : null,
      badgeColor: 'bg-amber-100 text-amber-800',
      description: 'Multi-Donor Cost Splitting',
      isRestricted: !canAccessFinancials,
      requiredRole: 'Finance/Admin',
    },
    {
      to: '/me-indicators',
      label: 'M&E Indicators',
      icon: BarChart3,
      badge: `${autoSyncIndicators} Auto-Sync`,
      badgeColor: 'bg-purple-100 text-purple-800',
      description: 'LogFrame Metric Syncing',
    },
    {
      to: '/ai-risks',
      label: 'Vertex AI Risk',
      icon: Sparkles,
      badge: 'Gemini 2.5',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      description: 'Document Audit Engine',
    },
    {
      to: '/sync-health',
      label: 'Offline Engine',
      icon: DatabaseZap,
      badge: pendingSyncCount > 0 ? `${pendingSyncCount} Q` : 'OK',
      badgeColor: pendingSyncCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
      description: 'Firestore Offline Sync',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-base shadow-sm">
              M
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Milous NGO</h1>
              <p className="text-[10px] text-emerald-400 font-mono">Offline-First M&amp;E</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Active Project Card */}
        {activeProject && (
          <div className="p-3 mx-3 my-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
              <span className="flex items-center space-x-1">
                <Building2 className="w-3 h-3 text-emerald-400" />
                <span>Active Mission</span>
              </span>
              <span className="text-emerald-400 font-bold">{activeProject.sector}</span>
            </div>
            <p className="font-bold text-white text-xs truncate" title={activeProject.title}>
              [{activeProject.code}] {activeProject.title}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
              {activeProject.location}
            </p>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            NGO Operational Modules
          </div>

          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {item.isRestricted && (
                        <span title={`Requires ${item.requiredRole} role`}>
                          <Lock className="w-3 h-3 text-amber-400" />
                        </span>
                      )}
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive ? 'bg-emerald-800 text-emerald-100' : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Role Card at bottom */}
        {currentUser && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                {currentUser.displayName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white text-xs truncate">
                  {currentUser.displayName}
                </p>
                <div className="flex items-center space-x-1">
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
