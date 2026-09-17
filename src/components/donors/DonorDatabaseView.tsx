import React, { useState, useMemo } from 'react';
import { 
  FolderKanban, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Globe, 
  FileText, 
  Edit2, 
  Trash2, 
  X, 
  LayoutGrid, 
  Table as TableIcon,
  Building,
  Landmark,
  ExternalLink,
  Award
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { Donor, DonorType } from '../../types';
import { SpreadsheetTableView, ColumnDef } from '../common/SpreadsheetTableView';

const DONOR_TYPES: { id: DonorType; label: string }[] = [
  { id: 'BILATERAL', label: 'Bilateral Government Agency' },
  { id: 'MULTILATERAL', label: 'Multilateral Institution' },
  { id: 'FOUNDATION', label: 'Philanthropic Foundation' },
  { id: 'UN_AGENCY', label: 'United Nations Agency' },
  { id: 'GOVERNMENT', label: 'National Host Government' },
  { id: 'OTHER', label: 'Other Trust Fund' },
];

export const DonorDatabaseView: React.FC = () => {
  const { donors, createDonor, updateDonor, deleteDonor, projects } = useFirestore();
  const { permissions, currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('TABLE');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<DonorType>('BILATERAL');
  const [formOfficerName, setFormOfficerName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formComplianceFramework, setFormComplianceFramework] = useState('2 CFR 200 Uniform Guidance');
  const [formDefaultCurrency, setFormDefaultCurrency] = useState('USD');
  const [formCommittedFunds, setFormCommittedFunds] = useState<number>(500000);
  const [formAuditFrequency, setFormAuditFrequency] = useState<'MONTHLY' | 'QUARTERLY' | 'BI_ANNUAL' | 'ANNUAL'>('QUARTERLY');
  const [formWebsite, setFormWebsite] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Filtered Donors
  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      if (typeFilter !== 'ALL' && d.type !== typeFilter) return false;
      if (currencyFilter !== 'ALL' && d.defaultCurrency !== currencyFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = d.name.toLowerCase().includes(q);
        const matchesCode = d.code.toLowerCase().includes(q);
        const matchesOfficer = d.contactOfficerName?.toLowerCase().includes(q);
        const matchesFramework = d.complianceFramework?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesOfficer && !matchesFramework) {
          return false;
        }
      }
      return true;
    });
  }, [donors, typeFilter, currencyFilter, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalDonors = donors.length;
    const totalCommitted = donors.reduce((acc, d) => acc + (d.totalCommittedFunds || 0), 0);
    const activeGrants = donors.reduce((acc, d) => acc + (d.activeGrantCount || 0), 0);
    const frameworksCount = new Set(donors.map((d) => d.complianceFramework)).size;
    return { totalDonors, totalCommitted, activeGrants, frameworksCount };
  }, [donors]);

  const handleOpenCreateModal = () => {
    setEditingDonor(null);
    setFormName('');
    setFormCode('');
    setFormType('BILATERAL');
    setFormOfficerName('');
    setFormEmail('');
    setFormPhone('');
    setFormComplianceFramework('2 CFR 200 Uniform Guidance & ADS 303');
    setFormDefaultCurrency('USD');
    setFormCommittedFunds(750000);
    setFormAuditFrequency('QUARTERLY');
    setFormWebsite('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (donor: Donor) => {
    setEditingDonor(donor);
    setFormName(donor.name);
    setFormCode(donor.code);
    setFormType(donor.type);
    setFormOfficerName(donor.contactOfficerName);
    setFormEmail(donor.contactEmail);
    setFormPhone(donor.contactPhone || '');
    setFormComplianceFramework(donor.complianceFramework);
    setFormDefaultCurrency(donor.defaultCurrency);
    setFormCommittedFunds(donor.totalCommittedFunds);
    setFormAuditFrequency(donor.auditFrequency);
    setFormWebsite(donor.website || '');
    setFormNotes(donor.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    if (editingDonor) {
      await updateDonor(editingDonor.id, {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        type: formType,
        contactOfficerName: formOfficerName.trim(),
        contactEmail: formEmail.trim(),
        contactPhone: formPhone.trim(),
        complianceFramework: formComplianceFramework.trim(),
        defaultCurrency: formDefaultCurrency,
        totalCommittedFunds: formCommittedFunds,
        auditFrequency: formAuditFrequency,
        website: formWebsite.trim(),
        notes: formNotes.trim(),
      });
    } else {
      await createDonor({
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        type: formType,
        contactOfficerName: formOfficerName.trim(),
        contactEmail: formEmail.trim(),
        contactPhone: formPhone.trim(),
        complianceFramework: formComplianceFramework.trim(),
        defaultCurrency: formDefaultCurrency,
        totalCommittedFunds: formCommittedFunds,
        activeGrantCount: 1,
        auditFrequency: formAuditFrequency,
        website: formWebsite.trim(),
        notes: formNotes.trim(),
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (donor: Donor) => {
    if (window.confirm(`Remove donor agency "${donor.name}" [${donor.code}] from portfolio?`)) {
      await deleteDonor(donor.id);
    }
  };

  // Columns for Spreadsheet Table
  const donorColumns: ColumnDef<Donor>[] = [
    {
      key: 'code',
      header: 'Donor Code',
      width: '110px',
      render: (d) => (
        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-slate-900 text-emerald-400">
          {d.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Agency / Foundation Name',
      width: '260px',
      render: (d) => (
        <div>
          <p className="font-bold text-slate-900">{d.name}</p>
          <span className="text-[10px] text-slate-400 font-medium">
            {d.type.replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      key: 'complianceFramework',
      header: 'Compliance Framework',
      width: '200px',
      render: (d) => (
        <div className="flex items-center space-x-1 text-xs font-semibold text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{d.complianceFramework}</span>
        </div>
      ),
    },
    {
      key: 'totalCommittedFunds',
      header: 'Total Committed Funds',
      width: '160px',
      render: (d) => (
        <div>
          <span className="font-bold text-slate-900 font-mono">
            ${(d.totalCommittedFunds || 0).toLocaleString()} {d.defaultCurrency}
          </span>
          <span className="block text-[10px] text-slate-400 font-medium">
            {d.activeGrantCount} active grant lines
          </span>
        </div>
      ),
    },
    {
      key: 'contactOfficerName',
      header: 'Agreement Officer',
      width: '180px',
      render: (d) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{d.contactOfficerName}</p>
          <p className="text-[10px] text-slate-400 truncate">{d.contactEmail}</p>
        </div>
      ),
    },
    {
      key: 'auditFrequency',
      header: 'Audit Cycle',
      width: '120px',
      render: (d) => (
        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
          {d.auditFrequency}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      width: '90px',
      render: (d) => (
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => handleOpenEditModal(d)}
            className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
            title="Edit Donor"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(d)}
            className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
            title="Remove Donor"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Institutional Donor Database &amp; Grant Agreements
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Central repository for bilateral and multilateral donor agencies, audit compliance frameworks, and currency commitments.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'TABLE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grants Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'CARDS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
              <span>Agency Cards</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Donor Agency</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institutional Donors</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{metrics.totalDonors}</p>
          <span className="text-[10px] text-slate-500 font-medium">Bilateral &amp; multilateral partners</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center space-x-1">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span>Committed Portfolio</span>
          </span>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            ${metrics.totalCommitted.toLocaleString()} USD
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Across active grant agreements</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center space-x-1">
            <Award className="w-3 h-3 text-blue-600" />
            <span>Active Grant Lines</span>
          </span>
          <p className="text-2xl font-black text-blue-700 mt-1 font-mono">{metrics.activeGrants}</p>
          <span className="text-[10px] text-blue-600 font-medium">Deployed across field projects</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-indigo-600" />
            <span>Compliance Frameworks</span>
          </span>
          <p className="text-2xl font-black text-indigo-700 mt-1 font-mono">{metrics.frameworksCount}</p>
          <span className="text-[10px] text-indigo-600 font-medium">Standardized audit protocols</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by donor code (e.g. USAID), name, agreement officer, or framework..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Donor Types</option>
            {DONOR_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Currencies</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CHF">CHF (CHF)</option>
          </select>

          {(searchQuery || typeFilter !== 'ALL' || currencyFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
                setCurrencyFilter('ALL');
              }}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-900 font-semibold transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Content Display: Table or Cards */}
      {viewMode === 'TABLE' ? (
        <SpreadsheetTableView
          title="Institutional Donor Registry &amp; Compliance Matrix"
          data={filteredDonors}
          columns={donorColumns}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDonors.map((donor) => (
            <div
              key={donor.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3.5 shadow-xs hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 text-emerald-400">
                    {donor.code}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-2 bg-slate-100 px-2 py-0.5 rounded">
                    {donor.type.replace('_', ' ')}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-2 leading-snug">
                    {donor.name}
                  </h3>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {donor.auditFrequency}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Compliance Framework</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  {donor.complianceFramework}
                </p>
              </div>

              {donor.notes && (
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {donor.notes}
                </p>
              )}

              <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Agreement Officer:</span>
                  <span className="font-bold text-slate-800">{donor.contactOfficerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-700 truncate">{donor.contactEmail}</span>
                </div>
                <div className="flex items-center justify-between font-bold pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Committed Grant Funding:</span>
                  <span className="text-emerald-700 font-mono">
                    ${(donor.totalCommittedFunds || 0).toLocaleString()} {donor.defaultCurrency}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(donor)}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(donor)}
                  className="px-2 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Donor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Landmark className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingDonor ? 'Edit Donor Agency' : 'Register New Donor Agency'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Donor Agency Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. USAID Bureau for Humanitarian Assistance"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Donor Code / Acronym *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. USAID, ECHO, UNICEF, FCDO"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold uppercase focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Donor Classification</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as DonorType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
                  >
                    {DONOR_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Agreement / Desk Officer</label>
                  <input
                    type="text"
                    value={formOfficerName}
                    onChange={(e) => setFormOfficerName(e.target.value)}
                    placeholder="e.g. Rachel Vance"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Officer Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="rvance@usaid.gov"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Grant Compliance Framework *</label>
                <input
                  type="text"
                  required
                  value={formComplianceFramework}
                  onChange={(e) => setFormComplianceFramework(e.target.value)}
                  placeholder="e.g. 2 CFR 200 Uniform Guidance, ECHO Single Form Annex II"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Currency</label>
                  <select
                    value={formDefaultCurrency}
                    onChange={(e) => setFormDefaultCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CHF">CHF (CHF)</option>
                    <option value="GHS">GHS (GH₵)</option>
                    <option value="KES">KES (KSh)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Committed Funds</label>
                  <input
                    type="number"
                    value={formCommittedFunds}
                    onChange={(e) => setFormCommittedFunds(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Audit Reporting Cycle</label>
                  <select
                    value={formAuditFrequency}
                    onChange={(e) => setFormAuditFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
                  >
                    <option value="MONTHLY">Monthly Reporting</option>
                    <option value="QUARTERLY">Quarterly Reporting</option>
                    <option value="BI_ANNUAL">Bi-Annual (6 Months)</option>
                    <option value="ANNUAL">Annual Comprehensive Audit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Portal / Website</label>
                  <input
                    type="url"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    placeholder="https://www.usaid.gov"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Compliance &amp; Reporting Guidelines</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Special clauses, nationality restrictions on procurement, environmental requirements..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-xs"
                >
                  {editingDonor ? 'Save Changes' : 'Add Donor Agency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorDatabaseView;
