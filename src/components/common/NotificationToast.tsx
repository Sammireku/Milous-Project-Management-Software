import React from 'react';
import { useFirestore } from '../../context/FirestoreContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notifications, dismissNotification } = useFirestore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => {
        const isSuccess = notif.type === 'success';
        const isWarning = notif.type === 'warning';
        return (
          <div
            key={notif.id}
            className={`pointer-events-auto flex items-start p-3 rounded-xl shadow-xl border text-xs transition-all transform animate-in slide-in-from-bottom-2 ${
              isSuccess
                ? 'bg-slate-900 text-white border-emerald-500/50'
                : isWarning
                ? 'bg-amber-900/90 text-white border-amber-500/50'
                : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            <div className="mr-2 mt-0.5 flex-shrink-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {!isSuccess && !isWarning && <Info className="w-4 h-4 text-blue-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{notif.title}</p>
              <p className="text-[11px] opacity-90 leading-relaxed mt-0.5">{notif.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissNotification(notif.id)}
              className="ml-2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
