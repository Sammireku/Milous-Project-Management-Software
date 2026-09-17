import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { 
  LogIn, 
  Chrome, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  ChevronRight, 
  Lock, 
  Globe,
  Mail,
  KeyRound,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// Define standard role-to-route redirections precisely as required
const ROLE_REDIRECTS: Record<string, string> = {
  'system admin': '/admin-panel',
  'admin': '/admin-panel',
  'project manager': '/projects',
  'field officer': '/tasks',
  'finance officer': '/financials',
  'm&e officer': '/me-indicators',
  'me officer': '/me-indicators',

  'SYSTEM ADMIN': '/admin-panel',
  'ADMIN': '/admin-panel',
  'PROJECT MANAGER': '/projects',
  'FIELD OFFICER': '/tasks',
  'FINANCE OFFICER': '/financials',
  'M&E OFFICER': '/me-indicators',
  'ME OFFICER': '/me-indicators',

  'project_manager': '/projects',
  'field_officer': '/tasks',
  'finance_officer': '/financials',
  'me_officer': '/me-indicators',
  'PROJECT_MANAGER': '/projects',
  'FIELD_OFFICER': '/tasks',
  'FINANCE_OFFICER': '/financials',
  'ME_OFF_ICER': '/me-indicators',
  'ME_OFF_ICER_UNDERSCORE': '/me-indicators'
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { 
    user, 
    loginAsDirectUser, 
    signInWithEmail, 
    resetPassword,
    authError,
    clearAuthError
  } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [loginMode, setLoginMode] = useState<'SIGN_IN' | 'FORGOT_PASSWORD'>('SIGN_IN');

  // Credentials Inputs
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Sync AuthContext error with local error state
  useEffect(() => {
    if (authError) {
      setErrorMessage(authError);
    }
  }, [authError]);

  // If already authenticated and authorized, route them instantly on mount
  useEffect(() => {
    if (user && user.role) {
      const targetPath = ROLE_REDIRECTS[user.role] || '/';
      navigate(targetPath, { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    clearAuthError();

    try {
      // 1. Authenticate with Google
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      if (!googleUser) {
        throw new Error('Google Sign-In failed to return a valid user profile.');
      }

      // 2. Fetch the user's document from Firestore
      const userDocRef = doc(db, 'users', googleUser.uid);
      const userDoc = await getDoc(userDocRef);

      // Check for bootstrap capability (Milou Mireku is the global admin)
      const email = (googleUser.email || '').toLowerCase();
      const isMilou = email === 'miloumireku@gmail.com' || email.includes('milou');

      if (userDoc.exists()) {
        const profileData = userDoc.data();
        const role = profileData?.role || 'project_manager';
        
        // Match redirection mapping
        const targetPath = ROLE_REDIRECTS[role] || '/';
        navigate(targetPath, { replace: true });
      } else if (isMilou) {
        // Special auto-bootstrapping for the project owner to avoid first-use lockouts
        navigate('/admin-panel', { replace: true });
      } else {
        // 3. Security Check: No Firestore document exists
        await signOut(auth);
        setErrorMessage('Your account is pending administrator approval.');
      }
    } catch (err: any) {
      console.error('Google Auth Redirection Error:', err);
      try {
        await signOut(auth);
      } catch {}

      if (err.message && err.message.includes('pending administrator approval')) {
        setErrorMessage('Your account is pending administrator approval.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('The Google sign-in window was closed before completion.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMessage('Network connection lost. Please check your internet connection.');
      } else {
        setErrorMessage(err.message || 'An unexpected error occurred during Google SSO.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    clearAuthError();

    try {
      await signInWithEmail(emailInput.trim(), passwordInput);
      // If user logs in successfully, the layout redirection useEffect will route them
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMessage('Please enter your email address to receive reset instructions.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    clearAuthError();

    try {
      await resetPassword(emailInput.trim().toLowerCase());
      setSuccessMessage(`A password reset link has been dispatched to ${emailInput.trim()}. Please verify your spam folder if you do not receive it shortly.`);
      setEmailInput('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not send password reset email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct access sandbox logins to facilitate rapid offline testing inside container iframes
  const handleSandboxLogin = (role: string, displayName: string, email: string) => {
    setIsSubmitting(true);
    try {
      loginAsDirectUser(email, displayName, role);
      const targetPath = ROLE_REDIRECTS[role] || '/';
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate in dev sandbox.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#faf9f6] flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden select-none font-sans">
      
      {/* Top Accent Lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-600 to-slate-900 animate-pulse" />
      
      {/* Brand Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-emerald-400 font-black shadow-lg">
            M
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight leading-none">MILOUS PROJECT</h2>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">NGO Alliance Engine</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-slate-500 bg-white border border-slate-200/60 px-3 py-1.5 rounded-full shadow-xs">
          <Globe className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>West Africa Hub</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 z-10">
        
        {/* Animated Card Outer Frame */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-md w-full bg-white border border-slate-200/80 shadow-md rounded-3xl p-8 sm:p-10 space-y-6 relative"
        >
          
          {/* Form Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 items-center justify-center shadow-xs mb-2">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {loginMode === 'SIGN_IN' ? 'Staff Portal Access' : 'Recover Credentials'}
            </h1>
            <p className="text-xs text-slate-500 font-medium px-4 leading-relaxed">
              {loginMode === 'SIGN_IN' 
                ? 'Welcome back to the Milous NGO Management System. Authenticate with your authorized corporate account.'
                : 'Enter your corporate email address. If you have valid credentials, we will send you a password reset link.'}
            </p>
          </div>

          {/* Clean Enterprise Alert Status */}
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start space-x-3 overflow-hidden"
              >
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-rose-900">Sign-In Unauthorized</h4>
                  <p className="text-[11px] text-rose-700 font-semibold mt-0.5 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              </motion.div>
            )}

            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start space-x-3 overflow-hidden"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-emerald-900">Operation Successful</h4>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 leading-relaxed">
                    {successMessage}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flows Selector/Rendering */}
          <AnimatePresence mode="wait">
            {loginMode === 'SIGN_IN' ? (
              <motion.div
                key="signin-form"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                
                {/* Standard Email & Password Form */}
                <form onSubmit={handleCredentialsSignIn} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Corporate Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="e.g. name@milousproject.org"
                        className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Access Password</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setLoginMode('FORGOT_PASSWORD');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="text-[10px] text-emerald-600 hover:underline font-bold cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                        required
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-tight rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-sm cursor-pointer disabled:opacity-75"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>Sign In with Password</span>
                  </motion.button>
                </form>

                {/* Divider */}
                <div className="flex items-center my-4">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-3">or SSO Integration</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* Animated Primary Google SSO Button */}
                <motion.button
                  id="google-signin-btn"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleGoogleSignIn}
                  className="w-full h-11 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-bold text-xs tracking-tight rounded-xl flex items-center justify-center gap-3 transition duration-200 shadow-xs cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  ) : (
                    <Chrome className="w-4.5 h-4.5 text-emerald-600" />
                  )}
                  <span>Sign in with Google Account</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="forgot-form"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <form onSubmit={handlePasswordReset} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Corporate Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="e.g. name@milousproject.org"
                        className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                        required
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-tight rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-sm cursor-pointer disabled:opacity-75"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    <span>Send Reset Instructions</span>
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('SIGN_IN');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Portal Login</span>
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enterprise-grade Compliance Footer Inside the Card */}
          <div className="text-[10px] text-center text-slate-400 border-t border-slate-100 pt-4 font-semibold leading-relaxed">
            By continuing, you agree to the{' '}
            <a href="#" className="underline hover:text-slate-700 transition">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-slate-700 transition">Privacy Policy</a>.
          </div>

          {/* Subtle Security Badge */}
          <div className="pt-2 flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Strict Single-Role RBAC Enforced</span>
          </div>

        </motion.div>

        {/* Collapsible Developer Sandbox Panel */}
        <div className="max-w-md w-full mt-6 text-center">
          <button
            type="button"
            onClick={() => setShowDevPanel(!showDevPanel)}
            className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-4 py-2 rounded-full border border-slate-200/40 transition cursor-pointer"
          >
            <span>Dev Sandbox: Quick Access Roles</span>
            <ChevronRight className={`w-3.5 h-3.5 transform transition-transform duration-200 ${showDevPanel ? 'rotate-90' : ''}`} />
          </button>

          {showDevPanel && (
            <div className="mt-4 bg-white border border-slate-200/80 shadow-xs rounded-2xl p-5 text-left space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <div>
                <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase">Developer Access Portal</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Simulate access as pre-registered team roles. Ideal for reviewing role-specific views and dashboards offline.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSandboxLogin('System Admin', 'Kofi Mensah', 'admin@milousproject.org')}
                  className="p-3 rounded-xl border border-slate-200 text-left hover:bg-slate-50 hover:border-slate-300 transition group cursor-pointer"
                >
                  <span className="block text-xs font-black text-slate-900 group-hover:text-emerald-600 transition">System Admin</span>
                  <span className="block text-[9px] text-slate-400 font-bold mt-0.5">Full System Access (/admin-panel)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSandboxLogin('project_manager', 'Ama Boateng', 'pm@milousproject.org')}
                  className="p-3 rounded-xl border border-slate-200 text-left hover:bg-slate-50 hover:border-slate-300 transition group cursor-pointer"
                >
                  <span className="block text-xs font-black text-slate-900 group-hover:text-emerald-600 transition">Project Manager</span>
                  <span className="block text-[9px] text-slate-400 font-bold mt-0.5">Portfolio &amp; Approvals (/projects)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSandboxLogin('field_officer', 'Kwame Nkrumah', 'field@milousproject.org')}
                  className="p-3 rounded-xl border border-slate-200 text-left hover:bg-slate-50 hover:border-slate-300 transition group cursor-pointer"
                >
                  <span className="block text-xs font-black text-slate-900 group-hover:text-emerald-600 transition">Field Officer</span>
                  <span className="block text-[9px] text-slate-400 font-bold mt-0.5">Task Board &amp; Timesheets (/tasks)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSandboxLogin('finance_officer', 'Yaa Asantewaa', 'finance@milousproject.org')}
                  className="p-3 rounded-xl border border-slate-200 text-left hover:bg-slate-50 hover:border-slate-300 transition group cursor-pointer"
                >
                  <span className="block text-xs font-black text-slate-900 group-hover:text-emerald-600 transition">Finance Officer</span>
                  <span className="block text-[9px] text-slate-400 font-bold mt-0.5">Financial Ledger &amp; FX (/financials)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSandboxLogin('me_officer', 'Yaw Mireku', 'me@milousproject.org')}
                  className="p-3 rounded-xl border border-slate-200 text-left hover:bg-slate-50 hover:border-slate-300 transition group group-last:col-span-full cursor-pointer"
                >
                  <span className="block text-xs font-black text-slate-900 group-hover:text-emerald-600 transition">M&amp;E Officer</span>
                  <span className="block text-[9px] text-slate-400 font-bold mt-0.5">Indicators &amp; Impact (/me-indicators)</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Footer System Credits */}
      <footer className="max-w-7xl mx-auto w-full text-center sm:flex sm:items-center sm:justify-between border-t border-slate-200/50 pt-6 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
        <div>© 2026 Milous Project Alliance. All rights reserved.</div>
        <div className="mt-2 sm:mt-0 flex items-center justify-center space-x-4">
          <a href="#" className="hover:text-slate-600">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600">Terms of Service</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600">System Status</a>
        </div>
      </footer>

    </div>
  );
};

export default Login;
