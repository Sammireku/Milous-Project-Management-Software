import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  Briefcase, 
  KeyRound, 
  Check, 
  Copy, 
  Trash2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Sparkles,
  ShieldAlert,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppUser } from '../../types/schema';

interface AdminTeamCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminTeamCredentialsModal: React.FC<AdminTeamCredentialsModalProps> = ({ isOpen, onClose }) => {
  const { isAdmin, userRole, teamRoster, createTeamMemberCredentials, deleteTeamMember } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('field_officer');
  const [organization, setOrganization] = useState('Milous NGO Alliance');
  const [department, setDepartment] = useState('Field Operations Unit');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedSlip, setCopiedSlip] = useState(false);

  // Newly provisioned credential slip
  const [provisionedSlip, setProvisionedSlip] = useState<{
    displayName: string;
    email: string;
    tempPass: string;
    role: string;
  } | null>(null);

  if (!isOpen) return null;

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 12; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAdmin && userRole !== 'ADMIN') {
      setErrorMessage('Security Alert: Only administrators can create login credentials for the team.');
      return;
    }

    if (!email.trim() || !password.trim() || !displayName.trim()) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createTeamMemberCredentials({
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        pass: password,
        role,
        organization,
        department,
      });

      setProvisionedSlip({
        displayName: res.user.displayName,
        email: res.user.email,
        tempPass: res.tempPass,
        role: res.user.role.toUpperCase(),
      });

      // Clear form
      setDisplayName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to provision team credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copySlipToClipboard = () => {
    if (!provisionedSlip) return;
    const text = `=== MILOUS NGO AUTHORIZED CREDENTIALS ===\nName: ${provisionedSlip.displayName}\nEmail: ${provisionedSlip.email}\nTemp Password: ${provisionedSlip.tempPass}\nRole: ${provisionedSlip.role}\nLogin URL: ${window.location.origin}/login\nNotice: Please change password upon first mission login.`;
    navigator.clipboard.writeText(text);
    setCopiedSlip(true);
    setTimeout(() => setCopiedSlip(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black tracking-tight">Team Credential Provisioner</h2>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Only System Administrators have authorization to issue mission credentials.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* Authorization Check Guard */}
          {!isAdmin && userRole !== 'ADMIN' ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-rose-900">Access Restricted to Administrators</h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto">
                Only authenticated System Administrators can provision login credentials for the team. 
                Please sign in with an Administrator profile to manage staff access.
              </p>
            </div>
          ) : (
            <>
              {/* Provisioned Slip Notification */}
              {provisionedSlip && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-500/50 rounded-2xl space-y-3 animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <span className="font-black text-emerald-950 text-sm">
                        Credentials Provisioned Successfully!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={copySlipToClipboard}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1.5 shadow-xs transition"
                    >
                      {copiedSlip ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSlip ? 'Copied Details' : 'Copy Credential Slip'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-emerald-200 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Officer</span>
                      <strong className="text-slate-900 truncate block">{provisionedSlip.displayName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Email Login</span>
                      <strong className="text-slate-900 truncate block">{provisionedSlip.email}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Assigned Role</span>
                      <strong className="text-purple-700 block">{provisionedSlip.role}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Temporary Password</span>
                      <strong className="text-emerald-700 block bg-emerald-100/60 px-1 rounded">{provisionedSlip.tempPass}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Create Team Member Form */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    <span className="font-black text-slate-900 text-sm">
                      Create New Staff Login Credentials
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Strict RBAC Governance
                  </span>
                </div>

                <form onSubmit={handleProvision} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Officer Full Name *</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Samuel Mensah"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/30 font-medium"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Official Mission Email *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="s.mensah@milous-ngo.org"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/30 font-medium"
                        />
                      </div>
                    </div>

                    {/* Temporary Password & Generator */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700 block">Temporary Password *</label>
                        <button
                          type="button"
                          onClick={generateRandomPassword}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Generate Strong</span>
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="e.g. MissionSecure2026!"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/30 font-mono font-medium"
                        />
                      </div>
                    </div>

                    {/* Assigned Role */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Assigned RBAC Role *</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/30 font-bold bg-white"
                      >
                        <option value="field_officer">Field Officer (Tasks, Voice Updates, Field Logs)</option>
                        <option value="project_manager">Project Manager (Portfolio, Budgets, Sign-offs)</option>
                        <option value="finance_officer">Finance Officer (Grants, Split Expenses, Audits)</option>
                        <option value="me_officer">M&amp;E Officer (LogFrames, Quantitative Metrics)</option>
                        <option value="donor_auditor">Donor Auditor (Compliance, Pre-Audits, Oversight)</option>
                        <option value="admin">System Administrator (Full Governance)</option>
                      </select>
                    </div>

                    {/* Organization */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Organization</label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="Organization name"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/30 font-medium"
                        />
                      </div>
                    </div>

                    {/* Department */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Department / Mission Unit</label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="Unit name"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/30 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center space-x-2 transition shadow-md disabled:opacity-50"
                    >
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      <span>{isSubmitting ? 'Provisioning...' : 'Provision Login Credentials'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Team Roster List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span className="font-black text-slate-900 text-sm">
                      Active Team Roster ({teamRoster.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Administrator Access Control
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3 pl-4">Staff Member</th>
                        <th className="p-3">Assigned Role</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teamRoster.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3 pl-4 font-bold text-slate-900">
                            <div>{member.displayName}</div>
                            <div className="text-[11px] text-slate-400 font-mono font-normal">{member.email}</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                              {member.role}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 text-[11px]">
                            {member.department || 'Field Unit'}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          </td>
                          <td className="p-3 text-right pr-4">
                            {member.id !== 'usr-admin-01' && (
                              <button
                                type="button"
                                onClick={() => deleteTeamMember(member.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Revoke access"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[10px]">
            Security Audit Standard ISO-27001 • NGO Governance
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-800 transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
