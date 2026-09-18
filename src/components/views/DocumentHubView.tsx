import React, { useState } from 'react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Copy, 
  Download, 
  Layers, 
  RefreshCw, 
  Zap, 
  Eye, 
  Lock, 
  Database, 
  Sliders, 
  FileSpreadsheet, 
  Wand2, 
  Check, 
  Send, 
  ChevronRight, 
  UserCheck, 
  HelpCircle,
  FileCheck,
  Edit3,
  Upload
} from 'lucide-react';
import { logAuditEvent } from '../../lib/auditLogger';
import { GoogleFormsSurveyManager } from '../documents/GoogleFormsSurveyManager';

type TemplateType = 
  | 'donor_report' 
  | 'grant_proposal' 
  | 'baseline_survey' 
  | 'endline_survey' 
  | 'project_briefing' 
  | 'rapid_assessment'
  | 'me_survey';

export const DocumentHubView: React.FC = () => {
  const { tasks, indicators, expenses, activeProject, projects, activeProjectId, setActiveProjectId } = useFirestore();
  const { currentUser, userRole, permissions } = useAuth();

  // Primary Hub Tab: Document Drafter vs Google Forms Engine
  const [mainHubTab, setMainHubTab] = useState<'drafter' | 'surveys'>('drafter');

  // Template & Configuration State
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('donor_report');
  const [timeframe, setTimeframe] = useState('Q3 2026');
  const [tone, setTone] = useState('Donor-Compliant & Analytical');
  const [customFocus, setCustomFocus] = useState('');

  // Dataset Ingestion Toggles
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeIndicators, setIncludeIndicators] = useState(true);
  const [includeFinancials, setIncludeFinancials] = useState(true);
  const [maskPII, setMaskPII] = useState(true);

  // Generation & Editor State
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [isApproved, setIsApproved] = useState(false);
  const [approvedBy, setApprovedBy] = useState<string | null>(null);
  const [approvalDate, setApprovalDate] = useState<string | null>(null);
  const [groundedSummary, setGroundedSummary] = useState<string | null>(null);
  const [piiRedactions, setPiiRedactions] = useState<number>(0);
  const [serviceNotice, setServiceNotice] = useState<string | null>(null);

  // Inline Localized Rewrite State
  const [selectedSectionText, setSelectedSectionText] = useState('');
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Tab state in Inspector panel
  const [inspectorTab, setInspectorTab] = useState<'config' | 'rag_context' | 'audit' | 'summarizer'>('config');

  // Document Summarizer State
  interface UploadedDoc {
    id: string;
    name: string;
    size: string;
    uploadedAt: string;
    textContext?: string;
  }

  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([
    {
      id: 'doc-1',
      name: 'USAID_BHA_Solar_WASH_Grant_Agreement_Signed.pdf',
      size: '2.4 MB',
      uploadedAt: '2026-09-01 10:24',
      textContext: 'This Grant Agreement details the expansion of 8 deep solar-powered boreholes across the Ashanti and Northern Regions, incorporating water treatment kiosks and IoT chlorination telemetry under USAID BHA guidelines. The total disbursed amount of $420,000 supports inception surveys and civil works, ensuring full compliance with 2 CFR 200 uniform guidance and environmental mitigation audits.',
    },
    {
      id: 'doc-2',
      name: 'ECHO_Single_Form_Submission_Draft.pdf',
      size: '1.8 MB',
      uploadedAt: '2026-09-05 14:15',
      textContext: 'This Single Form Submission draft outlines emergency drought response measures for West Africa under EU ECHO guidelines, targeting 12,000 displaced pastoralist families. The proposal details supplementary nutrition distributions, emergency water trucking voucher schemes, and rapid baseline survey registrations scheduled for implementation across cross-border communities.',
    },
    {
      id: 'doc-3',
      name: 'Field_Borehole_Inspection_Report_v2.pdf',
      size: '3.1 MB',
      uploadedAt: '2026-09-10 09:30',
      textContext: 'This technical report verifies the physical and hydraulic status of drilling sites, confirming compliance at a 45m piping depth with solar inverter installation. It details water quality tests, pressure gauge calibrations, and solar inverter serial number mapping to the official USAID grant register GH-882.',
    },
    {
      id: 'doc-4',
      name: 'UNHCR_Audit_Brief.docx',
      size: '1.2 MB',
      uploadedAt: '2026-09-12 11:45',
      textContext: 'This audit brief summarizes compliance standards and financial reconciliations for refugees and displaced persons across cross-border water networks. It highlights the allocation of sub-grants, operational efficiency audits, and beneficiary feedback loops for water point utilization.',
    },
  ]);
  const [selectedDocId, setSelectedDocId] = useState<string>('doc-1');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [docSummary, setDocSummary] = useState<string>('');

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc: UploadedDoc = {
      id: `doc-${Date.now()}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      textContext: `This is an uploaded custom document named "${file.name}". It contains specific project metrics, site survey information, and implementation data for the ${activeProject?.title || 'WASH Initiative'} project.`,
    };

    setUploadedDocs((prev) => [...prev, newDoc]);
    setSelectedDocId(newDoc.id);
    setDocSummary('');
  };

  const handleSummarizeDoc = async () => {
    const doc = uploadedDocs.find((d) => d.id === selectedDocId);
    if (!doc) return;

    setIsSummarizing(true);
    setDocSummary('');
    try {
      const res = await fetch('/api/ai/summarize-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentName: doc.name,
          documentText: doc.textContext,
          projectName: activeProject?.title,
          projectCode: activeProject?.code,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDocSummary(data.summary);
      } else {
        setDocSummary(`Failed to summarize: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setDocSummary('Error communicating with the summarizer service.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Calculate grounded stats for preview
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const totalBudget = activeProject?.totalBudget || 1200000;
  const donorName = activeProject?.donors?.[0]?.donorCode || 'USAID / Global Fund';
  const totalSpent = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const burnRatePercent = Math.round((totalSpent / (totalBudget || 1)) * 100);

  // Trigger Document RAG Generation
  const handleGenerateDocument = async () => {
    setIsGenerating(true);
    setIsApproved(false);
    setApprovedBy(null);
    setApprovalDate(null);
    setServiceNotice(null);

    try {
      const response = await fetch('/api/ai/draft-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: selectedTemplate,
          projectData: {
            title: activeProject?.title || 'WASH Initiative Ghana',
            code: activeProject?.code || 'GHA-USAID-2025',
            donor: donorName,
            sector: activeProject?.sector || 'WASH',
            location: activeProject?.location || 'Tamale, Northern Region',
            grantAmount: totalBudget,
          },
          completedTasks: includeTasks
            ? completedTasks.map((t) => ({
                id: t.id,
                title: t.title,
                status: t.status,
                category: t.customItemType || 'Deliverable',
                assigneeName: t.assigneeName || 'Field Staff',
                completedDate: t.actualEndDate || t.plannedEndDate || '2026-08-15',
              }))
            : [],
          meIndicators: includeIndicators
            ? indicators.map((ind) => ({
                code: ind.code,
                title: ind.title,
                targetValue: ind.target,
                actualValue: ind.actualValue,
                unit: ind.unit || 'Units',
                progressPercent: Math.round((ind.actualValue / (ind.target || 1)) * 100),
              }))
            : [],
          financials: includeFinancials
            ? {
                totalBudget,
                totalSpent,
                burnRate: `${burnRatePercent}%`,
                pendingExpenses: expenses.filter((e) => e.status === 'PENDING').reduce((s, e) => s + e.totalAmount, 0),
              }
            : null,
          options: {
            timeframe,
            tone,
            includeTasks,
            includeIndicators,
            includeFinancials,
            maskPII,
            customFocus,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDocumentContent(data.documentText);
        setPiiRedactions(data.piiRedactionsCount || 0);
        setGroundedSummary(data.groundedDataSummary);
        if (data.warningNote) {
          setServiceNotice(data.warningNote);
        }

        // Audit Log entry
        await logAuditEvent({
          projectId: activeProjectId,
          projectName: activeProject?.title || 'WASH Initiative Ghana',
          actionType: 'INDICATOR_UPDATED',
          entityType: 'Indicator',
          entityId: `doc-${Date.now()}`,
          entityTitle: `AI Draft: ${selectedTemplate.toUpperCase()} (${timeframe})`,
          modifiedByUserId: currentUser?.id || 'usr-01',
          modifiedByUserName: currentUser?.displayName || 'Ama Osei',
          modifiedByUserRole: userRole || 'PROJECT_MANAGER',
          changeSummary: `Generated grounded ${selectedTemplate} draft via Gemini RAG engine`,
        });
      } else {
        setServiceNotice(`Generation issue: ${data.error || 'Please try again momentarily.'}`);
      }
    } catch (err: any) {
      console.error('Document generation error:', err);
      setServiceNotice('The service is temporarily unavailable. Please try again in a few moments.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Localized AI Paragraph Rewrite Call
  const handleRewriteSection = async (customInstruction?: string) => {
    const instruction = customInstruction || rewriteInstruction;
    if (!selectedSectionText.trim()) {
      alert('Please enter or select a text section to rewrite.');
      return;
    }
    if (!instruction.trim()) {
      alert('Please specify a rewrite instruction (e.g., "Make more persuasive for donor").');
      return;
    }

    setIsRewriting(true);
    setServiceNotice(null);
    try {
      const response = await fetch('/api/ai/rewrite-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionText: selectedSectionText,
          instruction,
          tone,
        }),
      });

      const data = await response.json();
      if (data.success && data.rewrittenText) {
        // Replace occurrences of selected section in main document text
        setDocumentContent((prev) => prev.replace(selectedSectionText, data.rewrittenText));
        setSelectedSectionText(data.rewrittenText);
        setRewriteInstruction('');
        if (data.warningNote) {
          setServiceNotice(data.warningNote);
        }
      } else {
        setServiceNotice(`Rewrite notice: ${data.error || 'Could not complete rewrite.'}`);
      }
    } catch (err) {
      console.error('Rewrite error:', err);
      setServiceNotice('Rewrite service encountered a temporary network issue.');
    } finally {
      setIsRewriting(false);
    }
  };

  // Manager Human-in-the-Loop Approval Toggle
  const handleApproveDocument = async () => {
    if (!permissions.canApproveExpenses && userRole !== 'ADMIN' && userRole !== 'PROJECT_MANAGER') {
      alert('Only Project Managers or Administrators can approve donor documents.');
      return;
    }

    const newApprovalState = !isApproved;
    setIsApproved(newApprovalState);

    if (newApprovalState) {
      setApprovedBy(currentUser?.displayName || 'Ama Osei (Project Manager)');
      setApprovalDate(new Date().toLocaleString());

      // Log Audit Event
      await logAuditEvent({
        projectId: activeProjectId,
        projectName: activeProject?.title || 'WASH Initiative Ghana',
        actionType: 'PROJECT_UPDATED',
        entityType: 'Project',
        entityId: `doc-appr-${Date.now()}`,
        entityTitle: `Approved Donor Deliverable: ${selectedTemplate.toUpperCase()}`,
        modifiedByUserId: currentUser?.id || 'usr-01',
        modifiedByUserName: currentUser?.displayName || 'Ama Osei',
        modifiedByUserRole: userRole || 'PROJECT_MANAGER',
        changeSummary: 'Manager signed off and approved AI document draft for formal donor submission',
      });
    } else {
      setApprovedBy(null);
      setApprovalDate(null);
    }
  };

  // Copy Markdown to Clipboard
  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(documentContent);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Download Markdown file
  const handleDownloadFile = () => {
    const blob = new Blob([documentContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject?.code || 'GHA'}_${selectedTemplate}_${timeframe.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const templatesList = [
    {
      id: 'project_briefing' as TemplateType,
      title: 'Executive Briefing & One-Pager',
      description: 'Distills complex multi-year project logs and financial health metrics into concise 500-word summaries for board meetings and stakeholders.',
      icon: Eye,
      color: 'border-purple-500 text-purple-700 bg-purple-50/60',
      badge: 'Board Summary',
    },
    {
      id: 'baseline_survey' as TemplateType,
      title: 'Baseline Survey & Google Forms',
      description: 'Designs structured M&E household questionnaires with Likert scales, Google Forms questions, and exportable KoboToolbox / ODK schemas.',
      icon: FileSpreadsheet,
      color: 'border-emerald-500 text-emerald-700 bg-emerald-50/60',
      badge: 'Baseline Survey',
    },
    {
      id: 'endline_survey' as TemplateType,
      title: 'Endline Impact & Sustainability Survey',
      description: 'Measures multi-year community impact, service longevity, and target achievements against baseline indicators with Google Forms mapping.',
      icon: CheckCircle2,
      color: 'border-teal-500 text-teal-700 bg-teal-50/60',
      badge: 'Endline Impact',
    },
    {
      id: 'grant_proposal' as TemplateType,
      title: 'Grant Proposal & Logframe Narrative',
      description: 'Generates aligned problem statements, theories of change, structured logical frameworks, and preliminary budget justifications for RFPs.',
      icon: Layers,
      color: 'border-indigo-500 text-indigo-700 bg-indigo-50/60',
      badge: 'RFP LogFrame',
    },
    {
      id: 'donor_report' as TemplateType,
      title: 'Periodic Donor Progress Report',
      description: 'Synthesizes quarterly completed tasks, M&E progress matrices, and financial burn rate variances into USAID/Global Fund compliant narratives.',
      icon: FileCheck,
      color: 'border-blue-500 text-blue-700 bg-blue-50/60',
      badge: 'Q1-Q4 Progress',
    },
    {
      id: 'rapid_assessment' as TemplateType,
      title: 'Rapid Needs Assessment & SITREP',
      description: 'Emergency field assessment memo detailing acute community vulnerabilities, WASH infrastructure status, and urgent funding appeals.',
      icon: AlertTriangle,
      color: 'border-rose-500 text-rose-700 bg-rose-50/60',
      badge: 'Urgent SITREP',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-800/40 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-400/30 text-indigo-300">
                <Wand2 className="w-6 h-6 animate-pulse" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Generative AI Document Drafter &amp; Document Hub
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                Vertex AI RAG Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Transform passive tracking data into donor-ready deliverables. Synthesizes real-time completed field tasks, M&amp;E indicator matrices, and financial burn rates directly into USAID-compliant narratives, surveys, and Google Forms schemas.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700 text-xs space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Grounding Source</span>
              <p className="font-bold text-emerald-400 flex items-center space-x-1">
                <Database className="w-3.5 h-3.5" />
                <span>[{activeProject?.code}] {activeProject?.title}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Sub-Navigation: Document Drafter vs Google Forms Hub */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setMainHubTab('drafter')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            mainHubTab === 'drafter'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Generative AI Document Drafter ({templatesList.length} Templates)</span>
        </button>

        <button
          type="button"
          onClick={() => setMainHubTab('surveys')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            mainHubTab === 'surveys'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Google Forms Survey &amp; Response Engine</span>
        </button>
      </div>

      {/* Render Google Forms Manager when active */}
      {mainHubTab === 'surveys' ? (
        <GoogleFormsSurveyManager />
      ) : (
        <>
          {/* Template Selection Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templatesList.map((tpl) => {
              const Icon = tpl.icon;
              const isSelected = selectedTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`p-5 rounded-2xl border text-left transition duration-200 relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-2 border-slate-900 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl border ${tpl.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {tpl.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{tpl.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{tpl.description}</p>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-xs font-bold">
                    <span className={isSelected ? 'text-emerald-600' : 'text-slate-400'}>
                      {isSelected ? 'Selected Template' : 'Click to Select'}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition ${isSelected ? 'translate-x-1 text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                </button>
              );
            })}
          </div>

      {/* Main Studio Area: Left Wizard/Inspector + Right Document Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side (5 cols): RAG Controls & Context Inspector */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Inspector Navigation Tabs */}
            <div className="grid grid-cols-2 gap-1 p-2 bg-slate-50/80 border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setInspectorTab('config')}
                className={`py-2 px-2.5 rounded-xl transition flex items-center justify-center space-x-1 ${
                  inspectorTab === 'config' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>1. RAG Wizard</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('rag_context')}
                className={`py-2 px-2.5 rounded-xl transition flex items-center justify-center space-x-1 ${
                  inspectorTab === 'rag_context' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Grounding</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('audit')}
                className={`py-2 px-2.5 rounded-xl transition flex items-center justify-center space-x-1 ${
                  inspectorTab === 'audit' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. Sign-off</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('summarizer')}
                className={`py-2 px-2.5 rounded-xl transition flex items-center justify-center space-x-1 ${
                  inspectorTab === 'summarizer' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>4. Summarizer</span>
              </button>
            </div>

            <div className="p-5 text-xs space-y-5">
              {inspectorTab === 'config' && (
                <>
                  {/* Target Mission Selector */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Mission / Project</label>
                    <select
                      value={activeProjectId}
                      onChange={(e) => setActiveProjectId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-900"
                    >
                      <option value="ALL">🌐 All Projects (Consolidated Portfolio)</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.code}] {p.title} ({p.donors?.[0]?.donorCode || 'Grant'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Timeframe & Tone */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Reporting Period</label>
                      <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                      >
                        <option value="Q1 2026">Q1 2026 (Jan - Mar)</option>
                        <option value="Q2 2026">Q2 2026 (Apr - Jun)</option>
                        <option value="Q3 2026">Q3 2026 (Jul - Sep)</option>
                        <option value="Q4 2026">Q4 2026 (Oct - Dec)</option>
                        <option value="Full Year 2026">Full Year 2026</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Narrative Tone</label>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                      >
                        <option value="Donor-Compliant & Analytical">USAID Analytical</option>
                        <option value="Persuasive & Impact-Focused">Persuasive Impact</option>
                        <option value="Academic & Methodological">Academic Logframe</option>
                        <option value="Concise Executive Summary">Executive Brief</option>
                      </select>
                    </div>
                  </div>

                  {/* Grounding Datasets Toggles */}
                  <div className="space-y-2 pt-1 border-t border-slate-200/80">
                    <span className="font-bold text-slate-900 block text-xs">Included RAG Context Datasets:</span>

                    <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition">
                      <span className="font-semibold text-slate-800 flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Completed Deliverables ({completedTasks.length} items)</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={includeTasks}
                        onChange={(e) => setIncludeTasks(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition">
                      <span className="font-semibold text-slate-800 flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span>M&amp;E Indicator Matrix ({indicators.length} metrics)</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={includeIndicators}
                        onChange={(e) => setIncludeIndicators(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition">
                      <span className="font-semibold text-slate-800 flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-amber-600" />
                        <span>Financial Burn Rate (${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()})</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={includeFinancials}
                        onChange={(e) => setIncludeFinancials(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50 transition">
                      <span className="font-bold text-emerald-900 flex items-center space-x-2">
                        <Lock className="w-4 h-4 text-emerald-600" />
                        <span>Mask Beneficiary PII (GDPR Guardrail)</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={maskPII}
                        onChange={(e) => setMaskPII(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Special Prompt Focus */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Donor RFP / Custom Focus Prompt</label>
                    <textarea
                      value={customFocus}
                      onChange={(e) => setCustomFocus(e.target.value)}
                      rows={2}
                      placeholder="e.g. Highlight climate resilience, sole-source procurement waiver justification, or female beneficiary participation."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={handleGenerateDocument}
                    disabled={isGenerating}
                    className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>Querying Firestore &amp; Synthesizing Draft via Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>Generate Grounded Document Draft</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {inspectorTab === 'rag_context' && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-900 space-y-1">
                    <span className="font-bold block flex items-center space-x-1 text-xs">
                      <Database className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Retrieved Database Context Payload</span>
                    </span>
                    <p className="text-[11px] text-indigo-700">
                      The RAG pipeline retrieves current Firestore documents before prompting Gemini to guarantee zero hallucinations.
                    </p>
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                      <span className="font-bold text-slate-900 text-xs">Completed Task Records ({completedTasks.length})</span>
                      {completedTasks.length > 0 ? (
                        <ul className="space-y-1 text-[11px] text-slate-700 font-mono">
                          {completedTasks.slice(0, 5).map((t) => (
                            <li key={t.id} className="truncate">
                              • [{t.customItemType || 'Deliverable'}] {t.title}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No completed tasks available in active project.</p>
                      )}
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                      <span className="font-bold text-slate-900 text-xs">M&amp;E Metrics Context ({indicators.length})</span>
                      <ul className="space-y-1 text-[11px] text-slate-700 font-mono">
                        {indicators.map((ind) => (
                          <li key={ind.id} className="truncate">
                            • {ind.code}: {ind.actualValue}/{ind.target} {ind.unit || 'Units'}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                      <span className="font-bold text-slate-900 text-xs">Financial Context</span>
                      <div className="text-[11px] text-slate-700 font-mono space-y-0.5">
                        <p>Total Grant: ${totalBudget.toLocaleString()}</p>
                        <p>Total Spent: ${totalSpent.toLocaleString()}</p>
                        <p>Burn Rate: {burnRatePercent}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {inspectorTab === 'audit' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">Human-in-the-Loop Workflow</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {isApproved ? 'APPROVED FOR SUBMISSION' : 'DRAFT: PENDING MANAGER REVIEW'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      All AI-generated donor reports must be reviewed and formally signed off by an authorized Project Manager or Administrator before external submission.
                    </p>

                    {isApproved ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-900 text-xs">
                        <div className="flex items-center space-x-1.5 font-bold">
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                          <span>Approved by: {approvedBy}</span>
                        </div>
                        <p className="text-[10px] text-emerald-700">Signed off on: {approvalDate}</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                        <span className="font-bold block flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Manager Sign-Off Required</span>
                        </span>
                        <p className="text-[10px] text-amber-800">
                          Review generated Markdown draft on the right before clicking approve.
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleApproveDocument}
                      className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition ${
                        isApproved
                          ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isApproved ? 'Revoke Approval Sign-off' : 'Approve & Sign-Off Document'}</span>
                    </button>
                  </div>

                  {piiRedactions > 0 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold block">PII Guardrail Active</span>
                        <p className="text-[10px] text-emerald-700">
                          {piiRedactions} sensitive personal records scrubbed prior to Gemini processing.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {inspectorTab === 'summarizer' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-1">
                    <span className="font-bold block flex items-center space-x-1 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      <span>Document Summary Co-Pilot</span>
                    </span>
                    <p className="text-[11px] text-amber-700 font-semibold">
                      Select or upload any project document to generate a high-integrity, single-paragraph AI summary powered by Gemini.
                    </p>
                  </div>

                  {/* Document selector/uploader */}
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Select Project Document</label>
                      <select
                        value={selectedDocId}
                        onChange={(e) => {
                          setSelectedDocId(e.target.value);
                          setDocSummary('');
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                      >
                        {uploadedDocs.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            📄 {doc.name} ({doc.size})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Upload File Input */}
                    <div>
                      <label className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50/20 rounded-xl text-center text-xs font-bold text-slate-600 cursor-pointer transition flex items-center justify-center space-x-1.5">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Upload New Document</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleDocUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSummarizeDoc}
                    disabled={isSummarizing || !selectedDocId}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSummarizing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>Generating Gemini Summary...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Summarize Selected Document</span>
                      </>
                    )}
                  </button>

                  {/* Summary Result Box */}
                  {docSummary && (
                    <div className="p-4 bg-amber-50/20 border border-amber-200 rounded-2xl space-y-2 text-xs animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between border-b border-amber-200/50 pb-1.5">
                        <span className="font-bold text-slate-800 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Gemini AI Summary</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(docSummary);
                            alert('Summary copied to clipboard!');
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-800 font-bold flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-semibold bg-white p-3 rounded-xl border border-slate-100 text-[11px] italic">
                        "{docSummary}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side (7 cols): Document Canvas & Editor with Inline AI Rewrite */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5 min-h-[600px] flex flex-col justify-between">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {selectedTemplate === 'donor_report' && 'Periodic Donor Progress Report'}
                    {selectedTemplate === 'grant_proposal' && 'Grant Proposal Narrative & Logframe'}
                    {(selectedTemplate === 'baseline_survey' || selectedTemplate === 'me_survey') && 'Baseline Household Survey & Google Forms Schema'}
                    {selectedTemplate === 'endline_survey' && 'Endline Impact & Sustainability Survey'}
                    {selectedTemplate === 'project_briefing' && 'Executive Project Briefing & One-Pager'}
                    {selectedTemplate === 'rapid_assessment' && 'Rapid Needs Assessment & Field SITREP'}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {isApproved ? 'Approved Document' : 'Draft: Requires Review'}
                  </span>
                </div>
                {groundedSummary && (
                  <p className="text-[11px] text-emerald-700 font-medium">{groundedSummary}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  disabled={!documentContent}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition disabled:opacity-40"
                >
                  {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNotification ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadFile}
                  disabled={!documentContent}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 transition disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download (.md)</span>
                </button>
              </div>
            </div>

            {/* Service / Warning Notice */}
            {serviceNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{serviceNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setServiceNotice(null)}
                  className="text-amber-700 hover:text-amber-900 font-bold ml-2 text-[10px] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Document Editor Canvas */}
            <div className="flex-1 space-y-4">
              {documentContent ? (
                <div className="space-y-4">
                  {/* Inline AI Rewrite Bar */}
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Localized Section AI Rewrite</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Edit or select a paragraph below</span>
                    </div>

                    <input
                      type="text"
                      value={selectedSectionText}
                      onChange={(e) => setSelectedSectionText(e.target.value)}
                      placeholder="Paste or click a paragraph from below to refine..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                    />

                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={rewriteInstruction}
                        onChange={(e) => setRewriteInstruction(e.target.value)}
                        placeholder="Instruction: e.g. Make more persuasive, summarize to bullets, fix tone..."
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRewriteSection()}
                        disabled={isRewriting || !selectedSectionText.trim()}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1 shrink-0 disabled:opacity-40 transition"
                      >
                        {isRewriting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>Rewrite</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleRewriteSection('Make narrative more persuasive for USAID donor review')}
                        className="px-2 py-1 rounded-lg bg-white border text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        + Persuasive Tone
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRewriteSection('Summarize paragraph into structured bullet points')}
                        className="px-2 py-1 rounded-lg bg-white border text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        + Bullet Points
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRewriteSection('Highlight cost efficiency and grant value for money')}
                        className="px-2 py-1 rounded-lg bg-white border text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        + Cost Efficiency Focus
                      </button>
                    </div>
                  </div>

                  {/* Main Rich Textarea */}
                  <textarea
                    value={documentContent}
                    onChange={(e) => setDocumentContent(e.target.value)}
                    rows={18}
                    className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-mono leading-relaxed bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-3 my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">No Document Drafted Yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Select a template and click "Generate Grounded Document Draft" to synthesize your live database records into a donor-ready deliverable.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Watermark Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Watermark Status: {isApproved ? 'Official Approved Version' : 'DRAFT: REQUIRES HUMAN REVIEW'}</span>
              </span>
              <span className="font-mono">Milous AI Co-Pilot v2.5</span>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
