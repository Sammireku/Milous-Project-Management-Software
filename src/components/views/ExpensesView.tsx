import React, { useState, useMemo } from 'react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { 
  DollarSign, 
  Split, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Building2,
  ShieldAlert,
  Percent,
  X,
  Download,
  Landmark,
  Receipt,
  BarChart3
} from 'lucide-react';
import { Expense, ExpenseStatus } from '../../types';
import { ExpenseForm } from '../financials/ExpenseForm';
import { GlobalFilterToolbar, FilterState } from '../common/GlobalFilterToolbar';
import { logAuditEvent } from '../../lib/auditLogger';
import { SpreadsheetTableView, ColumnDef } from '../common/SpreadsheetTableView';
import { BudgetThresholdAlertBanner } from '../financials/BudgetThresholdAlertBanner';
import { DonorProjectPdfReportModal } from '../reports/DonorProjectPdfReportModal';
import { VendorDatabaseView } from '../vendors/VendorDatabaseView';
import { DonorDatabaseView } from '../donors/DonorDatabaseView';
import { FinancialAnalyticsDashboard } from '../financials/FinancialAnalyticsDashboard';

export const ExpensesView: React.FC = () => {
  const { 
    expenses, 
    projects, 
    indicators, 
    tasks, 
    updateExpenseStatus, 
    updateExpenseRiskFlags, 
    activeProject, 
    vendors, 
    donors,
    selectedDisplayCurrency,
    setSelectedDisplayCurrency,
    convertCurrency,
    fetchLiveExchangeRates,
    isFetchingRates,
    ratesLastUpdated,
    ratesSource
  } = useFirestore();
  const { permissions, currentUser, userRole } = useAuth();

  const [financialsTab, setFinancialsTab] = useState<'analytics' | 'expenses' | 'vendors' | 'donors'>('analytics');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('TABLE');

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    projectId: 'ALL',
    donorCode: 'ALL',
    startDate: '',
    endDate: '',
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (filters.projectId !== 'ALL' && e.projectId !== filters.projectId) {
        return false;
      }

      if (filters.donorCode !== 'ALL') {
        const hasDonor = e.donorAllocations.some((d) => d.donorCode === filters.donorCode);
        if (!hasDonor) return false;
      }

      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesDesc = e.description?.toLowerCase().includes(q);
        const matchesVendor = e.vendor?.toLowerCase().includes(q);
        const matchesSubmitter = e.submittedByName?.toLowerCase().includes(q);
        if (!matchesDesc && !matchesVendor && !matchesSubmitter) return false;
      }

      if (filters.startDate) {
        if (e.dateIncurred < filters.startDate) return false;
      }

      if (filters.endDate) {
        if (e.dateIncurred.split('T')[0] > filters.endDate) return false;
      }

      return true;
    });
  }, [expenses, filters]);

  const handleStatusChange = async (expense: Expense, newStatus: ExpenseStatus) => {
    await updateExpenseStatus(expense.id, newStatus);
    await logAuditEvent({
      projectId: expense.projectId || activeProject?.id,
      projectName: activeProject?.title || 'WASH Initiative Ghana',
      actionType: 'EXPENSE_ALLOCATION_UPDATED',
      entityType: 'Expense',
      entityId: expense.id,
      entityTitle: expense.description,
      modifiedByUserId: currentUser?.id || 'usr-fin-01',
      modifiedByUserName: currentUser?.displayName || 'Kofi Mensah',
      modifiedByUserRole: userRole || 'FINANCE_OFFICER',
      previousValue: expense.status,
      newValue: newStatus,
      changeSummary: `Expense status changed to ${newStatus}`,
    });
  };

  const exportExpensesToCSV = () => {
    const headers = [
      'Description',
      'Category',
      'Vendor',
      'Total Amount',
      'Currency',
      'Date Incurred',
      'Approval Status',
      'Submitted By',
      'Approved By',
      'Donor Cost Splitting Breakdown',
      'Risk Flag Assessment',
    ];

    const rows = filteredExpenses.map((e) => {
      const donorSplits = e.donorAllocations
        .map((d) => `${d.donorCode}: $${d.allocatedAmount} (${d.percentage}%)`)
        .join(' | ');

      const riskAssessment = e.aiRiskFlags
        ? `Risk Score ${e.aiRiskFlags.riskScore}/5 (${e.aiRiskFlags.category}): ${e.aiRiskFlags.evidence}`
        : 'None';

      return [
        `"${e.description.replace(/"/g, '""')}"`,
        `"${e.category || 'N/A'}"`,
        `"${e.vendor || 'N/A'}"`,
        e.totalAmount,
        e.currency,
        e.dateIncurred ? new Date(e.dateIncurred).toLocaleDateString() : '',
        e.status,
        `"${e.submittedByName || 'N/A'}"`,
        `"${e.approvedByName || 'N/A'}"`,
        `"${donorSplits}"`,
        `"${riskAssessment.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `grant_expense_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCommitted = filteredExpenses.reduce((sum, e) => sum + e.totalAmount, 0);


  const expenseColumns: ColumnDef<Expense>[] = [
    { key: 'description', header: 'Description / Purpose', editable: true, width: '220px' },
    { key: 'category', header: 'Category', editable: true, width: '130px' },
    { key: 'vendor', header: 'Vendor / Contractor', editable: true, width: '150px' },
    { 
      key: 'totalAmount', 
      header: `Total Amount (${selectedDisplayCurrency})`, 
      editable: true, 
      width: '140px',
      render: (row) => {
        const converted = convertCurrency(row.totalAmount, row.currency || 'USD', selectedDisplayCurrency);
        const symbol = selectedDisplayCurrency === 'GHS' ? 'GH₵' : selectedDisplayCurrency === 'EUR' ? '€' : selectedDisplayCurrency === 'GBP' ? '£' : '$';
        return (
          <span className="font-bold text-slate-900 font-mono">
            {symbol}{Math.round(converted).toLocaleString()} {selectedDisplayCurrency}
          </span>
        );
      }
    },
    { key: 'dateIncurred', header: 'Date Incurred', editable: true, width: '110px' },
    { 
      key: 'status', 
      header: 'Approval Status', 
      width: '130px',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
          row.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
          row.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {row.status}
        </span>
      )
    },
    { 
      key: 'donorAllocations', 
      header: `Donor Cost Split (${selectedDisplayCurrency})`, 
      width: '200px',
      render: (row) => {
        const symbol = selectedDisplayCurrency === 'GHS' ? 'GH₵' : selectedDisplayCurrency === 'EUR' ? '€' : selectedDisplayCurrency === 'GBP' ? '£' : '$';
        return (
          <div className="flex flex-wrap gap-1">
            {row.donorAllocations?.map((d) => {
              const convertedAlloc = convertCurrency(d.allocatedAmount, row.currency || 'USD', selectedDisplayCurrency);
              return (
                <span key={d.donorCode} className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 border rounded shrink-0">
                  {d.donorCode}: {symbol}{Math.round(convertedAlloc).toLocaleString()}
                </span>
              );
            })}
          </div>
        );
      }
    },
    { key: 'submittedByName', header: 'Submitted By', width: '130px' },
  ];

  const handleBulkApprove = (ids: string[]) => {
    ids.forEach((id) => updateExpenseStatus(id, 'APPROVED'));
  };

  return (
    <div className="space-y-6">
      {/* Financial Operations Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setFinancialsTab('analytics')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            financialsTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Donor Burn Rates &amp; Trends</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            financialsTab === 'analytics' ? 'bg-slate-800 text-emerald-300' : 'bg-emerald-50 text-emerald-700 font-bold'
          }`}>
            Recharts
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFinancialsTab('expenses')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            financialsTab === 'expenses'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-400" />
          <span>Multi-Donor Vouchers &amp; Cost Splitting</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            financialsTab === 'expenses' ? 'bg-slate-800 text-emerald-300' : 'bg-slate-100 text-slate-600'
          }`}>
            {expenses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFinancialsTab('vendors')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            financialsTab === 'vendors'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Vendor Procurement Database</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            financialsTab === 'vendors' ? 'bg-slate-800 text-emerald-300' : 'bg-slate-100 text-slate-600'
          }`}>
            {vendors.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFinancialsTab('donors')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            financialsTab === 'donors'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Landmark className="w-4 h-4 text-emerald-400" />
          <span>Institutional Donor Database</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            financialsTab === 'donors' ? 'bg-slate-800 text-emerald-300' : 'bg-slate-100 text-slate-600'
          }`}>
            {donors.length}
          </span>
        </button>
      </div>

      {financialsTab === 'analytics' ? (
        <FinancialAnalyticsDashboard
          expenses={expenses}
          projects={projects}
          donors={donors}
          selectedDisplayCurrency={selectedDisplayCurrency}
          convertCurrency={convertCurrency}
        />
      ) : financialsTab === 'vendors' ? (
        <VendorDatabaseView />
      ) : financialsTab === 'donors' ? (
        <DonorDatabaseView />
      ) : (
        <>
          {/* View Mode Toggle Header with Real-time FX Switcher */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-slate-900">Financial Vouchers &amp; Grant Audit</h1>
              <p className="text-xs text-slate-500">
                Excel spreadsheet view with multi-currency conversion, bulk actions, and cost splitting.
              </p>
              {ratesLastUpdated && (
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold">
                  <span>Rates last updated: {new Date(ratesLastUpdated).toLocaleTimeString()} ({ratesSource})</span>
                  <span>•</span>
                  <button 
                    onClick={() => fetchLiveExchangeRates('USD')}
                    disabled={isFetchingRates}
                    className="text-emerald-600 hover:text-emerald-700 underline cursor-pointer disabled:opacity-50"
                  >
                    {isFetchingRates ? 'Fetching...' : 'Fetch Live Rates'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Display Currency Selector */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
                <span className="px-2 text-slate-400 text-[10px] uppercase">Base:</span>
                {(['USD', 'EUR', 'GBP', 'GHS'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setSelectedDisplayCurrency(curr)}
                    className={`px-2.5 py-1.5 rounded-lg transition text-[11px] ${
                      selectedDisplayCurrency === curr ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {curr === 'GHS' ? '₵' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : '$'} {curr}
                  </button>
                ))}
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode('TABLE')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Excel Table View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('CARDS')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    viewMode === 'CARDS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Card View
                </button>
              </div>

              <button
                type="button"
                onClick={exportExpensesToCSV}
                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>

              {permissions.canCreateExpenses && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Voucher</span>
                </button>
              )}
            </div>
          </div>

      {viewMode === 'TABLE' ? (
        <SpreadsheetTableView
          title="Multi-Donor Expense Vouchers Grid"
          data={filteredExpenses}
          columns={expenseColumns}
          onBulkApprove={handleBulkApprove}
        />
      ) : null}
      {/* Real-time Budget Threshold Notification System */}
      <BudgetThresholdAlertBanner
        expenses={filteredExpenses.length > 0 ? filteredExpenses : expenses}
        activeProject={activeProject}
      />

      {/* Top BVA & Compliance Summary */}
      <div id="donor-allocator-card" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(() => {
          const symbol = selectedDisplayCurrency === 'GHS' ? 'GH₵' : selectedDisplayCurrency === 'EUR' ? '€' : selectedDisplayCurrency === 'GBP' ? '£' : '$';
          
          const convertedTotal = convertCurrency(totalCommitted, 'USD', selectedDisplayCurrency);
          
          const usaidUSD = expenses.reduce((sum, e) => {
            const u = e.donorAllocations.find((d) => d.donorCode === 'USAID');
            return sum + (u ? u.allocatedAmount : 0);
          }, 0);
          const convertedUsaid = convertCurrency(usaidUSD, 'USD', selectedDisplayCurrency);

          const euUSD = expenses.reduce((sum, e) => {
            const eu = e.donorAllocations.find((d) => d.donorCode === 'EU');
            return sum + (eu ? eu.allocatedAmount : 0);
          }, 0);
          const convertedEu = convertCurrency(euUSD, 'USD', selectedDisplayCurrency);

          return (
            <>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Total Expenditure Logged ({selectedDisplayCurrency})</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{symbol}{Math.round(convertedTotal).toLocaleString()} {selectedDisplayCurrency}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {expenses.length} invoices split across active grant awards
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>USAID Split Allocation ({selectedDisplayCurrency})</span>
                  <Split className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {symbol}{Math.round(convertedUsaid).toLocaleString()} {selectedDisplayCurrency}
                </p>
                <p className="text-xs text-slate-400 mt-1">Grant AID-641-A-17-00042</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>EU Humanitarian Allocation ({selectedDisplayCurrency})</span>
                  <Split className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {symbol}{Math.round(convertedEu).toLocaleString()} {selectedDisplayCurrency}
                </p>
                <p className="text-xs text-slate-400 mt-1">Grant EU-ECHO-2025-WASH-GH</p>
              </div>
            </>
          );
        })()}
      </div>

      {/* Header & Submit Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Multi-Donor Expense Compliance &amp; Cost Records
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Every expenditure is fractionally divided across donor grants by verified percentage before disbursement.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200 flex items-center space-x-2 transition shadow-xs"
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Generate Donor PDF</span>
          </button>

          <button
            type="button"
            onClick={exportExpensesToCSV}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center space-x-2 transition shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export to CSV</span>
          </button>

          {permissions.canSubmitExpenses && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold flex items-center space-x-2 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Fractional Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Filter Toolbar */}
      <GlobalFilterToolbar
        filters={filters}
        onFilterChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
        onResetFilters={() =>
          setFilters({
            searchQuery: '',
            projectId: 'ALL',
            donorCode: 'ALL',
            startDate: '',
            endDate: '',
          })
        }
        projects={projects}
        availableDonors={['USAID', 'EU', 'UNICEF', 'FCDO', 'GLOBAL_FUND', 'WORLD_BANK']}
        placeholder="Search expenses by vendor, description, or submitter..."
      />

      {/* Expense List */}
      <div id="fiduciary-audit-card" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredExpenses.map((expense) => {
            const isApproved = expense.status === 'APPROVED';
            const isPending = expense.status === 'PENDING';


            return (
              <div key={expense.id} className="p-5 hover:bg-slate-50/70 transition">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Expense Main Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{expense.description}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : isPending
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {expense.status}
                      </span>
                      {expense.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {expense.category}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center text-xs text-slate-500 gap-3">
                      <span>Vendor: <strong className="text-slate-700">{expense.vendor || 'N/A'}</strong></span>
                      <span>•</span>
                      <span>Date: {new Date(expense.dateIncurred).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Submitted by: {expense.submittedByName}</span>
                      {expense.approvedByName && (
                        <>
                          <span>•</span>
                          <span>Approved by: {expense.approvedByName}</span>
                        </>
                      )}
                    </div>

                    {/* AI Risk Flag Highlight */}
                    {expense.aiRiskFlags && (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-start space-x-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-900">
                            Vertex AI Gemini Flag (Risk Score: {expense.aiRiskFlags.riskScore}/5 - {expense.aiRiskFlags.category}):
                          </span>
                          <p className="text-[11px] text-amber-800 mt-0.5">{expense.aiRiskFlags.evidence}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fractional Cost Splitting Breakdown */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {(() => {
                      const symbol = selectedDisplayCurrency === 'GHS' ? 'GH₵' : selectedDisplayCurrency === 'EUR' ? '€' : selectedDisplayCurrency === 'GBP' ? '£' : '$';
                      const convertedTotal = convertCurrency(expense.totalAmount, expense.currency || 'USD', selectedDisplayCurrency);
                      return (
                        <div className="text-right">
                          <p className="text-base font-black text-slate-900">
                            {symbol}{Math.round(convertedTotal).toLocaleString()} {selectedDisplayCurrency}
                          </p>
                          <p className="text-[11px] text-slate-400">Total Incurred</p>
                        </div>
                      );
                    })()}

                    {/* Donor Split Badges */}
                    <div className="flex flex-col space-y-1 min-w-[170px]">
                      {expense.donorAllocations.map((d) => {
                        const symbol = selectedDisplayCurrency === 'GHS' ? 'GH₵' : selectedDisplayCurrency === 'EUR' ? '€' : selectedDisplayCurrency === 'GBP' ? '£' : '$';
                        const convertedAlloc = convertCurrency(d.allocatedAmount, expense.currency || 'USD', selectedDisplayCurrency);
                        return (
                          <div
                            key={d.donorCode}
                            className="flex items-center justify-between text-xs px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200"
                          >
                            <span className="font-bold text-slate-700">{d.donorCode} ({d.percentage}%)</span>
                            <span className="font-semibold text-slate-900">
                              {symbol}{Math.round(convertedAlloc).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Approval Actions */}
                    {isPending && permissions.canApproveExpenses && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(expense, 'APPROVED')}
                          className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                          title="Approve Expense"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(expense, 'REJECTED')}
                          className="p-1.5 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 transition"
                          title="Reject Expense"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Donor Fractional Cost Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-2xl w-full my-8">
            <ExpenseForm 
              onSuccess={() => setIsModalOpen(false)}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
        </>
      )}

      {/* Official Donor PDF Report Dossier Generator Modal */}
      <DonorProjectPdfReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        projects={projects}
        activeProjectId={activeProject?.id}
        indicators={indicators}
        expenses={expenses}
        tasks={tasks}
      />
    </div>
  );
};
