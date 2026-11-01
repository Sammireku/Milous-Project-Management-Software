import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from '../../context/FirestoreContext';
import { 
  Search, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  Building2, 
  Clock,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  FolderKanban,
  Sparkles,
  DollarSign
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenQuickCreate?: (type: 'project' | 'task' | 'expense') => void;
}

interface SearchItem {
  id: string;
  type: 'PROJECT' | 'TASK' | 'DOCUMENT' | 'DONOR' | 'TIMESHEET' | 'REPORT';
  title: string;
  subtitle: string;
  badge?: string;
  path?: string;
  action?: () => void;
  icon: React.ReactNode;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const navigate = useNavigate();
  const { 
    tasks, 
    projects, 
    donors, 
    vendors, 
    timesheets,
    setActiveProjectId, 
    commandPaletteOpen, 
    setCommandPaletteOpen 
  } = useFirestore();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'PROJECTS' | 'TASKS' | 'DOCUMENTS' | 'DONORS' | 'TIMESHEETS'>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = propIsOpen !== undefined ? propIsOpen : commandPaletteOpen;

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setCommandPaletteOpen(false);
    }
    setSearchTerm('');
    setSelectedIndex(0);
  };

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle Cmd+K / Ctrl+K shortcut globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
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

  const term = searchTerm.toLowerCase().trim();

  // Pre-configured Documents & Proposals Database
  const sampleDocuments = [
    { 
      id: 'doc-01', 
      title: 'USAID BHA Solar WASH Grant Agreement Signed', 
      type: 'DOCUMENT' as const, 
      subtitle: '2.4 MB · Grant Agreement · USAID BHA',
      path: '/doc-hub'
    },
    { 
      id: 'doc-02', 
      title: 'ECHO Single Form Submission Draft (West Africa Emergency)', 
      type: 'DOCUMENT' as const, 
      subtitle: '1.8 MB · Proposal Narrative · EU ECHO',
      path: '/doc-hub'
    },
    { 
      id: 'doc-03', 
      title: 'Field Borehole Inspection Hydrogeological Report', 
      type: 'DOCUMENT' as const, 
      subtitle: '3.1 MB · Field Technical Survey · Ghana WASH',
      path: '/doc-hub'
    },
    { 
      id: 'doc-04', 
      title: 'UNHCR Cross-Border Refugee Water Network Audit Brief', 
      type: 'DOCUMENT' as const, 
      subtitle: '1.2 MB · Fiduciary Compliance Audit · UNHCR',
      path: '/doc-hub'
    },
    { 
      id: 'doc-05', 
      title: 'Maternal Clinic Solar Refrigerator Cold-Chain Log', 
      type: 'DOCUMENT' as const, 
      subtitle: '950 KB · Health M&E Audit · Sierra Leone Health',
      path: '/reports'
    },
    { 
      id: 'doc-06', 
      title: 'Global Fund Health Infrastructure Grant Proposal', 
      type: 'DOCUMENT' as const, 
      subtitle: 'Grant Proposal · $850,000 · Approved',
      path: '/proposals'
    },
  ];

  // Map into flat SearchItem array
  const searchResults = React.useMemo(() => {
    const items: SearchItem[] = [];

    // Projects
    if (activeCategory === 'ALL' || activeCategory === 'PROJECTS') {
      projects.forEach((p) => {
        if (!term || p.title.toLowerCase().includes(term) || p.code.toLowerCase().includes(term) || p.sector.toLowerCase().includes(term) || p.country.toLowerCase().includes(term)) {
          items.push({
            id: `prj-${p.id}`,
            type: 'PROJECT',
            title: `[${p.code}] ${p.title}`,
            subtitle: `${p.sector} · ${p.country} · Budget: $${p.totalBudget?.toLocaleString()} USD · ${p.status}`,
            badge: p.status,
            action: () => {
              setActiveProjectId(p.id);
              navigate('/projects');
              handleClose();
            },
            icon: <FolderKanban className="w-4 h-4 text-emerald-600 shrink-0" />
          });
        }
      });
    }

    // Tasks
    if (activeCategory === 'ALL' || activeCategory === 'TASKS') {
      tasks.forEach((t) => {
        if (!term || t.title.toLowerCase().includes(term) || (t.description && t.description.toLowerCase().includes(term)) || (t.assigneeName && t.assigneeName.toLowerCase().includes(term))) {
          items.push({
            id: `tsk-${t.id}`,
            type: 'TASK',
            title: t.title,
            subtitle: `Assigned: ${t.assigneeName || 'Unassigned'} · Due: ${t.plannedEndDate || 'TBD'} · Status: ${t.status}`,
            badge: t.priority || 'MEDIUM',
            action: () => {
              navigate('/tasks');
              handleClose();
            },
            icon: <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          });
        }
      });
    }

    // Documents
    if (activeCategory === 'ALL' || activeCategory === 'DOCUMENTS') {
      sampleDocuments.forEach((d) => {
        if (!term || d.title.toLowerCase().includes(term) || d.subtitle.toLowerCase().includes(term)) {
          items.push({
            id: d.id,
            type: 'DOCUMENT',
            title: d.title,
            subtitle: d.subtitle,
            badge: 'PDF',
            action: () => {
              navigate(d.path);
              handleClose();
            },
            icon: <FileText className="w-4 h-4 text-amber-600 shrink-0" />
          });
        }
      });
    }

    // Donors
    if (activeCategory === 'ALL' || activeCategory === 'DONORS') {
      donors.forEach((d) => {
        if (!term || d.name.toLowerCase().includes(term) || d.code.toLowerCase().includes(term) || d.type.toLowerCase().includes(term)) {
          items.push({
            id: `dnr-${d.id}`,
            type: 'DONOR',
            title: `[${d.code}] ${d.name}`,
            subtitle: `${d.type} · Officer: ${d.contactPerson || d.contactOfficerName || 'Grant Liaison'} (${d.email || d.contactEmail || ''})`,
            badge: d.type,
            action: () => {
              navigate('/donors');
              handleClose();
            },
            icon: <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
          });
        }
      });
    }

    // Timesheets
    if (activeCategory === 'ALL' || activeCategory === 'TIMESHEETS') {
      timesheets.forEach((ts) => {
        if (!term || ts.userName.toLowerCase().includes(term) || ts.taskTitle?.toLowerCase().includes(term) || ts.activityCategory.toLowerCase().includes(term)) {
          items.push({
            id: `ts-${ts.id}`,
            type: 'TIMESHEET',
            title: `${ts.userName} · ${ts.activityCategory} (${ts.hours} hrs)`,
            subtitle: `${ts.projectTitle} · ${ts.description} · Status: ${ts.status}`,
            badge: `${ts.hours}h`,
            action: () => {
              navigate('/timesheets');
              handleClose();
            },
            icon: <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
          });
        }
      });
    }

    return items;
  }, [term, activeCategory, projects, tasks, donors, timesheets]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm, activeCategory]);

  // Handle keyboard navigation (ArrowUp, ArrowDown, Enter)
  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedItem = searchResults[selectedIndex];
      if (selectedItem && selectedItem.action) {
        selectedItem.action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/90">
          <Search className="w-5 h-5 text-emerald-600 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDownInput}
            placeholder="Type to search projects, tasks, documents, proposals, donors..."
            className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none placeholder-slate-400"
          />
          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded-md shadow-2xs">
              Cmd+K
            </kbd>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs Bar */}
        <div className="flex items-center space-x-1 px-4 py-2 border-b border-slate-100 bg-white overflow-x-auto text-xs">
          {(['ALL', 'PROJECTS', 'TASKS', 'DOCUMENTS', 'DONORS', 'TIMESHEETS'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full font-bold text-[11px] transition shrink-0 cursor-pointer ${
                activeCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'ALL' ? '🌟 All Types' : cat}
            </button>
          ))}
        </div>

        {/* Search Results Body */}
        <div className="overflow-y-auto p-3 space-y-2 text-xs min-h-[220px]">
          
          {/* Quick Shortcuts if no search term */}
          {!searchTerm && activeCategory === 'ALL' && (
            <div className="p-2 space-y-2">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                Quick Shortcuts &amp; Frequent Modules
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => { navigate('/projects'); handleClose(); }}
                  className="p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-left transition cursor-pointer"
                >
                  <FolderKanban className="w-4 h-4 text-emerald-600 mb-1" />
                  <p className="font-bold text-slate-800 text-xs">Projects &amp; Gantt</p>
                  <p className="text-[10px] text-slate-400">Milestones &amp; critical path</p>
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/doc-hub'); handleClose(); }}
                  className="p-2.5 rounded-2xl bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 text-left transition cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-600 mb-1" />
                  <p className="font-bold text-slate-800 text-xs">Document Hub</p>
                  <p className="text-[10px] text-slate-400">RAG &amp; AI Summarizer</p>
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/tasks'); handleClose(); }}
                  className="p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-left transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mb-1" />
                  <p className="font-bold text-slate-800 text-xs">Kanban Tasks</p>
                  <p className="text-[10px] text-slate-400">Field work &amp; To-dos</p>
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/financials'); handleClose(); }}
                  className="p-2.5 rounded-2xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 text-left transition cursor-pointer"
                >
                  <DollarSign className="w-4 h-4 text-purple-600 mb-1" />
                  <p className="font-bold text-slate-800 text-xs">Financial Ledger</p>
                  <p className="text-[10px] text-slate-400">Donor cost splitting</p>
                </button>
              </div>
            </div>
          )}

          {/* Render Filtered Search Results */}
          {searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
                        : 'bg-white text-slate-900 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-bold truncate text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {item.title}
                        </p>
                        <p className={`text-[11px] truncate font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-700">No matching items found for &ldquo;{searchTerm}&rdquo;</p>
              <p className="text-[11px] text-slate-400">Try searching for project codes, task titles, or document names.</p>
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-3 font-semibold text-[10px]">
            <span><kbd className="font-mono bg-white border border-slate-200 px-1 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-white border border-slate-200 px-1 rounded">↵</kbd> Select</span>
            <span><kbd className="font-mono bg-white border border-slate-200 px-1 rounded">Esc</kbd> Close</span>
          </div>
          <span className="font-bold text-slate-600">Milous Search Engine</span>
        </div>

      </div>
    </div>
  );
};

export default CommandPalette;
