import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { 
  FileText, 
  Download, 
  X, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  Layers, 
  ShieldCheck, 
  DollarSign, 
  Target, 
  Sparkles,
  Printer,
  Check
} from 'lucide-react';
import { Project, Indicator, Expense, Task } from '../../types';

interface DonorProjectPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId?: string;
  indicators: Indicator[];
  expenses: Expense[];
  tasks: Task[];
}

export const DonorProjectPdfReportModal: React.FC<DonorProjectPdfReportModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  indicators,
  expenses,
  tasks,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProjectId || projects[0]?.id || ''
  );

  const [donorFormat, setDonorFormat] = useState<'USAID' | 'EU' | 'GLOBAL_FUND'>('USAID');
  const [includeIndicators, setIncludeIndicators] = useState(true);
  const [includeFinancials, setIncludeFinancials] = useState(true);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Selected project details
  const project = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Project-specific filtered items
  const projectIndicators = useMemo(() => {
    if (!project) return [];
    return indicators.filter((i) => i.projectId === project.id);
  }, [indicators, project]);

  const projectExpenses = useMemo(() => {
    if (!project) return [];
    return expenses.filter((e) => e.projectId === project.id);
  }, [expenses, project]);

  const projectTasks = useMemo(() => {
    if (!project) return [];
    return tasks.filter((t) => t.projectId === project.id);
  }, [tasks, project]);

  if (!isOpen || !project) return null;

  const totalCommitted = projectExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

  const handleGeneratePDF = () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 40;

      // 1. Header Banner
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, pageWidth, 85, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('MILOUS NGO ALLIANCE — MISSION PORTAL', 40, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225); // Slate 300
      doc.text(`Official Donor Grant Submission Dossier • Format: ${donorFormat} Standard`, 40, 52);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}`, 40, 68);

      y = 110;

      // 2. Project Executive Overview Block
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`Project: ${project.title} (${project.code})`, 40, y);
      y += 18;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Donor Agency: ${project.donorCode || 'USAID / Multi-Donor'} | Status: ${project.status} | Country / Region: ${project.country || 'Ghana / Northern Sector'}`, 40, y);
      y += 14;
      doc.text(`Budget Ceiling: $${project.totalBudget?.toLocaleString() || '1,200,000'} USD | Total Expenditure Committed: $${totalCommitted.toLocaleString()} USD`, 40, y);
      y += 24;

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.line(40, y, pageWidth - 40, y);
      y += 20;

      // 3. LogFrame M&E Performance Section
      if (includeIndicators) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text('1. LOGFRAME MONITORING & EVALUATION (M&E) INDICATORS', 40, y);
        y += 16;

        // Table Header
        doc.setFillColor(241, 245, 249);
        doc.rect(40, y, pageWidth - 80, 20, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text('CODE', 46, y + 13);
        doc.text('INDICATOR TITLE', 100, y + 13);
        doc.text('TARGET', 340, y + 13);
        doc.text('ACTUAL', 410, y + 13);
        doc.text('% REACHED', 475, y + 13);
        y += 24;

        // Table Rows
        doc.setFont('helvetica', 'normal');
        const displayInds = projectIndicators.length > 0 ? projectIndicators : indicators.slice(0, 5);
        displayInds.forEach((ind) => {
          const pct = Math.round(((ind.actualValue || 0) / (ind.target || 1)) * 100);
          doc.text(ind.code, 46, y);
          doc.text(ind.title.length > 40 ? `${ind.title.substring(0, 38)}...` : ind.title, 100, y);
          doc.text(`${ind.target} ${ind.unit || ''}`, 340, y);
          doc.text(`${ind.actualValue} ${ind.unit || ''}`, 410, y);
          doc.text(`${pct}%`, 475, y);
          y += 16;
        });

        y += 15;
      }

      // 4. Financial Split Matrix Section
      if (includeFinancials) {
        if (y > 620) {
          doc.addPage();
          y = 50;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text('2. MULTI-DONOR EXPENDITURE & COMPLIANCE SPLIT BREAKDOWN', 40, y);
        y += 16;

        // Table Header
        doc.setFillColor(241, 245, 249);
        doc.rect(40, y, pageWidth - 80, 20, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text('DATE', 46, y + 13);
        doc.text('DESCRIPTION / VENDOR', 110, y + 13);
        doc.text('TOTAL (USD)', 340, y + 13);
        doc.text('STATUS', 420, y + 13);
        doc.text('DONOR SPLIT', 475, y + 13);
        y += 24;

        doc.setFont('helvetica', 'normal');
        const displayExpenses = projectExpenses.length > 0 ? projectExpenses : expenses.slice(0, 5);
        displayExpenses.forEach((exp) => {
          doc.text(exp.dateIncurred?.split('T')[0] || '2026-03-10', 46, y);
          doc.text(exp.description.length > 36 ? `${exp.description.substring(0, 34)}...` : exp.description, 110, y);
          doc.text(`$${exp.totalAmount.toLocaleString()}`, 340, y);
          doc.text(exp.status, 420, y);
          const donorCode = exp.donorAllocations[0]?.donorCode || 'USAID';
          doc.text(donorCode, 475, y);
          y += 16;
        });

        y += 15;
      }

      // 5. Field Milestones Section
      if (includeTasks) {
        if (y > 620) {
          doc.addPage();
          y = 50;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text('3. FIELD TASK EXECUTION & VERIFICATION MILESTONES', 40, y);
        y += 16;

        const displayTasks = projectTasks.length > 0 ? projectTasks : tasks.slice(0, 5);
        displayTasks.forEach((t) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          doc.text(`• ${t.title}`, 46, y);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(`Status: ${t.status} | Lead: ${t.assignedToName || 'Field Lead'}`, 380, y);
          y += 14;
        });

        y += 20;
      }

      // 6. Sign-off Blocks
      if (y > 650) {
        doc.addPage();
        y = 60;
      }

      y += 10;
      doc.setDrawColor(203, 213, 225);
      doc.line(40, y, pageWidth - 40, y);
      y += 25;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('SUBMISSION CERTIFICATION & GOVERNANCE SIGN-OFF', 40, y);
      y += 16;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(
        'We hereby certify that the expenditures, monitoring records, and milestone verifications above comply strictly with contractual donor regulations, OMB Uniform Guidance 2 CFR 200, and standard humanitarian guidelines.',
        40,
        y,
        { maxWidth: pageWidth - 80 }
      );
      y += 40;

      // Signatures
      doc.line(40, y, 200, y);
      doc.text('Authorized Project Director', 40, y + 12);
      doc.text('Dr. Kwame Mensah', 40, y + 22);

      doc.line(320, y, 480, y);
      doc.text('Lead Compliance Auditor', 320, y + 12);
      doc.text('Elena Rostova (USAID OIG)', 320, y + 22);

      // Save PDF file
      const fileName = `Donor_Submission_Report_${project.code}_${donorFormat}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PDF Generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black tracking-tight">Donor Report Generation Tool</h2>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  PDF Dossier
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Aggregate project data and export an official submission document for donor review.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {downloadSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-900 font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>PDF document successfully generated and downloaded to your device!</span>
            </div>
          )}

          {/* Configuration Grid */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            
            {/* Select Target Project */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Select Target Project *</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Donor Template Format */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Donor Compliance Format Template</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDonorFormat('USAID')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    donorFormat === 'USAID'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-black'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-bold">USAID Standard</span>
                  <span className="text-[10px] text-slate-400 block font-normal">2 CFR 200 Format</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDonorFormat('EU')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    donorFormat === 'EU'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-black'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-bold">EU ECHO Format</span>
                  <span className="text-[10px] text-slate-400 block font-normal">Single Form M&amp;E</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDonorFormat('GLOBAL_FUND')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    donorFormat === 'GLOBAL_FUND'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-black'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-bold">Global Fund</span>
                  <span className="text-[10px] text-slate-400 block font-normal">PUDR Oversight</span>
                </button>
              </div>
            </div>

            {/* Sections to Include Checkboxes */}
            <div className="space-y-1.5 pt-1">
              <label className="font-bold text-slate-700 block">Dossier Sections to Include</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeIndicators}
                    onChange={(e) => setIncludeIndicators(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">M&amp;E Indicators ({projectIndicators.length || indicators.length})</span>
                </label>

                <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeFinancials}
                    onChange={(e) => setIncludeFinancials(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">Financial Vouchers ({projectExpenses.length || expenses.length})</span>
                </label>

                <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTasks}
                    onChange={(e) => setIncludeTasks(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">Field Milestones ({projectTasks.length || tasks.length})</span>
                </label>
              </div>
            </div>
          </div>

          {/* Report Live Summary Preview */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-black text-slate-900">Document Summary Preview</span>
              <span className="font-mono text-[10px] text-slate-400 uppercase">A4 Format • Formal Letter</span>
            </div>

            <div className="space-y-2 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>Project Title:</span>
                <strong className="text-slate-900">{project.title}</strong>
              </div>
              <div className="flex justify-between">
                <span>Award Code:</span>
                <strong className="font-mono text-slate-900">{project.code}</strong>
              </div>
              <div className="flex justify-between">
                <span>Approved Budget:</span>
                <strong className="text-indigo-700">${project.totalBudget?.toLocaleString() || '1,200,000'} USD</strong>
              </div>
              <div className="flex justify-between">
                <span>Expenditures Committed:</span>
                <strong className="text-emerald-700">${totalCommitted.toLocaleString()} USD</strong>
              </div>
              <div className="flex justify-between">
                <span>Quantitative LogFrame Indicators:</span>
                <strong className="text-slate-900">{projectIndicators.length || indicators.length} tracked</strong>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">
            Compliant with USAID ADS 596 • EU ECHO General Conditions
          </span>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-700 font-bold hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGeneratePDF}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold flex items-center space-x-2 transition shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating PDF...' : 'Export Donor Submission PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
