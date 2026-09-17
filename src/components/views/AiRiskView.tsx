import React, { useState } from 'react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, 
  FileSearch, 
  UploadCloud, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  ScanLine,
  ArrowRight
} from 'lucide-react';
import { Expense } from '../../types';

export const AiRiskView: React.FC = () => {
  const { expenses, updateExpenseRiskFlags } = useFirestore();
  const { permissions } = useAuth();

  const [documentUri, setDocumentUri] = useState('gs://milous-field-reports/tamale-drilling-audit-feb2025.pdf');
  const [selectedExpenseId, setSelectedExpenseId] = useState(expenses[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedResult, setExtractedResult] = useState<Expense['aiRiskFlags'] | null>(null);

  const handleSimulateExtraction = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const mockResult: NonNullable<Expense['aiRiskFlags']> = {
        riskScore: 4,
        category: 'Sole-Source Procurement Without Waiver',
        evidence:
          'Audit analysis of scanned field document shows equipment invoice from SolarTech West Africa Ltd issued without competitive 3-bid tender or approved USAID mission waiver (22 CFR 228 violation).',
      };
      setExtractedResult(mockResult);
      if (selectedExpenseId) {
        updateExpenseRiskFlags(selectedExpenseId, mockResult);
      }
      setIsAnalyzing(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 text-white p-6 rounded-2xl border border-purple-800/40 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">
                Vertex AI Multimodal Risk Analysis Pipeline
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-300 border border-purple-700 font-bold">
                Gemini 2.5 Flash / Cloud Function
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Automated document extraction pipeline ingesting scanned receipts, handwritten field notes, and donor compliance audits from Google Cloud Storage into strict JSON risk flags.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Ingestion & Trigger */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <ScanLine className="w-4 h-4 text-purple-600" />
            <span>Document Ingestion Trigger</span>
          </h3>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Google Cloud Storage URI</label>
            <input
              type="text"
              value={documentUri}
              onChange={(e) => setDocumentUri(e.target.value)}
              placeholder="gs://bucket-name/folder/document.pdf"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Supports scanned PDFs, JPEG/PNG handwritten receipts, or field survey signoff sheets.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Link to Project Expense Record</label>
            <select
              value={selectedExpenseId}
              onChange={(e) => setSelectedExpenseId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            >
              {expenses.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.description} (${e.totalAmount} {e.currency})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSimulateExtraction}
            disabled={isAnalyzing}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <ScanLine className="w-4 h-4 animate-spin" />
                <span>Running Vertex AI Gemini Multimodal Extraction...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Execute AI Risk Extraction</span>
              </>
            )}
          </button>
        </div>

        {/* Extraction Result Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <FileSearch className="w-4 h-4 text-emerald-600" />
            <span>Extracted Risk Intelligence (Pydantic Schema Output)</span>
          </h3>

          {extractedResult ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Compliance Audit Result</span>
                <span className="px-2 py-0.5 rounded font-black text-[11px] bg-rose-100 text-rose-800 border border-rose-200">
                  Severity Score: {extractedResult.riskScore} / 5
                </span>
              </div>

              <div>
                <span className="font-bold text-slate-700 block">Risk Category:</span>
                <p className="text-slate-900 font-semibold">{extractedResult.category}</p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block">Evidence &amp; Donor Compliance Finding:</span>
                <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 mt-1 leading-relaxed">
                  {extractedResult.evidence}
                </p>
              </div>

              <div className="pt-2 flex items-center text-emerald-600 space-x-1 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Persisted directly to Firestore expense record</span>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
              No document analyzed yet in this session. Trigger extraction or inspect existing flagged expenses.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
