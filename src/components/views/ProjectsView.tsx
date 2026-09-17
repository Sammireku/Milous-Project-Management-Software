import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  FileText,
  ShieldCheck,
  Tag,
  History,
  LayoutGrid,
  CalendarDays,
  Plus,
  X,
  Send
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { Project } from '../../types';
import { AuditLogSidebar } from './AuditLogSidebar';
import { ProjectGanttTimeline } from '../projects/ProjectGanttTimeline';
import { DetailFlyout } from '../common/DetailFlyout';
import { SpreadsheetTableView, ColumnDef } from '../common/SpreadsheetTableView';

export const ProjectsView: React.FC = () => {
  const { projects, activeProjectId, setActiveProjectId, openFlyout, createProject } = useFirestore();
  const { userRole, currentUser } = useAuth();
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'gantt'>('table');
  const [selectedFlyoutProject, setSelectedFlyoutProject] = useState<Project | null>(null);

  // New Project Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newSectorSelect, setNewSectorSelect] = useState('WASH');
  const [newCustomSector, setNewCustomSector] = useState('');
  const [newCurrency, setNewCurrency] = useState('USD');
  const [newBudget, setNewBudget] = useState<number>(250000);
  const [newCountry, setNewCountry] = useState('Ghana');
  const [newLocation, setNewLocation] = useState('Tamale & Northern Region');

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const sector = newSectorSelect === 'CUSTOM'
      ? (newCustomSector.trim() || 'Special Sector Initiative')
      : newSectorSelect;

    await createProject({
      code: newCode.trim() || `GH-${sector.slice(0, 4).toUpperCase()}-${new Date().getFullYear()}`,
      title: newTitle.trim(),
      description: `Targeted ${sector} humanitarian mission in ${newLocation}.`,
      country: newCountry,
      location: newLocation,
      sector,
      status: 'ACTIVE',
      currency: newCurrency,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 86400000).toISOString(),
      donors: [
        {
          donorCode: 'USAID',
          grantCode: `USAID-GRANT-${new Date().getFullYear()}`,
          totalAllocation: Math.round(newBudget * 0.6),
          currency: newCurrency,
          reportingCycle: 'QUARTERLY',
        },
        {
          donorCode: 'EU',
          grantCode: `EU-FED-${new Date().getFullYear()}`,
          totalAllocation: Math.round(newBudget * 0.4),
          currency: newCurrency,
          reportingCycle: 'MONTHLY',
        },
      ],
      totalBudget: newBudget,
      leadManagerId: currentUser?.id || 'usr-pm-01',
      leadManagerName: currentUser?.displayName || 'Kofi Mensah',
      teamMemberIds: [currentUser?.id || 'usr-pm-01'],
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewCode('');
    setNewCustomSector('');
  };

  const projectColumns: ColumnDef<Project>[] = [
    { key: 'code', header: 'Mission Code', editable: true, width: '120px' },
    { key: 'title', header: 'Mission Title', editable: true, width: '220px' },
    { key: 'location', header: 'Location / Region', editable: true, width: '140px' },
    { key: 'sector', header: 'Sector', editable: true, width: '120px' },
    { 
      key: 'status', 
      header: 'Status', 
      width: '120px',
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800">
          {row.status}
        </span>
      )
    },
    { 
      key: 'totalBudget', 
      header: 'Total Grant Budget ($)', 
      editable: true, 
      width: '150px',
      render: (row) => (
        <span className="font-bold text-slate-900 font-mono">
          ${row.totalBudget.toLocaleString()} USD
        </span>
      )
    },
    { key: 'startDate', header: 'Start Date', editable: true, width: '110px' },
    { key: 'endDate', header: 'End Date', editable: true, width: '110px' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>NGO Missions &amp; Grant Portfolios</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage multi-donor grant allocations, reporting cycles, and field project metadata.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Excel Table</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
              <span>Portfolio Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('gantt')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'gantt'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
              <span>Timeline Gantt</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Initiate Mission</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAuditOpen(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Activity History Log</span>
          </button>
        </div>
      </div>

      {/* Audit Log Sidebar Drawer */}
      <AuditLogSidebar
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        selectedProjectId={activeProjectId}
      />

      {/* Detail Flyout Drawer */}
      <DetailFlyout
        isOpen={Boolean(selectedFlyoutProject)}
        onClose={() => setSelectedFlyoutProject(null)}
        entity={selectedFlyoutProject}
      />

      {viewMode === 'table' ? (
        <SpreadsheetTableView
          title="NGO Mission & Grant Portfolios Grid"
          data={projects}
          columns={projectColumns}
        />
      ) : viewMode === 'gantt' ? (
        <ProjectGanttTimeline
          projects={projects}
          onSelectProject={(p) => setSelectedFlyoutProject(p)}
        />
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => {
            const isActive = project.id === activeProjectId;
            return (
              <div
                key={project.id}
                onClick={() => setSelectedFlyoutProject(project)}
                className={`bg-white rounded-2xl border transition-all p-6 space-y-4 cursor-pointer ${
                  isActive
                    ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/10'
                    : 'border-slate-200/80 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Top Row: Code, Status & Active Button */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 text-emerald-400">
                        {project.code}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {project.status}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {project.sector}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-2">
                      {project.title}
                    </h2>
                  </div>

                  {isActive ? (
                    <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active Mission</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveProjectId(project.id);
                      }}
                      className="shrink-0 px-3 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold border border-slate-200 transition"
                    >
                      Select Mission
                    </button>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {project.description}
                </p>

                {/* Meta Details */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{project.location}, {project.country}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Lead: {project.leadManagerName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Ends: {new Date(project.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-800">
                      ${project.totalBudget.toLocaleString()} USD
                    </span>
                  </div>
                </div>

                {/* Donor Grants */}
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Multi-Donor Grant Allocations
                  </h3>
                  <div className="space-y-1.5">
                    {project.donors.map((donor) => (
                      <div
                        key={donor.donorCode}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-150"
                      >
                        <div>
                          <span className="font-bold text-slate-800 mr-2">{donor.donorCode}</span>
                          <span className="font-mono text-[10px] text-slate-500">{donor.grantCode}</span>
                        </div>
                        <div className="font-semibold text-slate-800">
                          ${donor.totalAllocation.toLocaleString()} {donor.currency}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Initiate Mission & Grant Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Initiate New Humanitarian Mission</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mission / Project Name *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Northern Savannah Solar Water Supply Initiative"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Humanitarian Sector *</label>
                <select
                  value={newSectorSelect}
                  onChange={(e) => setNewSectorSelect(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-none"
                >
                  <option value="WASH">WASH (Water, Sanitation &amp; Hygiene)</option>
                  <option value="HEALTH">Health &amp; Nutrition</option>
                  <option value="FOOD_SECURITY">Food Security &amp; Livelihoods</option>
                  <option value="EDUCATION">Education &amp; Child Protection</option>
                  <option value="EMERGENCY_RELIEF">Emergency Relief &amp; Shelter</option>
                  <option value="PROTECTION">Human Rights &amp; Protection</option>
                  <option value="ECONOMIC_DEVELOPMENT">Economic Development</option>
                  <option value="CLIMATE">Climate Resilience &amp; Green Energy</option>
                  <option value="CUSTOM">✏️ Other / Custom Sector (Type below)</option>
                </select>

                {newSectorSelect === 'CUSTOM' && (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <input
                      type="text"
                      required
                      value={newCustomSector}
                      onChange={(e) => setNewCustomSector(e.target.value)}
                      placeholder="Enter custom sector (e.g. Disability Inclusion, Renewable Microgrids)"
                      className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50/50 font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Grant Currency</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-white focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CHF">CHF (CHF)</option>
                    <option value="GHS">GHS (GH₵)</option>
                    <option value="KES">KES (KSh)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Total Grant Budget</label>
                  <input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Country</label>
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">District / Field Base</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition flex items-center space-x-2 shadow-xs"
                >
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Initiate Mission</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

