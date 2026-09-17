import React from 'react';
import { 
  KanbanSquare, 
  BarChart3, 
  Split, 
  Sparkles, 
  DatabaseZap,
  CheckCircle2
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';

export type ActiveTab = 'kanban' | 'indicators' | 'expenses' | 'ai_risks' | 'sync_health';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { tasks, indicators, expenses, pendingSyncCount } = useFirestore();

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const autoSyncIndicatorsCount = indicators.filter((i) => i.autoSyncEnabled).length;
  const pendingExpenses = expenses.filter((e) => e.status === 'PENDING').length;

  const navItems = [
    {
      id: 'kanban' as ActiveTab,
      label: 'Drag-and-Drop Tasks',
      icon: KanbanSquare,
      badge: `${completedTasks}/${tasks.length}`,
      badgeColor: 'bg-emerald-100 text-emerald-800',
      description: 'Kanban Board & M&E Auto-Sync',
    },
    {
      id: 'indicators' as ActiveTab,
      label: 'M&E LogFrame Indicators',
      icon: BarChart3,
      badge: `${autoSyncIndicatorsCount} Auto-Sync`,
      badgeColor: 'bg-blue-100 text-blue-800',
      description: 'Quantitative Metric Syncing',
    },
    {
      id: 'expenses' as ActiveTab,
      label: 'Multi-Donor Expenses',
      icon: Split,
      badge: pendingExpenses > 0 ? `${pendingExpenses} Pending` : 'Compliant',
      badgeColor: pendingExpenses > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700',
      description: 'Fractional Cost Splitting',
    },
    {
      id: 'ai_risks' as ActiveTab,
      label: 'Vertex AI Risk Pipeline',
      icon: Sparkles,
      badge: 'Gemini 2.5',
      badgeColor: 'bg-purple-100 text-purple-800',
      description: 'Multimodal Document Audit',
    },
    {
      id: 'sync_health' as ActiveTab,
      label: 'Offline Engine & Audit',
      icon: DatabaseZap,
      badge: pendingSyncCount > 0 ? `${pendingSyncCount} in Queue` : 'Healthy',
      badgeColor: pendingSyncCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
      description: 'Firestore Offline-First Sync',
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                    isActive ? 'bg-slate-800 text-slate-200' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
