import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertCircle, 
  Plus, 
  FileText, 
  CheckCircle2, 
  X,
  Calendar
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';

interface ReportCardItem {
  id: string;
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}

export const ReportsView: React.FC = () => {
  const { tasks, projects } = useFirestore();
  const [selectedReport, setSelectedReport] = useState<ReportCardItem | null>(null);

  const summaryBoards: ReportCardItem[] = [
    {
      id: 'custom_board',
      title: 'Custom summary board',
      description: 'Build your own board with custom charts and numbers',
      icon: Plus,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'overall_overview',
      title: 'Overall work overview',
      description: 'Quick snapshot of progress across all your work',
      icon: BarChart3,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'status_check',
      title: 'Work status check',
      description: 'See which items are on track, finished, or need attention',
      icon: CheckCircle2,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      id: 'team_productivity',
      title: 'Team productivity',
      description: 'Understand how much work is completed each week',
      icon: TrendingUp,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'team_availability',
      title: 'Team availability',
      description: 'Check who has free time and who has too much to do',
      icon: Users,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'work_speed',
      title: 'Work speed',
      description: 'Measure how fast items move from start to finish',
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  const standardReports: ReportCardItem[] = [
    {
      id: 'custom_report',
      title: 'Custom report',
      description: 'Filter and export specific items to a spreadsheet or document',
      icon: Plus,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'active_by_member',
      title: 'Active work by team member',
      description: 'List all open to-dos grouped by who is working on them',
      icon: Users,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      id: 'weekly_summary',
      title: 'Weekly progress summary',
      description: 'Everything finished and started over the last 7 days',
      icon: Calendar,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'late_items',
      title: 'Late items by team member',
      description: 'See items that missed their target date to help unblock them',
      icon: AlertCircle,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'due_this_month',
      title: 'Projects due this month',
      description: 'Projects and deadlines coming up in the next 30 days',
      icon: Clock,
      color: 'bg-violet-50 text-violet-700 border-violet-200',
    },
    {
      id: 'unassigned_work',
      title: 'Unassigned work',
      description: 'To-dos that have not been given to anyone yet',
      icon: FileText,
      color: 'bg-slate-50 text-slate-700 border-slate-200',
    },
  ];

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressCount = tasks.filter((t) => t.status !== 'COMPLETED').length;

  return (
    <div className="space-y-8 p-1">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Summaries</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xl">
          Get clear answers about your work, team pace, and upcoming deadlines without needing complex formulas.
        </p>
      </div>

      {/* Section 1: Summary Boards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Create a summary board
            </h2>
            <p className="text-xs text-slate-500">Visual boards with charts, numbers, and team metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaryBoards.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedReport(item)}
                className="text-left bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500/80 hover:shadow-xs transition-all group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2.5 rounded-lg border shrink-0 ${item.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center space-x-1">
                  <span>Open board →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Standard Reports */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Create a report
          </h2>
          <p className="text-xs text-slate-500">Organized lists and tables of your to-dos and projects</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {standardReports.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedReport(item)}
                className="text-left bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500/80 hover:shadow-xs transition-all group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2.5 rounded-lg border shrink-0 ${item.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center space-x-1">
                  <span>View report →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedReport.title}</h3>
                <p className="text-xs text-slate-500">{selectedReport.description}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Stat summary cards */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Total Items</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{tasks.length}</p>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/60">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase">Finished</span>
                  <p className="text-xl font-black text-emerald-800 mt-0.5">{completedCount}</p>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200/60">
                  <span className="text-[11px] font-bold text-blue-700 uppercase">In Progress</span>
                  <p className="text-xl font-black text-blue-800 mt-0.5">{inProgressCount}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Relevant items
                </span>
                {tasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No items in this report yet. As you add to-dos, they will automatically appear here.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                    {tasks.map((t) => (
                      <div key={t.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <span className="font-medium text-slate-900">{t.title}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
