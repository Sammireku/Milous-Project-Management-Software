import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingSyncCount, triggerManualSync } = useFirestore();
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDoneBanner, setSyncDoneBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const effectivelyOffline = !isOnline || !browserOnline;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await triggerManualSync();
      setSyncDoneBanner(true);
      setTimeout(() => setSyncDoneBanner(false), 3500);
    } catch (err) {
      console.error('Manual sync failed', err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!effectivelyOffline && !syncDoneBanner && pendingSyncCount === 0) {
    return null;
  }

  if (syncDoneBanner) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center space-x-2 rounded-2xl bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold shadow-xl border border-emerald-600 animate-in fade-in slide-in-from-bottom-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
        <span>Sync Complete: Field reports and offline changes saved to database!</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center space-x-3 rounded-2xl bg-slate-900/95 text-white px-4 py-2.5 text-xs font-semibold shadow-2xl border border-amber-500/40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3">
      <div className="flex items-center space-x-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
        <WifiOff className="w-4 h-4 text-amber-400" />
        <span className="text-slate-200">
          Remote Field Mode (Offline)
        </span>
      </div>

      {pendingSyncCount > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
          {pendingSyncCount} changes queued
        </span>
      )}

      {browserOnline && (
        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      )}
    </div>
  );
};
