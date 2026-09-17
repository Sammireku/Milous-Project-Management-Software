import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  FolderKanban, 
  FileText, 
  Building2, 
  CheckSquare, 
  ArrowRight, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Command,
  SlidersHorizontal,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { Project, Task, Vendor, GrantProposal } from '../../types';

type SearchCategory = 'ALL' | 'PROJECTS' | 'DOCUMENTS' | 'VENDORS' | 'TASKS';

interface GlobalSearchProps {
  className?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { 
    projects, 
    tasks, 
    vendors, 
    proposals, 
    setActiveProjectId, 
    openFlyout 
  } = useFirestore();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('milous_recent_searches');
      return saved ? JSON.parse(saved) : ['Water Borehole', 'USAID', 'Audit Report', 'Logistics'];
    } catch {
      return ['Water Borehole', 'USAID', 'Audit Report'];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Documents collection composed of Grant Proposals and standard verified NGO documents
  const staticDocs = useMemo(() => [
    {
      id: 'doc-usaid-award-2026',
      title: 'USAID Grant Award Agreement & Compliance Annexes 2026',
      category: 'Donor Contract',
      date: '2026-01-15',
      type: 'PDF',
      path: '/doc-hub',
    },
    {
      id: 'doc-wash-hydro-survey',
      title: 'Hydrogeological Resistivity Groundwater Report - Ashanti Region',
      category: 'Field Technical Assessment',
      date: '2026-02-10',
      type: 'Spreadsheet / Report',
      path: '/doc-hub',
    },
    {
      id: 'doc-kenema-cold-chain',
      title: 'Kenema Maternal Clinic Cold-Chain Temperature Verification Protocol',
      category: 'Health M&E Inspection',
      date: '2026-03-02',
      type: 'Verification Report',
      path: '/reports',
    },
    {
      id: 'doc-turkana-stem-mou',
      title: 'Turkana County Education Board STEM Digital Labs Partnership MoU',
      category: 'Institutional Agreement',
      date: '2026-02-28',
      type: 'MoU Document',
      path: '/doc-hub',
    },
  ], []);

  // Search filter logic
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    // 1. Projects
    const matchedProjects = (activeCategory === 'ALL' || activeCategory === 'PROJECTS')
      ? projects.filter((p) => 
          p.title?.toLowerCase().includes(q) ||
          p.code?.toLowerCase().includes(q) ||
          p.sector?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.donors?.some((d) => d?.donorCode?.toLowerCase().includes(q))
        ).map((p) => ({
          type: 'PROJECT' as const,
          id: p.id,
          title: p.title,
          subtitle: `[${p.code}] • ${p.sector} • Budget: $${(p.totalBudget || 0).toLocaleString()}`,
          meta: p.status,
          item: p,
        }))
      : [];

    // 2. Documents (Proposals & Doc Hub files)
    const matchedProposals = (activeCategory === 'ALL' || activeCategory === 'DOCUMENTS')
      ? proposals.filter((prop) =>
          prop.title?.toLowerCase().includes(q) ||
          prop.donorId?.toLowerCase().includes(q) ||
          prop.tags?.some((t) => t.toLowerCase().includes(q))
        ).map((prop) => ({
          type: 'DOCUMENT' as const,
          id: prop.id,
          title: prop.title,
          subtitle: `Grant Proposal • Donor: ${prop.donorId} • Stage: ${prop.status}`,
          meta: `$${(prop.requestedAmount || 0).toLocaleString()}`,
          item: prop,
          path: '/proposals',
        }))
      : [];

    const matchedStaticDocs = (activeCategory === 'ALL' || activeCategory === 'DOCUMENTS')
      ? staticDocs.filter((d) =>
          d.title.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q)
        ).map((d) => ({
          type: 'DOCUMENT' as const,
          id: d.id,
          title: d.title,
          subtitle: `${d.category} • ${d.date}`,
          meta: d.type,
          item: d,
          path: d.path,
        }))
      : [];

    // 3. Vendors
    const matchedVendors = (activeCategory === 'ALL' || activeCategory === 'VENDORS')
      ? vendors.filter((v) =>
          v.name?.toLowerCase().includes(q) ||
          v.category?.toLowerCase().includes(q) ||
          v.contactPerson?.toLowerCase().includes(q) ||
          v.email?.toLowerCase().includes(q)
        ).map((v) => ({
          type: 'VENDOR' as const,
          id: v.id,
          title: v.name,
          subtitle: `${v.category} • Contact: ${v.contactPerson || 'Procurement Rep'}`,
          meta: v.status || 'Active',
          item: v,
        }))
      : [];

    // 4. Tasks
    const matchedTasks = (activeCategory === 'ALL' || activeCategory === 'TASKS')
      ? tasks.filter((t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.priority?.toLowerCase().includes(q) ||
          t.status?.toLowerCase().includes(q)
        ).map((t) => ({
          type: 'TASK' as const,
          id: t.id,
          title: t.title,
          subtitle: `Priority: ${t.priority} • Status: ${t.status?.replace('_', ' ')}`,
          meta: t.dueDate ? `Due: ${t.dueDate}` : undefined,
          item: t,
        }))
      : [];

    return [
      ...matchedProjects,
      ...matchedProposals,
      ...matchedStaticDocs,
      ...matchedVendors,
      ...matchedTasks,
    ];
  }, [query, activeCategory, projects, proposals, staticDocs, vendors, tasks]);

  // Counts for category badges
  const categoryCounts = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return { ALL: 0, PROJECTS: 0, DOCUMENTS: 0, VENDORS: 0, TASKS: 0 };

    const projCount = projects.filter((p) => 
      p.title?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || p.sector?.toLowerCase().includes(q)
    ).length;

    const propCount = proposals.filter((p) => 
      p.title?.toLowerCase().includes(q) || p.donorId?.toLowerCase().includes(q)
    ).length;

    const docCount = staticDocs.filter((d) => 
      d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
    ).length + propCount;

    const vendCount = vendors.filter((v) => 
      v.name?.toLowerCase().includes(q) || v.category?.toLowerCase().includes(q)
    ).length;

    const taskCount = tasks.filter((t) => 
      t.title?.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
    ).length;

    return {
      ALL: projCount + docCount + vendCount + taskCount,
      PROJECTS: projCount,
      DOCUMENTS: docCount,
      VENDORS: vendCount,
      TASKS: taskCount,
    };
  }, [query, projects, proposals, staticDocs, vendors, tasks]);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('milous_recent_searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSelectItem = (resultItem: typeof results[0]) => {
    saveRecentSearch(query || resultItem.title);
    setIsOpen(false);

    switch (resultItem.type) {
      case 'PROJECT':
        setActiveProjectId(resultItem.id);
        navigate('/projects');
        break;
      case 'DOCUMENT':
        if ('path' in resultItem && resultItem.path) {
          navigate(resultItem.path);
        } else {
          navigate('/proposals');
        }
        break;
      case 'VENDOR':
        navigate('/vendors');
        break;
      case 'TASK':
        if (resultItem.item?.projectId) {
          setActiveProjectId(resultItem.item.projectId);
        }
        navigate('/tasks');
        openFlyout('task', resultItem.item);
        break;
    }
  };

  // Keyboard navigation through search results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectItem(results[selectedIndex]);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Trigger Button in Nav Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-2xs group"
        title="Search projects, documents, vendors, and tasks (⌘K)"
      >
        <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition" />
        <span className="hidden md:inline font-medium text-slate-500 group-hover:text-slate-900">
          Search projects, documents, vendors, tasks...
        </span>
        <span className="md:hidden font-medium text-slate-500">Search...</span>
        <kbd className="hidden sm:inline-flex items-center space-x-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-3xs">
          <Command className="w-2.5 h-2.5" />
          <span>K</span>
        </kbd>
      </button>

      {/* Full-Featured Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            ref={modalRef}
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150"
            onKeyDown={handleKeyDown}
          >
            {/* Input Header */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/90">
              <Search className="w-5 h-5 text-emerald-600 shrink-0 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search across projects, documents, vendors, and tasks..."
                className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none placeholder-slate-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg mr-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded-md shrink-0 ml-1">
                ESC
              </kbd>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter Pills Bar */}
            <div className="flex items-center space-x-1.5 px-4 py-2 border-b border-slate-100 bg-white overflow-x-auto text-xs">
              {(['ALL', 'PROJECTS', 'DOCUMENTS', 'VENDORS', 'TASKS'] as const).map((cat) => {
                const count = categoryCounts[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat);
                      setSelectedIndex(0);
                    }}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>
                      {cat === 'ALL'
                        ? 'All'
                        : cat === 'PROJECTS'
                        ? 'Projects'
                        : cat === 'DOCUMENTS'
                        ? 'Documents'
                        : cat === 'VENDORS'
                        ? 'Vendors'
                        : 'Tasks'}
                    </span>
                    {query.trim() && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                          activeCategory === cat ? 'bg-slate-800 text-emerald-300' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Results Body or Empty State */}
            <div className="flex-1 overflow-y-auto p-2">
              {query.trim() === '' ? (
                <div className="p-6 space-y-5">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                        Recent Searches
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => setQuery(term)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-semibold border border-slate-200/80 transition cursor-pointer"
                          >
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Shortcut Modules */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                      Quick Navigate
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/projects');
                        }}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/70 text-left transition group"
                      >
                        <FolderKanban className="w-4 h-4 text-emerald-600 mb-1" />
                        <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Projects</p>
                        <p className="text-[10px] text-slate-400">{projects.length} Missions</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/proposals');
                        }}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/70 text-left transition group"
                      >
                        <FileText className="w-4 h-4 text-indigo-600 mb-1" />
                        <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Documents</p>
                        <p className="text-[10px] text-slate-400">{proposals.length + staticDocs.length} Records</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/vendors');
                        }}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50/50 border border-slate-200/70 text-left transition group"
                      >
                        <Building2 className="w-4 h-4 text-purple-600 mb-1" />
                        <p className="text-xs font-bold text-slate-800 group-hover:text-purple-700">Vendors</p>
                        <p className="text-[10px] text-slate-400">{vendors.length} Suppliers</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/tasks');
                        }}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/70 text-left transition group"
                      >
                        <CheckSquare className="w-4 h-4 text-blue-600 mb-1" />
                        <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Tasks</p>
                        <p className="text-[10px] text-slate-400">{tasks.length} Deliverables</p>
                      </button>
                    </div>
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Search className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">No matching records found for &ldquo;{query}&rdquo;</p>
                  <p className="text-[11px] text-slate-400">
                    Try searching by code, partner name, sector, or change the category filter tab.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((res, idx) => {
                    const isSelected = idx === selectedIndex;
                    let typeBadgeBg = 'bg-slate-100 text-slate-700';
                    let typeIcon = <Search className="w-4 h-4 text-slate-500" />;

                    if (res.type === 'PROJECT') {
                      typeBadgeBg = 'bg-emerald-100 text-emerald-800';
                      typeIcon = <FolderKanban className="w-4 h-4 text-emerald-600" />;
                    } else if (res.type === 'DOCUMENT') {
                      typeBadgeBg = 'bg-indigo-100 text-indigo-800';
                      typeIcon = <FileText className="w-4 h-4 text-indigo-600" />;
                    } else if (res.type === 'VENDOR') {
                      typeBadgeBg = 'bg-purple-100 text-purple-800';
                      typeIcon = <Building2 className="w-4 h-4 text-purple-600" />;
                    } else if (res.type === 'TASK') {
                      typeBadgeBg = 'bg-blue-100 text-blue-800';
                      typeIcon = <CheckSquare className="w-4 h-4 text-blue-600" />;
                    }

                    return (
                      <div
                        key={`${res.type}-${res.id}-${idx}`}
                        onClick={() => handleSelectItem(res)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`p-3 rounded-2xl transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected ? 'bg-slate-100/90 ring-1 ring-slate-300' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                            {typeIcon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md ${typeBadgeBg}`}>
                                {res.type}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 truncate">{res.title}</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{res.subtitle}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {res.meta && (
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {res.meta}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer Key Navigation Hints */}
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1">
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">↑</kbd>
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center space-x-1">
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">↵</kbd>
                  <span>Open Item</span>
                </span>
                <span className="flex items-center space-x-1">
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">ESC</kbd>
                  <span>Close</span>
                </span>
              </div>
              <span className="font-semibold text-emerald-700">
                Searching Projects • Documents • Vendors • Tasks
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
