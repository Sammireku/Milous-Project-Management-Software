import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Unauthorized: React.FC = () => {
  const { user, allUsers, switchDemoUser } = useAuth();
  const location = useLocation();
  const requiredRoles = (location.state as { required?: string[] })?.required;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-6 shadow-xl space-y-4 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900">Access Denied</h2>
          <p className="text-xs text-slate-500">
            You do not have the required RBAC role permissions to access this route.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-left space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Your Current Role:</span>
            <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {user?.role || 'None'}
            </span>
          </div>
          {requiredRoles && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Required Roles:</span>
              <span className="font-mono font-bold text-slate-800">
                {requiredRoles.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Quick persona switch to evaluate role */}
        <div className="pt-2 border-t border-slate-100 text-left">
          <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center space-x-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Switch persona to test authorized access:</span>
          </label>
          <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
            {allUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => switchDemoUser(u.id)}
                className="text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between border border-slate-200 hover:bg-slate-50 transition"
              >
                <span className="truncate">{u.displayName}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 border">
                  {u.role}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-center space-x-3">
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Unauthorized;
