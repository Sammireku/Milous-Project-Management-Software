import React, { useState, useId } from 'react';
import { 
  DollarSign, 
  Split, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Calendar, 
  Receipt, 
  Layers,
  Sparkles,
  ArrowRight,
  Calculator
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { Expense, DonorAllocation } from '../../types';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { OfflineImageUploader } from '../OfflineImageUploader';

export interface ExpenseFormProps {
  onSuccess?: (createdExpense: Expense) => void;
  onCancel?: () => void;
  defaultProjectId?: string;
}

const COMMON_DONORS = [
  { code: 'USAID', name: 'USAID (Bureau for Humanitarian Assistance)' },
  { code: 'EU', name: 'European Commission (ECHO / DEVCO)' },
  { code: 'UNICEF', name: 'United Nations Children\'s Fund' },
  { code: 'FCDO', name: 'UK Foreign, Commonwealth & Development Office' },
  { code: 'GLOBAL_FUND', name: 'The Global Fund to Fight AIDS, TB & Malaria' },
  { code: 'GIZ', name: 'Deutsche Gesellschaft für Internationale Zusammenarbeit' },
  { code: 'WORLD_BANK', name: 'World Bank IDA Grant' }
];

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'GHS', 'KES', 'CAD', 'CHF'];

const CATEGORY_OPTIONS: Array<NonNullable<Expense['category']>> = [
  'PROCUREMENT',
  'PERSONNEL',
  'LOGISTICS',
  'FIELD_OPS',
  'EQUIPMENT',
  'INDIRECT',
];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  onSuccess, 
  onCancel,
  defaultProjectId 
}) => {
  const formId = useId();
  const { activeProject, createExpense, isOnline } = useFirestore();
  const { currentUser } = useAuth();

  // 1. Form State
  const [totalAmount, setTotalAmount] = useState<number>(5000);
  const [currency, setCurrency] = useState<string>('USD');
  const [description, setDescription] = useState<string>('');
  const [vendor, setVendor] = useState<string>('');
  const [category, setCategory] = useState<NonNullable<Expense['category']>>('EQUIPMENT');
  const [dateIncurred, setDateIncurred] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Default donor allocations based on project donors or common humanitarian donors
  const projectDonors = activeProject?.donors || [];
  const initialDonor1 = projectDonors[0]?.donorCode || 'USAID';
  const initialDonor2 = projectDonors[1]?.donorCode || 'EU';

  const [donorAllocations, setDonorAllocations] = useState<DonorAllocation[]>([
    { 
      donorCode: initialDonor1, 
      percentage: 60, 
      allocatedAmount: 3000, 
      budgetLineCode: `${initialDonor1}-BL-2.1` 
    },
    { 
      donorCode: initialDonor2, 
      percentage: 40, 
      allocatedAmount: 2000, 
      budgetLineCode: `${initialDonor2}-BL-1.4` 
    }
  ]);

  // 2. Calculations & Validation
  const totalPercentage = donorAllocations.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0);
  const roundedTotalPercentage = Math.round(totalPercentage * 100) / 100;
  const isExactlyHundredPercent = Math.abs(roundedTotalPercentage - 100) < 0.001;

  const totalAllocatedAmount = donorAllocations.reduce(
    (sum, item) => sum + (Number(item.allocatedAmount) || 0), 
    0
  );
  const remainingPercentage = Math.round((100 - roundedTotalPercentage) * 100) / 100;
  const remainingAmount = Number((totalAmount - totalAllocatedAmount).toFixed(2));

  // 3. Dynamic Splitting Handlers
  const handleTotalAmountChange = (newAmount: number) => {
    const validAmount = isNaN(newAmount) || newAmount < 0 ? 0 : newAmount;
    setTotalAmount(validAmount);

    // Recalculate allocatedAmount for all rows based on their current percentage
    setDonorAllocations((prev) =>
      prev.map((item) => ({
        ...item,
        allocatedAmount: Number(((validAmount * (item.percentage || 0)) / 100).toFixed(2)),
      }))
    );
  };

  const handlePercentageChange = (index: number, rawValue: string) => {
    const newPct = parseFloat(rawValue);
    const validPct = isNaN(newPct) ? 0 : newPct;

    setDonorAllocations((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };
      target.percentage = validPct;
      target.allocatedAmount = Number(((totalAmount * validPct) / 100).toFixed(2));
      updated[index] = target;
      return updated;
    });
  };

  const handleAllocatedAmountChange = (index: number, rawValue: string) => {
    const newAmt = parseFloat(rawValue);
    const validAmt = isNaN(newAmt) ? 0 : newAmt;

    setDonorAllocations((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };
      target.allocatedAmount = validAmt;
      target.percentage = totalAmount > 0 
        ? Number(((validAmt / totalAmount) * 100).toFixed(2)) 
        : 0;
      updated[index] = target;
      return updated;
    });
  };

  const handleDonorCodeChange = (index: number, newCode: string) => {
    setDonorAllocations((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        donorCode: newCode,
        budgetLineCode: `${newCode}-BL-1.1`
      };
      return updated;
    });
  };

  const handleBudgetLineChange = (index: number, newLine: string) => {
    setDonorAllocations((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        budgetLineCode: newLine
      };
      return updated;
    });
  };

  const handleAddDonorSplit = () => {
    // Pick an unused donor code if possible
    const usedCodes = new Set(donorAllocations.map((d) => d.donorCode));
    const available = COMMON_DONORS.find((d) => !usedCodes.has(d.code))?.code || 'UNICEF';

    const defaultPct = remainingPercentage > 0 ? remainingPercentage : 0;
    const defaultAmt = Number(((totalAmount * defaultPct) / 100).toFixed(2));

    setDonorAllocations((prev) => [
      ...prev,
      {
        donorCode: available,
        percentage: defaultPct,
        allocatedAmount: defaultAmt,
        budgetLineCode: `${available}-BL-3.0`,
      }
    ]);
  };

  const handleRemoveDonorSplit = (index: number) => {
    if (donorAllocations.length <= 1) return;
    setDonorAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSplitEvenly = () => {
    if (donorAllocations.length === 0) return;
    const count = donorAllocations.length;
    const basePct = Math.floor((100 / count) * 100) / 100;
    const remainder = Number((100 - (basePct * count)).toFixed(2));

    setDonorAllocations((prev) =>
      prev.map((item, index) => {
        // distribute rounding remainder to the first row
        const rowPct = index === 0 ? Number((basePct + remainder).toFixed(2)) : basePct;
        return {
          ...item,
          percentage: rowPct,
          allocatedAmount: Number(((totalAmount * rowPct) / 100).toFixed(2)),
        };
      })
    );
  };

  // 4. Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validation checks
    if (!description.trim()) {
      setSubmitError('Please enter a description for the expense invoice.');
      return;
    }

    if (totalAmount <= 0) {
      setSubmitError('Total amount must be greater than zero.');
      return;
    }

    if (!isExactlyHundredPercent) {
      setSubmitError(
        `Total donor allocation must equal exactly 100.00%. Current sum: ${roundedTotalPercentage}%.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const nowIso = new Date().toISOString();
      const expenseDocRef = doc(collection(db, 'expenses'));
      const expenseId = expenseDocRef.id;

      const targetProjectId = defaultProjectId || activeProject?.id || 'proj-gh-wash-2025';

      // Compile exact Expense data structure
      const newExpense: Expense = {
        id: expenseId,
        projectId: targetProjectId,
        submittedById: currentUser?.id || 'usr-finance-01',
        submittedByName: currentUser?.displayName || 'Finance Officer',
        status: 'PENDING',
        totalAmount,
        currency,
        usdEquivalent: currency === 'USD' ? totalAmount : Number((totalAmount * 1.0).toFixed(2)),
        dateIncurred,
        description: description.trim(),
        vendor: vendor.trim() || undefined,
        category,
        donorAllocations: donorAllocations.map((d) => ({
          donorCode: d.donorCode.trim(),
          percentage: Number(d.percentage),
          allocatedAmount: Number(d.allocatedAmount),
          budgetLineCode: d.budgetLineCode?.trim() || `${d.donorCode}-BL`,
        })),
        receiptUris: [
          `gs://milous-invoices/${targetProjectId}/${Date.now()}-receipt.pdf`,
        ],
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // 1. Direct Firestore write to `/expenses/{expenseId}`
      try {
        await setDoc(expenseDocRef, newExpense);
      } catch (firestoreErr) {
        console.warn('Firestore direct write notice (handled via local cache):', firestoreErr);
      }

      // 2. Update reactive application context (includes offline queueing)
      await createExpense(newExpense);

      if (onSuccess) {
        onSuccess(newExpense);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit expense record.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      id={`${formId}-expense-form`}
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Split className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Multi-Donor Cost Splitting</h3>
            <p className="text-[11px] text-slate-500">
              Log expenditures and divide costs across institutional grant lines (BVA compliance).
            </p>
          </div>
        </div>

        {activeProject && (
          <div className="hidden sm:flex items-center space-x-1 text-[11px] font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>[{activeProject.code}]</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Error Alert */}
        {submitError && (
          <div className="flex items-start space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Validation Error:</span> {submitError}
            </div>
          </div>
        )}

        {/* Section 1: General Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Expense Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Procurement of 200 Submersible Solar Water Pumps for Northern District"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Vendor / Supplier
            </label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g., Volta River Hydro Solutions Ltd"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
            />
          </div>
        </div>

        {/* Section 2: Amounts & Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Amount */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Total Invoice Amount <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                {currency === 'USD' ? '$' : currency}
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={totalAmount === 0 ? '' : totalAmount}
                onChange={(e) => handleTotalAmountChange(parseFloat(e.target.value) || 0)}
                placeholder="5000"
                className="w-full pl-8 pr-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
              />
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white cursor-pointer"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Cost Category */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Expenditure Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NonNullable<Expense['category']>)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Date Incurred */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Date Incurred
            </label>
            <input
              type="date"
              value={dateIncurred}
              onChange={(e) => setDateIncurred(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
            />
          </div>
        </div>

        {/* Section 2.5: Offline Field Receipt & Scan Attachment */}
        <div className="pt-2 border-t border-slate-100">
          <OfflineImageUploader
            targetCollection="expenses"
            targetDocId={defaultProjectId || activeProject?.id || 'proj-gh-wash-2025'}
            targetField="receiptUris"
            label="Attach Receipt / Field Invoice Scan (Offline-First)"
            description="Photos are auto-compressed under 1MB and stored in local IndexedDB if offline until internet reconnects."
          />
        </div>

        {/* Section 3: Multi-Donor Dynamic Allocations */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Split className="w-3.5 h-3.5 text-emerald-600" />
                <span>Donor Cost Split Allocations</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Adjust either percentage or dollar amount; values auto-calculate reciprocally.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSplitEvenly}
                title="Divide 100% equally across all donors"
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <Calculator className="w-3 h-3 text-slate-500" />
                <span>Split Evenly</span>
              </button>

              <button
                type="button"
                onClick={handleAddDonorSplit}
                className="inline-flex items-center space-x-1 px-3 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Donor Split</span>
              </button>
            </div>
          </div>

          {/* Allocation Rows */}
          <div className="space-y-2.5">
            {donorAllocations.map((item, index) => {
              const rowId = `${formId}-row-${index}`;
              return (
                <div 
                  key={index}
                  className="grid grid-cols-12 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 items-center text-xs"
                >
                  {/* Donor Selector */}
                  <div className="col-span-12 sm:col-span-4">
                    <label htmlFor={`${rowId}-donor`} className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Donor Grant
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <select
                        id={`${rowId}-donor`}
                        value={item.donorCode}
                        onChange={(e) => handleDonorCodeChange(index, e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      >
                        {COMMON_DONORS.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.code} — {d.name.split('(')[0]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Budget Line Code */}
                  <div className="col-span-12 sm:col-span-3">
                    <label htmlFor={`${rowId}-budget-line`} className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Budget Line
                    </label>
                    <input
                      id={`${rowId}-budget-line`}
                      type="text"
                      value={item.budgetLineCode || ''}
                      onChange={(e) => handleBudgetLineChange(index, e.target.value)}
                      placeholder="BL-3.1"
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  {/* Percentage Input */}
                  <div className="col-span-5 sm:col-span-2">
                    <label htmlFor={`${rowId}-percentage`} className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Share (%)
                    </label>
                    <div className="relative">
                      <input
                        id={`${rowId}-percentage`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.percentage === 0 ? '' : item.percentage}
                        onChange={(e) => handlePercentageChange(index, e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-2.5 pr-6 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                      <span className="absolute right-2 top-1.5 text-[11px] font-bold text-slate-400">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Allocated Amount */}
                  <div className="col-span-5 sm:col-span-2">
                    <label htmlFor={`${rowId}-allocated-amount`} className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Amount ({currency})
                    </label>
                    <input
                      id={`${rowId}-allocated-amount`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.allocatedAmount === 0 ? '' : item.allocatedAmount}
                      onChange={(e) => handleAllocatedAmountChange(index, e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="col-span-2 sm:col-span-1 flex items-end justify-center pb-0.5">
                    <button
                      type="button"
                      disabled={donorAllocations.length <= 1}
                      onClick={() => handleRemoveDonorSplit(index)}
                      title={donorAllocations.length <= 1 ? 'At least one donor is required' : 'Remove this donor split'}
                      className={`p-1.5 rounded-lg text-slate-400 transition ${
                        donorAllocations.length <= 1
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Percentage & Remaining Indicator */}
          <div className={`p-4 rounded-xl border transition-all ${
            isExactlyHundredPercent
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : roundedTotalPercentage > 100
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs mb-2">
              <div className="flex items-center space-x-2">
                {isExactlyHundredPercent ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className={`w-4 h-4 shrink-0 ${
                    roundedTotalPercentage > 100 ? 'text-rose-600' : 'text-amber-600'
                  }`} />
                )}
                <div>
                  <span className="font-bold">
                    Total Allocation:{' '}
                    <span className="font-mono text-sm">
                      {roundedTotalPercentage.toFixed(2)}%
                    </span>
                  </span>
                  <span className="text-[11px] opacity-80 ml-2">
                    (${totalAllocatedAmount.toLocaleString()} of ${totalAmount.toLocaleString()} {currency})
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-semibold">
                {isExactlyHundredPercent ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                    100% Balanced - Ready to Submit
                  </span>
                ) : roundedTotalPercentage > 100 ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">
                    Over-allocated by {(roundedTotalPercentage - 100).toFixed(2)}% (${Math.abs(remainingAmount).toFixed(2)} {currency})
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                    Remaining to Allocate: {remainingPercentage.toFixed(2)}% (${remainingAmount.toFixed(2)} {currency})
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex shadow-inner">
              {donorAllocations.map((item, idx) => {
                const widthPct = totalPercentage > 0 
                  ? Math.min((item.percentage / Math.max(totalPercentage, 100)) * 100, 100) 
                  : 0;
                const colors = [
                  'bg-emerald-500', 
                  'bg-blue-500', 
                  'bg-purple-500', 
                  'bg-amber-500', 
                  'bg-teal-500', 
                  'bg-indigo-500'
                ];
                const color = colors[idx % colors.length];

                return (
                  <div
                    key={idx}
                    title={`${item.donorCode}: ${item.percentage}% ($${item.allocatedAmount})`}
                    style={{ width: `${widthPct}%` }}
                    className={`${color} transition-all duration-300 relative group`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="text-[11px] text-slate-500">
          {!isOnline && (
            <span className="text-amber-700 font-medium">
              Offline mode: Expense will be saved locally in IndexedDB and queued for sync.
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={!isExactlyHundredPercent || isSubmitting || totalAmount <= 0}
            className={`inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition ${
              isExactlyHundredPercent && totalAmount > 0 && !isSubmitting
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer hover:shadow'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving to Firestore...</span>
              </>
            ) : (
              <>
                <span>Submit Multi-Donor Expense</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
export default ExpenseForm;
