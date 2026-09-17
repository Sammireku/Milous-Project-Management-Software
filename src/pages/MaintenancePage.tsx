import React, { useState } from 'react';
import { useFirestore } from '../context/FirestoreContext';
import { useAuth } from '../context/AuthContext';
import { 
  Wrench, 
  Plus, 
  Search, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  X, 
  Eye, 
  Filter, 
  ChevronRight, 
  Check, 
  Receipt, 
  ShieldCheck,
  Package
} from 'lucide-react';
import { MaintenanceRecord } from '../types';

export const MaintenancePage: React.FC = () => {
  const { 
    maintenanceRecords, 
    createMaintenanceRecord, 
    updateMaintenanceStatus, 
    advanceMaintenanceApproval, 
    vendors 
  } = useFirestore();
  const { user, currentUser, isAdmin, isProjectManager, isCEO } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State
  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<MaintenanceRecord | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [serviceDetails, setServiceDetails] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [cost, setCost] = useState<number>(350);
  const [status, setStatus] = useState<MaintenanceRecord['status']>('PENDING_APPROVAL');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);

  // Vendor Details
  const [vendorName, setVendorName] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');

  // Receipt Upload
  const [uploadedReceiptName, setUploadedReceiptName] = useState('');
  const [isReceiptSimulated, setIsReceiptSimulated] = useState(false);
  const [reviewComment, setReviewComment] = useState('');

  const handleSimulateReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedReceiptName(file.name);
    setIsReceiptSimulated(true);
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !equipmentName.trim() || !vendorName.trim()) return;

    const partsList = partsReplaced.split(',').map((p) => p.trim()).filter(Boolean);

    await createMaintenanceRecord({
      title: title.trim(),
      equipmentName: equipmentName.trim(),
      serviceDetails: serviceDetails.trim(),
      partsReplaced: partsList,
      cost: Number(cost),
      status,
      scheduledDate,
      completedDate: status === 'COMPLETED' ? new Date().toISOString().split('T')[0] : undefined,
      vendorName: vendorName.trim(),
      vendorAddress: vendorAddress.trim() || 'Accra Industrial Area, Plot 4B',
      vendorContact: vendorContact.trim() || 'Lead Engineer',
      vendorPhone: vendorPhone.trim() || '+233 24 400 9988',
      vendorEmail: vendorEmail.trim() || 'service@vendor.com',
      receiptUrl: uploadedReceiptName ? `https://storage.milous.org/receipts/${uploadedReceiptName}` : undefined,
      receiptFileName: uploadedReceiptName || undefined,
      amountPaid: status === 'COMPLETED' ? Number(cost) : 0,
    });

    // Reset Form
    setTitle('');
    setEquipmentName('');
    setServiceDetails('');
    setPartsReplaced('');
    setCost(350);
    setVendorName('');
    setVendorAddress('');
    setVendorContact('');
    setVendorPhone('');
    setVendorEmail('');
    setUploadedReceiptName('');
    setIsReceiptSimulated(false);
    setIsNewRecordModalOpen(false);
  };

  const handleWorkflowAction = async (recId: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES') => {
    await advanceMaintenanceApproval(
      recId,
      action,
      user?.displayName || 'Approver',
      user?.role?.toUpperCase() || 'MANAGER',
      reviewComment
    );
    setReviewComment('');
    setSelectedRecordForDetail(null);
  };

  const filteredRecords = maintenanceRecords.filter((rec) => {
    const matchSearch =
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.serviceDetails.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || rec.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalSpend = maintenanceRecords.reduce((acc, curr) => acc + curr.cost, 0);
  const completedCount = maintenanceRecords.filter((r) => r.status === 'COMPLETED').length;
  const inProgressCount = maintenanceRecords.filter((r) => r.status !== 'COMPLETED' && r.status !== 'REJECTED').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Maintenance &amp; Equipment Tracking</h1>
              <p className="text-xs text-slate-500">
                Manage multi-step work orders, spare parts replacement, receipt uploads, and automatic vendor registry sync.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsNewRecordModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Work Orders</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{maintenanceRecords.length}</span>
            <span className="text-xs text-emerald-600 font-semibold">{completedCount} Completed</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Maintenance Expenditure</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900">${totalSpend.toLocaleString()}</span>
            <span className="text-xs text-slate-500 font-medium">USD total invoiced</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Field Maintenance</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-amber-600">{inProgressCount}</span>
            <span className="text-xs text-amber-600 font-medium">pending signoff</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search work orders by equipment, vendor name, or parts replaced..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING_APPROVAL">Level 1: Ops Awaiting</option>
          <option value="OPS_APPROVED">Level 2: Finance Awaiting</option>
          <option value="FINANCE_APPROVED">Level 3: Technical Repair Awaiting</option>
          <option value="CHANGES_REQUESTED">Revisions Requested</option>
          <option value="REJECTED">Rejected</option>
          <option value="COMPLETED">Completed &amp; Certified</option>
        </select>
      </div>

      {/* Maintenance Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Work Order / Asset</th>
                <th className="py-3 px-4">Vendor & Contact</th>
                <th className="py-3 px-4">Parts Replaced</th>
                <th className="py-3 px-4">Cost ($ USD)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Receipt</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <div>
                        <div>{item.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{item.equipmentName}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{item.vendorName}</div>
                    <div className="text-[10px] text-slate-400">{item.vendorPhone}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {item.partsReplaced.map((part, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                          {part}
                        </span>
                      ))}
                      {item.partsReplaced.length === 0 && (
                        <span className="text-[10px] text-slate-400">None</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    ${item.cost.toLocaleString()}
                  </td>

                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      item.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : item.status === 'PENDING_APPROVAL'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : item.status === 'OPS_APPROVED'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : item.status === 'FINANCE_APPROVED'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : item.status === 'CHANGES_REQUESTED'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {item.status === 'COMPLETED' ? (
                        <span>✓ Completed &amp; Certified</span>
                      ) : item.status === 'PENDING_APPROVAL' ? (
                        <span>L1: Ops Verification</span>
                      ) : item.status === 'OPS_APPROVED' ? (
                        <span>L2: Finance PO Release</span>
                      ) : item.status === 'FINANCE_APPROVED' ? (
                        <span>L3: Repair Signoff</span>
                      ) : item.status === 'CHANGES_REQUESTED' ? (
                        <span>Revision Needed</span>
                      ) : (
                        <span>Rejected</span>
                      )}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {item.receiptFileName ? (
                      <span className="inline-flex items-center space-x-1 text-emerald-600 font-semibold text-[11px]">
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Attached</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Pending Upload</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedRecordForDetail(item)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1 ml-auto"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    No maintenance records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Work Order Modal */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedRecordForDetail.title}</h3>
                <span className="text-xs text-slate-500">Asset: {selectedRecordForDetail.equipmentName}</span>
              </div>
              <button onClick={() => setSelectedRecordForDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <span className="font-bold text-[11px] text-slate-800 uppercase block">Vendor & Technician Profile</span>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Vendor Name:</span>
                    <span className="font-bold">{selectedRecordForDetail.vendorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Contact Person:</span>
                    <span>{selectedRecordForDetail.vendorContact}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Phone:</span>
                    <span>{selectedRecordForDetail.vendorPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Address:</span>
                    <span>{selectedRecordForDetail.vendorAddress}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                <span className="font-bold text-[11px] text-slate-800 uppercase block">Work & Diagnostic Details</span>
                <p className="text-slate-600 leading-relaxed">{selectedRecordForDetail.serviceDetails}</p>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Replaced Spare Parts:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedRecordForDetail.partsReplaced.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visual Multi-step Progress Bar */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <span className="font-bold text-[11px] text-indigo-900 uppercase block">Approval Workflow Status</span>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold px-1">
                  <span className={selectedRecordForDetail.status === 'PENDING_APPROVAL' ? 'text-amber-700' : 'text-slate-400'}>L1: Ops Assessment</span>
                  <span className={selectedRecordForDetail.status === 'OPS_APPROVED' ? 'text-blue-700' : 'text-slate-400'}>L2: Finance Release</span>
                  <span className={selectedRecordForDetail.status === 'FINANCE_APPROVED' ? 'text-indigo-700' : 'text-slate-400'}>L3: Certification</span>
                  <span className={selectedRecordForDetail.status === 'COMPLETED' ? 'text-emerald-700' : 'text-slate-400'}>Completed</span>
                </div>
                <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      selectedRecordForDetail.status === 'PENDING_APPROVAL' ? 'w-1/4 bg-amber-500' :
                      selectedRecordForDetail.status === 'OPS_APPROVED' ? 'w-2/4 bg-blue-500' :
                      selectedRecordForDetail.status === 'FINANCE_APPROVED' ? 'w-3/4 bg-indigo-500' :
                      selectedRecordForDetail.status === 'COMPLETED' ? 'w-full bg-emerald-500' : 'w-0'
                    }`} 
                  />
                </div>
              </div>

              {selectedRecordForDetail.receiptFileName && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-emerald-900 block text-[11px]">Invoice / Receipt Attached</span>
                      <span className="text-[10px] text-emerald-700">{selectedRecordForDetail.receiptFileName}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => alert(`Downloading verified receipt copy: ${selectedRecordForDetail.receiptFileName}`)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                  >
                    View Receipt
                  </button>
                </div>
              )}

              {/* Approval History List */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-[11px] text-slate-800 uppercase block">Approval Step Log</span>
                {selectedRecordForDetail.approvalHistory && selectedRecordForDetail.approvalHistory.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {selectedRecordForDetail.approvalHistory.map((step, sIdx) => (
                      <div key={sIdx} className="p-2 bg-white rounded-lg border border-slate-100 text-[10px] space-y-0.5">
                        <div className="flex items-center justify-between text-slate-400 font-bold">
                          <span>{step.stepName}</span>
                          <span>{new Date(step.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="font-bold text-slate-700">
                          Action: <strong className={step.action === 'APPROVED' || step.action === 'SUBMITTED' ? 'text-emerald-600' : 'text-rose-600'}>{step.action}</strong> by {step.approverName} ({step.approverRole})
                        </p>
                        {step.comments && (
                          <p className="text-slate-500 italic font-medium">&ldquo;{step.comments}&rdquo;</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400">No workflow steps logged yet.</p>
                )}
              </div>

              {/* Active Approver Actions */}
              {(() => {
                const step = selectedRecordForDetail.currentApprovalStep || 1;
                const roleNeeded = selectedRecordForDetail.assignedApproverRole || 'OPERATIONS';
                const isOps = roleNeeded === 'OPERATIONS';
                const isFin = roleNeeded === 'FINANCE_OFFICER';

                const isEligible = 
                  (isOps && (isProjectManager || isAdmin || isCEO || user?.role === 'field_officer')) ||
                  (isFin && (user?.role === 'finance_officer' || isAdmin || isCEO));

                if (selectedRecordForDetail.status === 'COMPLETED' || selectedRecordForDetail.status === 'REJECTED') {
                  return null;
                }

                if (!isEligible) {
                  return (
                    <div className="p-2.5 bg-slate-50 text-slate-500 font-medium text-[11px] rounded-lg border border-slate-200 text-center">
                      🔒 Awaiting step verification by authorized {roleNeeded.replace('_', ' ')}
                    </div>
                  );
                }

                return (
                  <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-xl space-y-2">
                    <span className="font-bold text-[11px] text-amber-900 block uppercase">
                      ⚡ Action Required: {roleNeeded.replace('_', ' ')} Sign-off
                    </span>
                    <input 
                      type="text" 
                      placeholder="Add review feedback, PO numbers, parts check notes..." 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                    <div className="flex items-center justify-end space-x-1.5 pt-1">
                      <button
                        onClick={() => handleWorkflowAction(selectedRecordForDetail.id, 'REQUEST_CHANGES')}
                        className="px-2 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[10px]"
                      >
                        Request Changes
                      </button>
                      <button
                        onClick={() => handleWorkflowAction(selectedRecordForDetail.id, 'REJECT')}
                        className="px-2 py-1 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[10px]"
                      >
                        Reject Request
                      </button>
                      <button
                        onClick={() => handleWorkflowAction(selectedRecordForDetail.id, 'APPROVE')}
                        className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                      >
                        Approve &amp; Advance
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end items-center pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg text-xs hover:bg-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Maintenance Record Modal */}
      {isNewRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Equipment Maintenance & Vendor Invoice</h3>
              <button onClick={() => setIsNewRecordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Work Order Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Solar Pump Inverter Overhaul"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Equipment / Asset Name *</label>
                  <input
                    type="text"
                    required
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    placeholder="e.g. Grundfos SQFlex 2.5kW Solar Pump"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Diagnostic & Service Details *</label>
                <textarea
                  rows={2}
                  required
                  value={serviceDetails}
                  onChange={(e) => setServiceDetails(e.target.value)}
                  placeholder="Describe technical issue diagnosed, work performed, testing procedures..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Parts Replaced (comma-sep)</label>
                  <input
                    type="text"
                    value={partsReplaced}
                    onChange={(e) => setPartsReplaced(e.target.value)}
                    placeholder="Capacitor, Bushing, Impeller"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Total Cost ($ USD) *</label>
                  <input
                    type="number"
                    required
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                  >
                    <option value="COMPLETED">Completed & Invoiced</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                </div>
              </div>

              {/* Vendor Information with Auto-Add Directive */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 uppercase flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Vendor Details (Auto-added to Vendor Registry if new)</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Vendor / Contractor Name *</label>
                    <input
                      type="text"
                      required
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      placeholder="e.g. Volta Hydraulics & Engineering"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={vendorContact}
                      onChange={(e) => setVendorContact(e.target.value)}
                      placeholder="e.g. Ing. Samuel Boateng"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={vendorPhone}
                      onChange={(e) => setVendorPhone(e.target.value)}
                      placeholder="+233 24 555 1234"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Physical Address / Workshop</label>
                    <input
                      type="text"
                      value={vendorAddress}
                      onChange={(e) => setVendorAddress(e.target.value)}
                      placeholder="Plot 12, Light Industrial Area, Tema"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Receipt / Invoice Upload */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase block">
                  Upload Official Receipt / Vendor Invoice
                </span>
                <label className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition">
                  <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                  <span>Attach Scanned Receipt or Bill</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleSimulateReceiptUpload}
                    className="hidden"
                  />
                </label>
                {uploadedReceiptName && (
                  <span className="text-[10px] text-emerald-600 font-semibold block">
                    ✓ Receipt attached: {uploadedReceiptName}
                  </span>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRecordModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Log Work Order & Sync Vendor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
