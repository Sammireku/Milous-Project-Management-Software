import React, { useState } from 'react';
import { X, Palette, Check, Sparkles } from 'lucide-react';

export interface DashboardDesignTheme {
  primaryColor: 'emerald' | 'slate' | 'indigo' | 'amber' | 'teal' | 'rose';
  cornerRadius: 'rounded-lg' | 'rounded-xl' | 'rounded-2xl';
  density: 'compact' | 'standard' | 'spacious';
  backgroundStyle: 'plain' | 'subtle' | 'tinted';
}

export const DEFAULT_DASHBOARD_THEME: DashboardDesignTheme = {
  primaryColor: 'emerald',
  cornerRadius: 'rounded-xl',
  density: 'standard',
  backgroundStyle: 'plain',
};

interface DashboardDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: DashboardDesignTheme;
  onSaveTheme: (theme: DashboardDesignTheme) => void;
}

export const DashboardDesignModal: React.FC<DashboardDesignModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSaveTheme,
}) => {
  const [theme, setTheme] = useState<DashboardDesignTheme>(currentTheme);

  if (!isOpen) return null;

  const colorOptions: { id: DashboardDesignTheme['primaryColor']; label: string; bg: string; border: string }[] = [
    { id: 'emerald', label: 'Emerald Eco (Default)', bg: 'bg-emerald-600', border: 'border-emerald-600' },
    { id: 'slate', label: 'Dark Slate Institutional', bg: 'bg-slate-800', border: 'border-slate-800' },
    { id: 'indigo', label: 'Deep Ocean Humanitarian', bg: 'bg-indigo-600', border: 'border-indigo-600' },
    { id: 'amber', label: 'Savannah Sun Warm', bg: 'bg-amber-600', border: 'border-amber-600' },
    { id: 'teal', label: 'Clean Aquatic Teal', bg: 'bg-teal-600', border: 'border-teal-600' },
    { id: 'rose', label: 'Rose Impact Crimson', bg: 'bg-rose-600', border: 'border-rose-600' },
  ];

  const handleApply = () => {
    onSaveTheme(theme);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Dashboard Design & Layout</h3>
              <p className="text-[10px] text-slate-400">Customize preferred colors and look and feel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Preferred Color Theme */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">Primary Accent Color</label>
            <div className="grid grid-cols-2 gap-2">
              {colorOptions.map((c) => {
                const isSelected = theme.primaryColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTheme({ ...theme, primaryColor: c.id })}
                    className={`p-2.5 rounded-xl border flex items-center space-x-2.5 transition text-left cursor-pointer ${
                      isSelected
                        ? `${c.border} bg-slate-50 ring-2 ring-emerald-500/20 font-bold`
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full shrink-0 ${c.bg}`} />
                    <span className="text-[11px] text-slate-800 truncate">{c.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Corner Radius */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Card Corner Radius</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'rounded-lg' as const, label: 'Sharp (8px)' },
                { id: 'rounded-xl' as const, label: 'Smooth (12px)' },
                { id: 'rounded-2xl' as const, label: 'Soft (16px)' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setTheme({ ...theme, cornerRadius: r.id })}
                  className={`p-2 rounded-xl border text-center transition font-semibold cursor-pointer ${
                    theme.cornerRadius === r.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Widget Density</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'compact' as const, label: 'Compact' },
                { id: 'standard' as const, label: 'Standard' },
                { id: 'spacious' as const, label: 'Spacious' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setTheme({ ...theme, density: d.id })}
                  className={`p-2 rounded-xl border text-center transition font-semibold cursor-pointer ${
                    theme.density === d.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background Style */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Canvas Atmosphere</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'plain' as const, label: 'Plain White' },
                { id: 'subtle' as const, label: 'Subtle Slate' },
                { id: 'tinted' as const, label: 'Tinted Brand' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setTheme({ ...theme, backgroundStyle: b.id })}
                  className={`p-2 rounded-xl border text-center transition font-semibold cursor-pointer ${
                    theme.backgroundStyle === b.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center space-x-1.5 shadow-xs transition"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Save & Apply Style</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
