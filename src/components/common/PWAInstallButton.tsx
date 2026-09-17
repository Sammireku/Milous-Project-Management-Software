import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 3000);
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer"
          title="Install NGO Platform for Offline Field Access"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install Offline App</span>
          <span className="sm:hidden">Install</span>
        </button>

        {installSuccess && (
          <div className="fixed top-16 right-6 z-50 flex items-center space-x-2 bg-emerald-900 text-emerald-100 px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-700 animate-in fade-in slide-in-from-top-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>App installed! Offline field mode enabled.</span>
          </div>
        )}
      </>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
          title="Install on iOS Safari"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Install on iOS</span>
          <span className="sm:hidden">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Install NGO Platform</h3>
                    <p className="text-[10px] text-slate-500">Offline Field Access on iPhone / iPad</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <div className="flex items-start space-x-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">Tap Safari's Share icon</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      Tap the <Share2 className="w-3.5 h-3.5 text-blue-500 inline" /> icon at the bottom of your screen.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">Add to Home Screen</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-slate-700 inline" /> <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 leading-relaxed">
                  ✓ The app will be available on your home screen and remain responsive even during deep-rural connectivity drops.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
