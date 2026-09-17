import React, { useState } from 'react';
import { X, Globe, Copy, Check, Eye, Lock, ShieldCheck } from 'lucide-react';

interface DashboardPublicLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTabTitle: string;
}

export const DashboardPublicLinkModal: React.FC<DashboardPublicLinkModalProps> = ({
  isOpen,
  onClose,
  activeTabTitle,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkActive, setIsLinkActive] = useState(true);

  if (!isOpen) return null;

  const publicUrl = `https://milous-project.app/public/dashboards/${activeTabTitle.toLowerCase().replace(/\s+/g, '-')}-k92e8`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Public External Link</h3>
              <p className="text-[10px] text-slate-400">Share with external partners and community stakeholders</p>
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
          {/* Exact User Prompt Requirement */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl space-y-1.5">
            <div className="font-bold text-blue-950 flex items-center space-x-1.5">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>External Read-Only Access</span>
            </div>
            <p className="text-xs text-blue-900 leading-relaxed font-normal">
              Share this dashboard with people outside of Milous using a public link. Anyone with the link can see this dashboard, but they can't edit or open items to see more details.
            </p>
          </div>

          {/* Toggle Link Active */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="font-bold text-slate-800">Public Link Access</div>
              <div className="text-[10px] text-slate-500">
                {isLinkActive ? 'Anyone with this secure link can view this dashboard' : 'Public access is currently turned off'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsLinkActive(!isLinkActive)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                isLinkActive ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isLinkActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Public Link Input and Copy Button */}
          {isLinkActive && (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Public Link</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-3.5 py-2.5 rounded-xl font-bold flex items-center space-x-1.5 transition shadow-xs cursor-pointer ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Security & Isolation Highlights */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safeguards & Restrictions</span>
            </div>
            <ul className="space-y-1 text-slate-600 text-[11px]">
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>View-only mode is strictly enforced across all widgets.</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>External visitors cannot edit tasks, assignees, or statuses.</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Visitors cannot open items to view detailed descriptions or attachments.</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Financial ledgers, donor breakdowns, and user directories remain hidden.</span>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
