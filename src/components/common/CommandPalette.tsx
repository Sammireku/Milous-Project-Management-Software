import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from '../../context/FirestoreContext';
import { 
  Search, 
  Plus, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  Building2, 
  Clock,
  FileSpreadsheet,
  FileText,
  ExternalLink
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenQuickCreate?: (type: 'project' | 'task' | 'expense') => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onOpenQuickCreate,
}) => {
  const navigate = useNavigate();
  const { 
    tasks, 
    projects, 
    expenses, 
    donors, 
    vendors, 
    timesheets,
    setActiveProjectId, 
    commandPaletteOpen, 
    setCommandPaletteOpen 
  } = useFirestore();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'TASKS' | 'PROJECTS' | 'DONORS' | 'REPORTS' | 'FILES'>('ALL');

  const isOpen = propIsOpen !== undefined ? propIsOpen : commandPaletteOpen;
  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setCommandPaletteOpen(false);
    }
  };

  // Handle Cmd+K / Ctrl+K shortcut globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        } else {
          setCommandPaletteOpen(true);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const term = searchTerm.toLowerCase().trim();

  // Filtered collections
  const filteredTasks = tasks.filter((t) => 
    !term || t.title.toLowerCase().includes(term) || (t.description && t.description.toLowerCase().includes(term))
  );

  const filteredProjects = projects.filter((p) => 
    !term || p.title.toLowerCase().includes(term) || p.code.toLowerCase().includes(term) || p.sector.toLowerCase().includes(term)
  );

  const filteredDonors = donors.filter((d) => 
    !term || d.name.toLowerCase().includes(term) || d.code.toLowerCase().includes(term) || d.type.toLowerCase().includes(term)
  );

  const filteredVendors = vendors.filter((v) =>
    !term || v.name.toLowerCase().includes(term) || v.category.toLowerCase().includes(term)
  );

  const filteredTimesheets = timesheets.filter((ts) =>
    !term || ts.userName.toLowerCase().includes(term) || ts.taskTitle.toLowerCase().includes(term) || ts.activityCategory.toLowerCase().includes(term)
  );

  // Pre-configured Reports & Documents
  const sampleReports = [
    { id: 'rep-01', title: 'USAID Quarterly Financial & Milestone Expenditure Report', category: 'Donor Compliance', path: '/reports' },
    { id: 'rep-02', title: 'WASH Community Water Committee Audit Handover Protocol', category: 'Field Handover', path: '/reports' },
    { id: 'rep-03', title: 'Kenema Maternal Clinic Cold-Chain Temperature Log Report', category: 'Health Metrics', path: '/reports' },
    { id: 'rep-04', title: 'Turkana STEM Digital Labs Teacher Baseline Survey Report', category: 'Education M&E', path: '/reports' },
  ].filter(r => !term || r.title.toLowerCase().includes(term) || r.category.toLowerCase().includes(term));

  const sampleFiles = [
    { id: 'fil-01', name: 'USAID_Grant_Award_Agreement_2026.pdf', size: '2.4 MB', type: 'PDF Contract', path: '/doc-hub' },
    { id: 'fil-02', name: 'Hydrogeological_Resistivity_Survey_Ashanti.xlsx', size: '4.8 MB', type: 'Spreadsheet', path: '/doc-hub' },
    { id: 'fil-03', name: 'Kenema_Hospital_Solar_Fridge_Inspection_Cert.pdf', size: '1.1 MB', type: 'PDF Certificate', path: '/doc-hub' },
    { id: 'fil-04', name: 'Turkana_School_Board_Partnership_MoU.docx', size: '820 KB', type: 'Word Document', path: '/doc-hub' },
  ].filter(f => !term || f.name.toLowerCase().includes(term) || f.type.toLowerCase().includes(term));

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    navigate('/tasks');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 px-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[82vh]">
        
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/90">
          <Search className="w-5 h-5 text-emerald-600 shrink-0 mr-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks, projects, donors, reports, files, timesheets..."
            className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none placeholder-slate-400"
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded-md shrink-0 ml-2">
            ESC
          </kbd>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center space-x-1.5 px-4 py-2 border-b border-slate-100 bg-white overflow-x-auto text-xs">
          {(['ALL', 'TASKS', 'PROJECTS', 'DONORS', 'REPORTS', 'FILES'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-full font-bold text-[11px] transition shrink-0 ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? '🌟 All Results' : cat}
            </button>
          ))}
        </div>

        {/* Search Results Body */}
        <div className="overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* Quick Shortcuts if no search term */}
          {!searchTerm && (
            <div className="space-y-2">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] px-1 block">
                Quick Navigation
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigate('/my-todo')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-left transition"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
                  <p className="font-bold text-slate-800 text-xs">To-Do List</p>
                  <p className="text-[10px] text-slate-400">Assigned work</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('/timesheets')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition"
                >
                  <Clock className="w-4 h-4 text-indigo-600 mb-1" />
                  <p className="font-bold text-slate-800 text-xs">Timesheets</p>
                  <p className="text-[10px] text-slate-400">Fill &amp; approve</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('/donors')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 text-left transition"
                >
                  <Building2 className="w-4 h-4 text-amber-600 mb-1" />
                  <p className="font-bold text-slate-800 text-xs">Donor List</p>
                  <p className="text-[10px] text-slate-400">Institutional grants</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('/reports')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 text-left transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-purple-600 mb-1" />
                  <p className="font-bold text-slate-800 text-xs">Reports</p>
                  <p className="text-[10px] text-slate-400">Donor summaries</p>
                </button>
              </div>
            </div>
          )}

          {/* Projects Results */}
          {(activeCategory === 'ALL' || activeCategory === 'PROJECTS') && filteredProjects.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] px-1 flex items-center justify-between">
                <span>Projects &amp; Grants ({filteredProjects.length})</span>
                <span className="text-[10px] text-slate-400 lowercase">click to view board</span>
              </span>
              <div className="space-y-1">
                {filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProject(p.id)}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                        {p.sector?.slice(0, 2) || 'PR'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate text-xs">
                          <span className="text-emerald-700 mr-1.5 font-mono">[{p.code}]</span>
                          {p.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {p.country} • Budget: {p.currency} {p.totalBudget?.toLocaleString()} • {p.fundingStatus || 'ACTIVE'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Results */}
          {(activeCategory === 'ALL' || activeCategory === 'TASKS') && filteredTasks.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] px-1 block">
                Tasks &amp; To-Dos ({filteredTasks.length})
              </span>
              <div className="space-y-1">
                {filteredTasks.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleNavigate('/tasks')}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate text-xs">{t.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          Assigned to: {t.assigneeName || 'Unassigned'} • Due: {t.plannedEndDate || 'TBD'} • {t.status}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold shrink-0">
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Donors Results */}
          {(activeCategory === 'ALL' || activeCategory === 'DONORS') && filteredDonors.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] px-1 block">
                Donors &amp; Grant Agencies ({filteredDonors.length})
              </span>
              <div className="space-y-1">
                {filteredDonors.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleNavigate('/donors')}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/50 flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate text-xs">{d.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          Code: {d.code} • Contact: {d.contactPerson} ({d.email})
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold shrink-0">
                      {d.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Results */}
          {(activeCategory === 'ALL' || activeCategory === 'REPORTS') && sampleReports.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] px-1 block">
                Reports &amp; Summaries ({sampleReports.length})
              </span>
              <div className="space-y-1">
                {sampleReports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleNavigate(r.path)}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-purple-300 hover:bg-purple-50/50 flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <FileSpreadsheet className="w-4 h-4 text-purple-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate text-xs">{r.title}</p>
                        <p className="text-[11px] text-slate-500">{r.category}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files & Documents Results */}
          {(activeCategory === 'ALL' || activeCategory === 'FILES') && sampleFiles.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] px-1 block">
                Files &amp; Attachments ({sampleFiles.length})
              </span>
              <div className="space-y-1">
                {sampleFiles.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => handleNavigate(f.path)}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate text-xs">{f.name}</p>
                        <p className="text-[11px] text-slate-500">{f.type} • {f.size}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timesheets in Search */}
          {searchTerm && filteredTimesheets.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] px-1 block">
                Timesheets ({filteredTimesheets.length})
              </span>
              <div className="space-y-1">
                {filteredTimesheets.slice(0, 3).map((ts) => (
                  <div
                    key={ts.id}
                    onClick={() => handleNavigate('/timesheets')}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50 flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate text-xs">{ts.userName} - {ts.activityCategory}</p>
                        <p className="text-[11px] text-slate-500 truncate">{ts.description} ({ts.hours} hrs)</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {ts.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zero Results State */}
          {searchTerm && 
            filteredTasks.length === 0 && 
            filteredProjects.length === 0 && 
            filteredDonors.length === 0 && 
            sampleReports.length === 0 && 
            sampleFiles.length === 0 && (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No results found for &ldquo;{searchTerm}&rdquo;</p>
                <p className="text-[11px] text-slate-400">Try searching for a project code, donor name, task, or report title.</p>
              </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>Search Milous Project Workstation</span>
          <span className="font-mono text-[10px]">Esc to close</span>
        </div>

      </div>
    </div>
  );
};
