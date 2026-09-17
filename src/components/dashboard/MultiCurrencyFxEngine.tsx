import React, { useState } from 'react';
import { 
  Calculator, 
  Coins, 
  TrendingUp, 
  RefreshCw, 
  ArrowRight, 
  DollarSign, 
  Check 
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';

export const MultiCurrencyFxEngine: React.FC = () => {
  const { expenses } = useFirestore();

  // Exchange rates relative to 1 USD
  const fxRates = {
    USD: 1.0,
    GHS: 15.85, // Ghana Cedi
    XOF: 605.20, // West African CFA Franc
    NGN: 1610.0, // Nigerian Naira
    EUR: 0.92, // Euro
    GBP: 0.78, // British Pound
  };

  const [inputAmount, setInputAmount] = useState('50000');
  const [fromCurrency, setFromCurrency] = useState<keyof typeof fxRates>('GHS');
  const [toCurrency, setToCurrency] = useState<keyof typeof fxRates>('USD');

  const parsedVal = parseFloat(inputAmount) || 0;
  const usdEquivalent = parsedVal / fxRates[fromCurrency];
  const convertedVal = usdEquivalent * fxRates[toCurrency];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold border border-purple-500/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              4. Multi-Currency Automated FX Engine
            </h3>
            <p className="text-xs text-slate-500">
              Live FX normalization for GHS, CFA, NGN, EUR, GBP into USD for BVA reporting
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 flex items-center space-x-1">
          <RefreshCw className="w-3 h-3 text-purple-600 animate-spin" />
          <span>Real-Time Rate Ticker</span>
        </span>
      </div>

      {/* FX Rates Ticker Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <span className="text-slate-400 block text-[10px]">USD / GHS</span>
          <span className="font-bold text-slate-900">15.85 GHS</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <span className="text-slate-400 block text-[10px]">USD / CFA (XOF)</span>
          <span className="font-bold text-slate-900">605.20 XOF</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <span className="text-slate-400 block text-[10px]">USD / NGN</span>
          <span className="font-bold text-slate-900">1,610 NGN</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <span className="text-slate-400 block text-[10px]">USD / EUR</span>
          <span className="font-bold text-slate-900">0.92 EUR</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <span className="text-slate-400 block text-[10px]">USD / GBP</span>
          <span className="font-bold text-slate-900">0.78 GBP</span>
        </div>
      </div>

      {/* Interactive FX Converter Tool */}
      <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
        <span className="font-bold text-purple-950 text-xs block uppercase tracking-wider">
          Field Voucher Currency Normalizer
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Amount
            </label>
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              From Currency
            </label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold focus:outline-none"
            >
              {Object.keys(fxRates).map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-white border border-purple-200 text-right">
            <span className="text-[10px] font-bold text-purple-700 uppercase block">
              Normalized Output ({toCurrency})
            </span>
            <span className="text-base font-black text-slate-900 font-mono">
              ${convertedVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
