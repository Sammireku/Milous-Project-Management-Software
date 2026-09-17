import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Filter, 
  LayoutGrid, 
  Table as TableIcon,
  X,
  Edit2,
  Trash2,
  DollarSign,
  FileText,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { Vendor, VendorCategory, VendorComplianceStatus } from '../../types';
import { SpreadsheetTableView, ColumnDef } from '../common/SpreadsheetTableView';

const VENDOR_CATEGORIES: { id: VendorCategory; label: string }[] = [
  { id: 'SUPPLIES', label: 'Field Supplies & Materials' },
  { id: 'LOGISTICS', label: 'Logistics & Transport' },
  { id: 'CONSTRUCTION', label: 'Civil Works & Construction' },
  { id: 'CONSULTING', label: 'Consulting & Technical Advisory' },
  { id: 'EQUIPMENT', label: 'Heavy Machinery & Equipment' },
  { id: 'WASH_ENGINEERING', label: 'WASH & Hydro-Engineering' },
  { id: 'MEDICAL', label: 'Pharmaceutical & Medical' },
  { id: 'OTHER', label: 'General Services / Other' },
];

export const VendorDatabaseView: React.FC = () => {
  const { vendors, createVendor, updateVendor, deleteVendor } = useFirestore();
  const { permissions, currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [complianceFilter, setComplianceFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('TABLE');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<VendorCategory>('SUPPLIES');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTaxId, setFormTaxId] = useState('');
  const [formCountry, setFormCountry] = useState('Ghana');
  const [formLocation, setFormLocation] = useState('');
  const [formComplianceStatus, setFormComplianceStatus] = useState<VendorComplianceStatus>('VETTED');
  const [formRating, setFormRating] = useState<number>(4);
  const [formBankDetails, setFormBankDetails] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (categoryFilter !== 'ALL' && v.category !== categoryFilter) return false;
      if (complianceFilter !== 'ALL' && v.complianceStatus !== complianceFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = v.name.toLowerCase().includes(q);
        const matchesContact = v.contactPerson?.toLowerCase().includes(q);
        const matchesTax = v.taxId?.toLowerCase().includes(q);
        const matchesLocation = v.location?.toLowerCase().includes(q);
        const matchesCategory = v.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesContact && !matchesTax && !matchesLocation && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [vendors, categoryFilter, complianceFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = vendors.length;
    const vetted = vendors.filter((v) => v.complianceStatus === 'VETTED').length;
    const pending = vendors.filter((v) => v.complianceStatus === 'PENDING').length;
    const flagged = vendors.filter((v) => v.complianceStatus === 'FLAGGED').length;
    const totalPaid = vendors.reduce((sum, v) => sum + (v.totalPaidAmount || 0), 0);
    return { total, vetted, pending, flagged, totalPaid };
  }, [vendors]);

  const handleOpenCreateModal = () => {
    setEditingVendor(null);
    setFormName('');
    setFormCategory('SUPPLIES');
    setFormContactPerson('');
    setFormEmail('');
    setFormPhone('');
    setFormTaxId(`TIN-GH-C00${Math.floor(1000000 + Math.random() * 9000000)}`);
    setFormCountry('Ghana');
    setFormLocation('Tamale / Northern Region');
    setFormComplianceStatus('VETTED');
    setFormRating(4);
    setFormBankDetails('');
    setFormNotes('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormName(vendor.name);
    setFormCategory(vendor.category);
    setFormContactPerson(vendor.contactPerson);
    setFormEmail(vendor.email);
    setFormPhone(vendor.phone);
    setFormTaxId(vendor.taxId);
    setFormCountry(vendor.country);
    setFormLocation(vendor.location);
    setFormComplianceStatus(vendor.complianceStatus);
    setFormRating(vendor.rating);
    setFormBankDetails(vendor.bankDetails || '');
    setFormNotes(vendor.notes || '');
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingVendor) {
      await updateVendor(editingVendor.id, {
        name: formName.trim(),
        category: formCategory,
        contactPerson: formContactPerson.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        taxId: formTaxId.trim(),
        country: formCountry.trim(),
        location: formLocation.trim(),
        complianceStatus: formComplianceStatus,
        rating: formRating,
        bankDetails: formBankDetails.trim(),
        notes: formNotes.trim(),
      });
    } else {
      await createVendor({
        name: formName.trim(),
        category: formCategory,
        contactPerson: formContactPerson.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        taxId: formTaxId.trim(),
        country: formCountry.trim(),
        location: formLocation.trim(),
        complianceStatus: formComplianceStatus,
        rating: formRating,
        bankDetails: formBankDetails.trim(),
        notes: formNotes.trim(),
        linkedExpenseCount: 0,
        totalPaidAmount: 0,
        currency: 'USD',
      });
    }

    setIsCreateModalOpen(false);
  };

  const handleDelete = async (vendor: Vendor) => {
    if (window.confirm(`Remove vendor "${vendor.name}" from the active database?`)) {
      await deleteVendor(vendor.id);
    }
  };

  // Table Columns definition for SpreadsheetTableView
  const vendorColumns: ColumnDef<Vendor>[] = [
    {
      key: 'name',
      header: 'Vendor Name',
      editable: true,
      width: '220px',
      render: (v) => (
        <div>
          <p className="font-bold text-slate-900">{v.name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{v.taxId}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      width: '150px',
      render: (v) => (
        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
          {v.category.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'complianceStatus',
      header: 'Compliance Status',
      width: '140px',
      render: (v) => {
        if (v.complianceStatus === 'VETTED') {
          return (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Vetted &amp; Approved</span>
            </span>
          );
        } else if (v.complianceStatus === 'PENDING') {
          return (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Audit Pending</span>
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              <span>Flagged / Audit Hold</span>
            </span>
          );
        }
      },
    },
    {
      key: 'contactPerson',
      header: 'Key Contact',
      width: '160px',
      render: (v) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{v.contactPerson}</p>
          <p className="text-[10px] text-slate-500 truncate">{v.phone}</p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      width: '140px',
      render: (v) => (
        <span className="text-xs text-slate-600 flex items-center space-x-1">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{v.location}</span>
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Vetting Rating',
      width: '110px',
      render: (v) => (
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-3 h-3 ${
                s <= v.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
              }`}
            />
          ))}
          <span className="text-[10px] font-mono text-slate-500 ml-1">({v.rating}/5)</span>
        </div>
      ),
    },
    {
      key: 'totalPaidAmount',
      header: 'Cumulative Disbursements',
      width: '160px',
      render: (v) => (
        <div>
          <span className="font-bold text-slate-900 font-mono">
            ${(v.totalPaidAmount || 0).toLocaleString()} {v.currency || 'USD'}
          </span>
          <span className="block text-[10px] text-slate-400 font-medium">
            {v.linkedExpenseCount || 0} disbursements
          </span>
        </div>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      width: '100px',
      render: (v) => (
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => handleOpenEditModal(v)}
            className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
            title="Edit Vendor"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(v)}
            className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
            title="Remove Vendor"
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
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Enterprise Vendor Database &amp; Procurement Registry
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain vetted NGO suppliers, TIN tax verifications, compliance audits, and disbursement histories.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Switcher */}
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
              <span>Registry Table</span>
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
              <span>Directory Cards</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Register New Vendor</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Vendors</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{metrics.total}</p>
          <span className="text-[10px] text-slate-500 font-medium">Approved service providers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Vetted &amp; Compliant</span>
          </span>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{metrics.vetted}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Eligible for disbursements</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center space-x-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Audit In Progress</span>
          </span>
          <p className="text-2xl font-black text-amber-700 mt-1 font-mono">{metrics.pending}</p>
          <span className="text-[10px] text-amber-600 font-medium">Documentation pending</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Flagged / Audit Hold</span>
          </span>
          <p className="text-2xl font-black text-rose-700 mt-1 font-mono">{metrics.flagged}</p>
          <span className="text-[10px] text-rose-600 font-medium">Payment holds enforced</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Disbursements</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
            ${metrics.totalPaid.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Cumulative payments</span>
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
              placeholder="Search vendor by name, TIN number, location, or contact person..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {VENDOR_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Compliance Statuses</option>
            <option value="VETTED">Vetted &amp; Approved</option>
            <option value="PENDING">Audit Pending</option>
            <option value="FLAGGED">Flagged / Hold</option>
          </select>

          {(searchQuery || categoryFilter !== 'ALL' || complianceFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
                setComplianceFilter('ALL');
              }}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-900 font-semibold transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Content Display: Table or Card Grid */}
      {viewMode === 'TABLE' ? (
        <SpreadsheetTableView
          title="Vetted Procurement Vendor Database"
          data={filteredVendors}
          columns={vendorColumns}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3.5 shadow-xs hover:shadow-md transition-all relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                    {vendor.category.replace('_', ' ')}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 truncate mt-1">
                    {vendor.name}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {vendor.taxId}
                  </p>
                </div>

                <div className="shrink-0">
                  {vendor.complianceStatus === 'VETTED' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Vetted</span>
                    </span>
                  ) : vendor.complianceStatus === 'PENDING' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>Pending</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center space-x-1">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      <span>Flagged</span>
                    </span>
                  )}
                </div>
              </div>

              {vendor.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-150 line-clamp-2 leading-relaxed">
                  {vendor.notes}
                </p>
              )}

              <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Contact:</span>
                  <span className="font-bold text-slate-800">{vendor.contactPerson}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-medium text-slate-700">{vendor.location}, {vendor.country}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-mono text-slate-700">{vendor.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Rating:</span>
                  <div className="flex items-center space-x-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= vendor.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100/60 font-bold">
                  <span className="text-slate-500">Paid to Date:</span>
                  <span className="text-emerald-700 font-mono">
                    ${(vendor.totalPaidAmount || 0).toLocaleString()} USD
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(vendor)}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(vendor)}
                  className="px-2 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Vendor Modal Dialog */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingVendor ? 'Edit Vendor Record' : 'Register New Procurement Vendor'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Tamale Water Rig & Engineering Ltd"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Procurement Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as VendorCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
                  >
                    {VENDOR_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tax ID / TIN Number *</label>
                  <input
                    type="text"
                    required
                    value={formTaxId}
                    onChange={(e) => setFormTaxId(e.target.value)}
                    placeholder="TIN-GH-C00..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Officer Name</label>
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="e.g. Alhaji Ibrahim"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+233 24 000 0000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="procurement@vendor.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location / District</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Tamale Metro, Northern Region"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Compliance Audit Status</label>
                  <select
                    value={formComplianceStatus}
                    onChange={(e) => setFormComplianceStatus(e.target.value as VendorComplianceStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
                  >
                    <option value="VETTED">Vetted &amp; Approved (Clean Audit)</option>
                    <option value="PENDING">Audit Documentation Pending</option>
                    <option value="FLAGGED">Flagged / Payment Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Performance Rating (1-5)</label>
                  <select
                    value={formRating}
                    onChange={(e) => setFormRating(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
                  >
                    <option value={5}>5 Stars - Outstanding Quality &amp; Delivery</option>
                    <option value={4}>4 Stars - High Reliability</option>
                    <option value={3}>3 Stars - Standard / Acceptable</option>
                    <option value={2}>2 Stars - Needs Improvement</option>
                    <option value={1}>1 Star - High Risk / Unsatisfactory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank &amp; Payment Routing Details</label>
                <input
                  type="text"
                  value={formBankDetails}
                  onChange={(e) => setFormBankDetails(e.target.value)}
                  placeholder="e.g. Ecobank Ghana - Account: 014829103948 - Branch: Tamale Main"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audit Notes &amp; Observations</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Notes on field performance, environmental safety, compliance certificate expiry dates..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
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
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-xs"
                >
                  {editingVendor ? 'Save Changes' : 'Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDatabaseView;
