import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  Briefcase, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Zap,
  RefreshCw,
  KeyRound,
  XCircle,
  Check,
  Shield,
  Copy,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    resetPassword, 
    loginWithGoogleSSO, 
    authError, 
    clearAuthError,
    unauthorizedDomain,
    clearUnauthorizedDomain,
    loginAsDirectUser,
    loading 
  } = useAuth();

  const [copiedDomain, setCopiedDomain] = useState(false);

  // Mode: 'SIGN_IN' | 'SIGN_UP' | 'FORGOT_PASSWORD'
  const [mode, setMode] = useState<'SIGN_IN' | 'SIGN_UP' | 'FORGOT_PASSWORD'>('SIGN_IN');

  // Form Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('project_manager');
  const [organization, setOrganization] = useState('Global Health & WASH Network');
  const [department, setDepartment] = useState('Operations');

  // UI Toggles & States
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email Format Real-time Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = useMemo(() => {
    if (!email) return null; // untouched
    return emailRegex.test(email.trim());
  }, [email]);

  // Password Strength Real-time Evaluation
  const passwordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  }, [password]);

  const passwordScore = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (passwordCriteria.minLength) score++;
    if (passwordCriteria.hasUpperLower) score++;
    if (passwordCriteria.hasNumber) score++;
    if (passwordCriteria.hasSpecial) score++;
    return score;
  }, [password, passwordCriteria]);

  const passwordStrengthLabel = useMemo(() => {
    if (!password) return null;
    if (passwordScore <= 1) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400', width: '25%' };
    if (passwordScore === 2) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400', width: '50%' };
    if (passwordScore === 3) return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-400', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400', width: '100%' };
  }, [password, passwordScore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setSuccessMessage(null);

    // Validate email format before submit
    if (!isEmailValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'SIGN_IN') {
        await signInWithEmail(email, password);
      } else if (mode === 'SIGN_UP') {
        if (passwordScore < 2) {
          throw new Error('Please choose a stronger password matching the criteria.');
        }
        await signUpWithEmail(email, password, displayName || 'Project Lead', role, organization, department);
        setSuccessMessage('Account created successfully! Welcome to Mission Workspace.');
      } else if (mode === 'FORGOT_PASSWORD') {
        await resetPassword(email);
        setSuccessMessage(`Password recovery instructions have been dispatched to ${email}. Please check your inbox.`);
      }
    } catch (err: any) {
      // Handled inside AuthContext authError or thrown above
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Demo Access Handler
  const handleQuickDemoAccess = async (demoRole: string, demoName: string, demoEmail?: string) => {
    setIsSubmitting(true);
    clearAuthError();
    try {
      const emailToUse = demoEmail || `${demoRole.toLowerCase()}@milousproject.org`;
      loginAsDirectUser(emailToUse, demoName, demoRole);
      setSuccessMessage(`Authenticated as ${demoName} (${demoRole.toUpperCase()})`);
    } catch (err) {
      console.warn('Demo login note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* Background Decorative Gradient Spheres */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black mx-auto shadow-lg shadow-emerald-500/20 text-base tracking-wider">
            MP
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Milous Project Portal
          </h1>
          <p className="text-xs text-slate-400">
            Enterprise Work Management &amp; NGO Resource Coordination
          </p>
        </div>

        {/* Auth Mode Tabs & Policy Badge */}
        {mode !== 'FORGOT_PASSWORD' && (
          <div className="p-1 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs font-bold flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setMode('SIGN_IN');
                clearAuthError();
                setSuccessMessage(null);
              }}
              className="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 shadow-md font-extrabold text-center transition"
            >
              Sign In to Milous Project
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'SIGN_UP' ? 'SIGN_IN' : 'SIGN_UP');
                clearAuthError();
                setSuccessMessage(null);
              }}
              className={`px-3 py-2 rounded-xl text-center transition flex items-center space-x-1 ${
                mode === 'SIGN_UP' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px]">Admin Provisioning</span>
            </button>
          </div>
        )}

        {/* Admin Credential Provisioning Policy Notice */}
        {mode === 'SIGN_UP' && (
          <div className="p-4 bg-purple-950/60 border border-purple-800/80 rounded-2xl text-purple-200 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-purple-300 font-black">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Restricted Credential Policy</span>
            </div>
            <p className="text-[11px] text-purple-200/90 leading-relaxed">
              In accordance with NGO data protection standards, self-registration is restricted. 
              <strong> Only designated Administrators can create login credentials for the team.</strong>
            </p>
            <p className="text-[10px] text-purple-300/80">
              Sign in as an Administrator below, or click the System Admin demo profile to access the live Credential Provisioner.
            </p>
          </div>
        )}

        {/* Error / Success Alerts */}
        {unauthorizedDomain ? (
          <div className="p-4 bg-amber-950/80 border border-amber-800/80 rounded-2xl text-amber-200 text-xs space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-amber-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Firebase Authorized Domain Notice</span>
            </div>
            
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              Firebase Authentication Google Sign-In requires your current Cloud Run domain to be added to Authorized Domains in the Firebase Console:
            </p>

            <div className="flex items-center justify-between p-2 bg-slate-950/90 border border-amber-800/60 rounded-xl font-mono text-[10px] text-amber-300">
              <span className="truncate mr-2 font-bold">{unauthorizedDomain}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(unauthorizedDomain);
                  setCopiedDomain(true);
                  setTimeout(() => setCopiedDomain(false), 2000);
                }}
                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold shrink-0 transition flex items-center space-x-1"
              >
                {copiedDomain ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="text-[10px] text-amber-300/80 space-y-1">
              <p className="font-bold text-amber-200">Steps to authorize in Firebase Console:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
                <li>Open <strong>Firebase Console &gt; Authentication &gt; Settings</strong></li>
                <li>Go to <strong>Authorized domains</strong> tab and click <strong>Add domain</strong></li>
                <li>Paste the copied domain and save</li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => loginAsDirectUser('miloumireku@gmail.com', 'Milou Mireku', 'admin')}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-md flex items-center justify-center space-x-1.5"
            >
              <span>Continue into Mission Portal as Milou Mireku</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : authError ? (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-2xl text-rose-300 text-xs font-medium flex items-start space-x-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1">{authError}</span>
          </div>
        ) : null}

        {successMessage && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-800/80 rounded-2xl text-emerald-300 text-xs font-medium flex items-start space-x-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Sign Up Specific Fields */}
          {mode === 'SIGN_UP' && (
            <>
              <div className="space-y-1">
                <label className="block text-slate-300 font-bold">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Dr. Kwame Mensah"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">Assign Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-bold"
                  >
                    <option value="project_manager">Project Manager</option>
                    <option value="me_officer">M&amp;E Officer</option>
                    <option value="finance_officer">Finance Officer</option>
                    <option value="field_officer">Field Officer</option>
                    <option value="admin">Administrator</option>
                    <option value="donor_auditor">Donor Auditor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. WASH Ops"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-medium"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Input with Real-time Validation */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-bold">Work Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
                className={`w-full bg-slate-950 border text-white rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 font-medium transition ${
                  isEmailValid === true
                    ? 'border-emerald-500/60 focus:ring-emerald-500/40'
                    : isEmailValid === false
                    ? 'border-rose-500/80 focus:ring-rose-500/40'
                    : 'border-slate-800 focus:ring-emerald-500/40'
                }`}
              />
              {/* Real-time Email Format Badge */}
              <div className="absolute right-3 top-3">
                {isEmailValid === true && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-in fade-in" />
                )}
                {isEmailValid === false && (
                  <XCircle className="w-4 h-4 text-rose-400 animate-in fade-in" />
                )}
              </div>
            </div>

            {/* Inline Email Feedback Hint */}
            {isEmailValid === false && (
              <p className="text-[10px] text-rose-400 font-medium flex items-center space-x-1 animate-in fade-in">
                <span>Please enter a valid email address (e.g., name@organization.org)</span>
              </p>
            )}
            {isEmailValid === true && (
              <p className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1 animate-in fade-in">
                <span>Valid work email format</span>
              </p>
            )}
          </div>

          {/* Password Input with Real-time Strength Feedback (Hidden for Forgot Password mode) */}
          {mode !== 'FORGOT_PASSWORD' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-slate-300 font-bold">Password *</label>
                {mode === 'SIGN_IN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('FORGOT_PASSWORD');
                      clearAuthError();
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-emerald-400 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time Password Strength Meter */}
              {password.length > 0 && passwordStrengthLabel && (
                <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-400">Security Rating:</span>
                    <span className={`font-black uppercase ${passwordStrengthLabel.text}`}>
                      {passwordStrengthLabel.label}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrengthLabel.color}`}
                      style={{ width: passwordStrengthLabel.width }}
                    />
                  </div>

                  {/* Inline Criteria Checklist for Sign Up */}
                  {mode === 'SIGN_UP' && (
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1 font-mono">
                      <div className={`flex items-center space-x-1 ${passwordCriteria.minLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {passwordCriteria.minLength ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 text-center">•</span>}
                        <span>8+ Characters</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${passwordCriteria.hasUpperLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {passwordCriteria.hasUpperLower ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 text-center">•</span>}
                        <span>Upper &amp; Lower Case</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${passwordCriteria.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {passwordCriteria.hasNumber ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 text-center">•</span>}
                        <span>Number (0-9)</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${passwordCriteria.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {passwordCriteria.hasSpecial ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 text-center">•</span>}
                        <span>Special Symbol (!@#$)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting || loading || (isEmailValid === false)}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/10 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Authenticating...</span>
              </>
            ) : mode === 'SIGN_IN' ? (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === 'SIGN_UP' ? (
              <>
                <span>Complete Account Setup</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Send Password Reset Email</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Sign In from Forgot Password */}
        {mode === 'FORGOT_PASSWORD' && (
          <button
            type="button"
            onClick={() => {
              setMode('SIGN_IN');
              clearAuthError();
              setSuccessMessage(null);
            }}
            className="w-full text-center text-xs text-slate-400 hover:text-white font-bold"
          >
            ← Back to Sign In
          </button>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[10px] font-mono text-slate-500 uppercase font-bold absolute">
            Or Continue With
          </span>
        </div>

        {/* Google SSO Button */}
        <button
          type="button"
          onClick={loginWithGoogleSSO}
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-2.5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.8-.8-1.4-1.8-1.6-3z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 22.3 12 23z"
            />
          </svg>
          <span>Google Single Sign-On (SSO)</span>
        </button>

        {/* Quick Fast-Track Instant Access */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 block text-center uppercase tracking-wider">
            ⚡ Quick 1-Click Role Login
          </span>

          <button
            type="button"
            onClick={() => handleQuickDemoAccess('admin', 'Milou Mireku', 'miloumireku@gmail.com')}
            className="w-full p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-md flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Enter as Milou Mireku (Administrator)</span>
          </button>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickDemoAccess('ceo', 'Kwame Mensah (CEO)', 'ceo@milousproject.org')}
              className="p-2 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/70 border border-indigo-700/80 text-indigo-200 font-bold transition truncate text-left flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">Chief Executive (CEO)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoAccess('project_manager', 'Sarah Chen (PM)', 'pm@milousproject.org')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold transition truncate text-left"
            >
              Project Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoAccess('me_officer', 'Emmanuel Osei (M&E)', 'me@milousproject.org')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold transition truncate text-left"
            >
              M&amp;E Officer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoAccess('field_officer', 'Ibrahim Tanko', 'field@milousproject.org')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold transition truncate text-left"
            >
              Field Officer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
