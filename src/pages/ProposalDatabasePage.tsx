import React, { useState } from 'react';
import { useFirestore } from '../context/FirestoreContext';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Plus, 
  Search, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  ExternalLink, 
  Tag, 
  DollarSign, 
  Layers, 
  X, 
  ListPlus, 
  FileSpreadsheet, 
  Download,
  Building2,
  Check,
  ChevronRight
} from 'lucide-react';
import { GrantProposal, ProposalStage } from '../types';

export const ProposalDatabasePage: React.FC = () => {
  const { proposals, donors, createProposal, updateProposal, createTask } = useFirestore();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'GRANTED' | 'PENDING' | 'DECLINED'>('ALL');
  const [filterDonor, setFilterDonor] = useState('ALL');

  // Modal State
  const [isNewProposalModalOpen, setIsNewProposalModalOpen] = useState(false);
  const [selectedProposalForDetail, setSelectedProposalForDetail] = useState<GrantProposal | null>(null);

  // New Proposal Form State
  const [title, setTitle] = useState('');
  const [donorId, setDonorId] = useState(donors[0]?.id || '');
  const [dateSubmitted, setDateSubmitted] = useState(new Date().toISOString().split('T')[0]);
  const [tagsInput, setTagsInput] = useState('#WASH, #CommunityDevelopment');
  const [status, setStatus] = useState<'GRANTED' | 'PENDING' | 'DECLINED'>('PENDING');
  const [requestedAmount, setRequestedAmount] = useState<number>(350000);
  const [givenAmount, setGivenAmount] = useState<number>(0);

  // Stages
  const [stages, setStages] = useState<ProposalStage[]>([
    { stageName: 'Inception & Mobilization (30%)', percentage: 30, amount: 105000, status: 'PENDING' },
    { stageName: 'Main Project Implementation (50%)', percentage: 50, amount: 175000, status: 'PENDING' },
    { stageName: 'Closeout & Final Financial Audit (20%)', percentage: 20, amount: 70000, status: 'PENDING' },
  ]);

  // Upload & Extraction
  const [uploadedDocName, setUploadedDocName] = useState('');
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [complianceLink, setComplianceLink] = useState('https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200');

  // AI Reporting Generation Simulation
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false);
  const [aiGeneratedReport, setAiGeneratedReport] = useState<string | null>(null);
  const [feedSuccessMessage, setFeedSuccessMessage] = useState<string | null>(null);

  const handleSimulateDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedDocName(file.name);
    setIsExtractingText(true);

    setTimeout(() => {
      setIsExtractingText(false);
      const parsedContent = `Grant Proposal Document Summary [${file.name}]:
Objective: Expand sustainable clean water and sanitation access for rural schools.
Key Compliance Clauses:
- 2 CFR 200 Subpart E (Uniform Cost Principles).
- Prior written approval required for capital equipment purchases exceeding $5,000 USD.
- Mandatory quarterly Federal Financial Report (SF-425) within 30 days of quarter end.
- Final performance evaluation report required within 90 days after project completion.`;
      setExtractedText(parsedContent);
    }, 1200);
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !donorId) return;

    const matchedDonor = donors.find((d) => d.id === donorId);
    const parsedTags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    await createProposal({
      title: title.trim(),
      donorId,
      donorName: matchedDonor?.name || 'International Donor Agency',
      dateSubmitted,
      tags: parsedTags,
      status,
      requestedAmount: Number(requestedAmount),
      givenAmount: Number(givenAmount),
      stages,
      complianceLinks: [
        { label: 'Donor Compliance Framework & Standards', url: complianceLink },
      ],
      extractedText: extractedText || undefined,
      uploadedDocumentName: uploadedDocName || undefined,
      aiReportingSchedule: [
        { taskTitle: `${title} - Q1 Financial Progress Report`, deadline: '2026-10-31', description: 'Submit standard donor variance breakdown.' },
        { taskTitle: `${title} - Midterm Verification Audit`, deadline: '2026-12-15', description: 'Verify physical milestones against disbursements.' },
      ],
    });

    // Reset
    setTitle('');
    setTagsInput('#WASH, #CommunityDevelopment');
    setUploadedDocName('');
    setExtractedText('');
    setIsNewProposalModalOpen(false);
  };

  // AI Auto-Feed into To-Do / Reporting Schedule
  const handleAutoFeedIntoTasks = async (prop: GrantProposal) => {
    const items = prop.aiReportingSchedule || [
      { taskTitle: `${prop.title}: Inception Compliance Memo`, deadline: '2026-10-15', description: 'Draft inception memorandum and submit to donor.' },
      { taskTitle: `${prop.title}: Tranche 1 Financial Reconciliation`, deadline: '2026-11-30', description: 'Reconcile project ledgers with donor bank receipts.' },
    ];

    for (const item of items) {
      await createTask({
        title: item.taskTitle,
        description: item.description,
        status: 'TODO',
        priority: 'HIGH',
        projectId: 'prj-gh-wash-01',
        assigneeId: currentUser?.id || 'usr-pm-01',
        assigneeName: currentUser?.displayName || 'Sarah Chen',
        assigneeRole: 'Project Manager',
        dueDate: item.deadline,
        tags: ['Donor Compliance', 'Reporting Schedule'],
      });
    }

    setFeedSuccessMessage(`Successfully scheduled ${items.length} reporting tasks into the Project To-Do list!`);
    setTimeout(() => setFeedSuccessMessage(null), 4000);
  };

  // AI Generate Donor Report
  const handleGenerateAiReport = (prop: GrantProposal) => {
    setIsGeneratingAiReport(true);
    setTimeout(() => {
      setIsGeneratingAiReport(false);
      setAiGeneratedReport(`
================================================================
AI DONOR COMPLIANCE REPORT: ${prop.title}
DONOR: ${prop.donorName} | STATUS: ${prop.status}
================================================================
1. EXECUTIVE SUMMARY:
The grant program successfully reached milestone phase 1. Total committed budget of $${prop.requestedAmount.toLocaleString()} with disbursed grant allocations tracked under strict multi-donor guidelines.

2. COMPLIANCE STANDARDS VERIFICATION:
- Procurement integrity checked against 2 CFR 200 standards.
- Anti-diversion and vendor vetting passed across all active requisitions.
- Environmental impact mitigation adherence: 100% compliant.

3. DISBURSEMENT TRANCHES & LIQUIDATION:
- Stage 1: Disbursed and reconciled ($${(prop.stages[0]?.amount || 0).toLocaleString()}).
- Stage 2: Pending indicator verification on civil works ($${(prop.stages[1]?.amount || 0).toLocaleString()}).

4. AUDIT RECOMMENDATION:
Authorized for subsequent tranche drawdown upon final signoff by Executive Leadership.
      `.trim());
    }, 1500);
  };

  const filteredProposals = proposals.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchDonor = filterDonor === 'ALL' || p.donorId === filterDonor;
    return matchSearch && matchStatus && matchDonor;
  });

  const totalGranted = proposals.filter((p) => p.status === 'GRANTED').length;
  const totalPending = proposals.filter((p) => p.status === 'PENDING').length;
  const totalFundingRequested = proposals.reduce((acc, curr) => acc + curr.requestedAmount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Grant Proposal Database & Compliance</h1>
              <p className="text-xs text-slate-500">
                Track grant applications, stage disbursements, extract compliance rules, and auto-feed schedules into To-Do lists.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsNewProposalModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Proposal Entry</span>
        </button>
      </div>

      {feedSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedSuccessMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Proposals</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{proposals.length}</span>
            <span className="text-xs text-emerald-600 font-semibold">{totalGranted} Granted</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Funding In Pipeline</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900">${(totalFundingRequested / 1000).toFixed(0)}k</span>
            <span className="text-xs text-slate-500 font-medium">USD across all proposals</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Donor Review</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-amber-600">{totalPending}</span>
            <span className="text-xs text-amber-600 font-medium">under evaluation</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search proposals by title, donor agency, or tags (#WASH, #EU)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="GRANTED">Granted</option>
            <option value="PENDING">Pending</option>
            <option value="DECLINED">Declined</option>
          </select>

          <select
            value={filterDonor}
            onChange={(e) => setFilterDonor(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Donors</option>
            {donors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Proposals Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProposals.map((proposal) => (
          <div
            key={proposal.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition space-y-4"
          >
            {/* Title & Status */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  proposal.status === 'GRANTED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : proposal.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {proposal.status}
                </span>
                <h3 className="text-sm font-black text-slate-900 leading-snug">{proposal.title}</h3>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{proposal.donorName}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Requested</span>
                <span className="text-sm font-black text-slate-900">${proposal.requestedAmount.toLocaleString()}</span>
                {proposal.givenAmount ? (
                  <span className="text-[11px] font-bold text-emerald-600 block">
                    Granted: ${proposal.givenAmount.toLocaleString()}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Stages & Tranches Bar */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Disbursement Stages ({proposal.stages.length} Tranches)
              </span>
              <div className="space-y-1">
                {proposal.stages.map((stage, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-700 font-medium">{stage.stageName}</span>
                    <span className="font-mono font-bold text-slate-900">
                      ${stage.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags & Submission Date */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-1">
                {proposal.tags.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                    {t}
                  </span>
                ))}
              </div>
              <span className="text-[11px] text-slate-400">
                Submitted: {proposal.dateSubmitted}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={() => setSelectedProposalForDetail(proposal)}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Compliance & Docs</span>
              </button>

              <button
                onClick={() => handleAutoFeedIntoTasks(proposal)}
                className="py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center space-x-1"
                title="Feed AI Reporting Schedule into To-Do list"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>Auto-Feed Schedule</span>
              </button>

              <button
                onClick={() => handleGenerateAiReport(proposal)}
                className="py-1.5 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center space-x-1"
                title="Generate AI Donor Report"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Report</span>
              </button>
            </div>
          </div>
        ))}

        {filteredProposals.length === 0 && (
          <div className="col-span-2 py-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            No proposals found matching the selected filters.
          </div>
        )}
      </div>

      {/* AI Generated Donor Report Modal */}
      {aiGeneratedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">AI Donor Compliance Report Draft</h3>
              </div>
              <button onClick={() => setAiGeneratedReport(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
              {aiGeneratedReport}
            </pre>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(aiGeneratedReport || '');
                  alert('Report copied to clipboard!');
                }}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setAiGeneratedReport(null)}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance & Detail Modal */}
      {selectedProposalForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedProposalForDetail.title}</h3>
                <span className="text-xs text-slate-500">{selectedProposalForDetail.donorName}</span>
              </div>
              <button onClick={() => setSelectedProposalForDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Compliance Framework Links */}
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                <span className="text-[11px] font-bold text-blue-900 block uppercase">
                  Donor Compliance Regulations & Frameworks
                </span>
                {selectedProposalForDetail.complianceLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 text-blue-700 hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>

              {/* Uploaded Document & Extracted Text */}
              {selectedProposalForDetail.uploadedDocumentName && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block uppercase">
                    Attached Document ({selectedProposalForDetail.uploadedDocumentName})
                  </span>
                  <p className="text-slate-600 font-mono text-[11px] whitespace-pre-wrap">
                    {selectedProposalForDetail.extractedText || 'Text extraction complete.'}
                  </p>
                </div>
              )}

              {/* Reporting Schedule */}
              {selectedProposalForDetail.aiReportingSchedule && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 block uppercase">
                    AI Parsed Reporting Schedule & Deadlines
                  </span>
                  <div className="space-y-1.5">
                    {selectedProposalForDetail.aiReportingSchedule.map((item, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">{item.taskTitle}</span>
                          <span className="text-[10px] text-slate-500">{item.description}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                          Due: {item.deadline}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProposalForDetail(null)}
                className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg text-xs hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Proposal Modal */}
      {isNewProposalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Grant Proposal Record</h3>
              <button onClick={() => setIsNewProposalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Proposal Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sustainable Solar Boreholes & WASH Infrastructure Phase III"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Donor Agency *</label>
                  <select
                    value={donorId}
                    onChange={(e) => setDonorId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                  >
                    {donors.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Submission Date *</label>
                  <input
                    type="date"
                    required
                    value={dateSubmitted}
                    onChange={(e) => setDateSubmitted(e.target.value)}
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
                    <option value="PENDING">Pending Donor Decision</option>
                    <option value="GRANTED">Granted & Approved</option>
                    <option value="DECLINED">Declined</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Requested Amount ($ USD) *</label>
                  <input
                    type="number"
                    required
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Given / Approved Amount ($ USD)</label>
                  <input
                    type="number"
                    value={givenAmount}
                    onChange={(e) => setGivenAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="#WASH, #EU, #Emergency"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              {/* Upload Compliance / Reporting Docs & Text Extraction */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase block">
                  Upload Compliance / Reporting Agreement (PDF or Image)
                </span>
                <label className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition">
                  <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isExtractingText ? 'Extracting text and compliance clauses...' : 'Upload Agreement & Extract Clauses'}</span>
                  <input
                    type="file"
                    accept=".pdf,image/*,.doc,.docx"
                    onChange={handleSimulateDocumentUpload}
                    className="hidden"
                  />
                </label>
                {uploadedDocName && (
                  <span className="text-[10px] text-emerald-600 font-semibold block">
                    ✓ Document attached: {uploadedDocName}
                  </span>
                )}
                {extractedText && (
                  <textarea
                    rows={2}
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-mono"
                  />
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewProposalModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Proposal to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
