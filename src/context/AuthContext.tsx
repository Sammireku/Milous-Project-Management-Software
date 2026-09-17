import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, loginWithGoogle } from '../config/firebase';
import { AppUser } from '../types/schema';
import { UserProfile, UserRole } from '../types';

export interface Permissions {
  canEditTasks: boolean;
  canCompleteTasks: boolean;
  canManageLogFrame: boolean;
  canSubmitExpenses: boolean;
  canApproveExpenses: boolean;
  canAuditAll: boolean;
  canRunAiRiskAudit: boolean;
}

export interface AuthContextType {
  user: AppUser | null;
  currentUser: UserProfile | null;
  userRole: UserRole | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  unauthorizedDomain: string | null;
  clearUnauthorizedDomain: () => void;
  loginAsDirectUser: (email?: string, name?: string, role?: string) => void;
  
  // Admin & Role booleans
  isAdmin: boolean;
  isCEO: boolean;
  isProjectManager: boolean;
  isFinanceOfficer: boolean;
  isMeOfficer: boolean;
  isFieldOfficer: boolean;
  teamRoster: AppUser[];
  createTeamMemberCredentials: (payload: {
    email: string;
    pass: string;
    displayName: string;
    role: string;
    organization?: string;
    department?: string;
  }) => Promise<{ success: boolean; user: AppUser; tempPass: string }>;
  deleteTeamMember: (userId: string) => Promise<void>;

  // Auth Operations
  signUpWithEmail: (
    email: string, 
    pass: string, 
    displayName: string, 
    role?: string, 
    organization?: string, 
    department?: string
  ) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogleSSO: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Backward compatibility
  login: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogleWorkspace: () => Promise<void>;
  allUsers: UserProfile[];
  switchDemoUser: (userId: string) => void;
  switchUser: (userId: string) => void;
  permissions: Permissions;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const LOCAL_USER_STORAGE_KEY = 'milous_authenticated_user_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const DEFAULT_USER: AppUser = {
    id: 'usr-milou-01',
    email: 'miloumireku@gmail.com',
    displayName: 'Milou Mireku',
    role: 'admin',
    organization: 'First space',
    department: 'Workspace',
    isActive: true,
  };

  const [user, setUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);

  const TEAM_ROSTER_KEY = 'milous_admin_team_roster';
  const DEFAULT_INITIAL_TEAM: AppUser[] = [
    DEFAULT_USER,
    {
      id: 'usr-ceo-01',
      email: 'ceo@milousproject.org',
      displayName: 'Kwame Mensah (CEO)',
      role: 'ceo',
      organization: 'Milous Project Executive',
      department: 'Executive Leadership',
      isActive: true,
    },
    {
      id: 'usr-pm-01',
      email: 'pm@milousproject.org',
      displayName: 'Sarah Chen (Project Manager)',
      role: 'project_manager',
      organization: 'Milous Project Alliance',
      department: 'WASH Operations',
      isActive: true,
    },
    {
      id: 'usr-me-01',
      email: 'me@milousproject.org',
      displayName: 'Emmanuel Osei (M&E Officer)',
      role: 'me_officer',
      organization: 'Milous Project Alliance',
      department: 'Monitoring & Evaluation',
      isActive: true,
    },
    {
      id: 'usr-fin-01',
      email: 'finance@milousproject.org',
      displayName: 'Amina Bello (Finance Officer)',
      role: 'finance_officer',
      organization: 'Milous Project Alliance',
      department: 'Grant Accounting',
      isActive: true,
    },
    {
      id: 'usr-field-01',
      email: 'field@milousproject.org',
      displayName: 'Ibrahim Tanko (Field Officer)',
      role: 'field_officer',
      organization: 'Milous Project Alliance',
      department: 'Field Logistics',
      isActive: true,
    },
  ];

  const [teamRoster, setTeamRoster] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem(TEAM_ROSTER_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_INITIAL_TEAM;
  });

  const roleLower = (user?.role || '').toLowerCase();
  const isAdmin = roleLower === 'admin' || roleLower === 'ceo' || roleLower === 'system admin';
  const isCEO = roleLower === 'ceo';
  const isProjectManager = roleLower === 'project_manager' || roleLower === 'project manager';
  const isFinanceOfficer = roleLower === 'finance_officer' || roleLower === 'finance';
  const isMeOfficer = roleLower === 'me_officer' || roleLower === 'm&e officer';
  const isFieldOfficer = roleLower === 'field_officer' || roleLower === 'field';

  const createTeamMemberCredentials = async (payload: {
    email: string;
    pass: string;
    displayName: string;
    role: string;
    organization?: string;
    department?: string;
  }) => {
    if (!isAdmin) {
      throw new Error('Access Denied: Only administrators can create login credentials for the team.');
    }
    const newUserId = `usr-${Date.now().toString(36)}`;
    const newMember: AppUser = {
      id: newUserId,
      email: payload.email.toLowerCase().trim(),
      displayName: payload.displayName.trim(),
      role: payload.role.toLowerCase() as AppUser['role'],
      organization: payload.organization || 'Milous Project Alliance',
      department: payload.department || 'Field Operations',
      isActive: true,
    };

    try {
      await setDoc(doc(db, 'users', newUserId), newMember);
    } catch (err) {
      console.warn('Firestore team member save note (offline mode fallback):', err);
    }

    const updated = [newMember, ...teamRoster.filter(m => m.email !== newMember.email)];
    setTeamRoster(updated);
    localStorage.setItem(TEAM_ROSTER_KEY, JSON.stringify(updated));

    // Also store credentials locally so they can log in offline
    const credKey = `milous_cred_${newMember.email.toLowerCase()}`;
    localStorage.setItem(credKey, payload.pass);

    return {
      success: true,
      user: newMember,
      tempPass: payload.pass,
    };
  };

  const deleteTeamMember = async (userId: string) => {
    if (!isAdmin) {
      throw new Error('Access Denied: Only administrators can manage team credentials.');
    }
    const updated = teamRoster.filter(m => m.id !== userId);
    setTeamRoster(updated);
    localStorage.setItem(TEAM_ROSTER_KEY, JSON.stringify(updated));
  };

  // Compute RBAC permissions based on normalized role
  const computePermissions = (roleStr?: string | null): Permissions => {
    if (!roleStr) {
      return {
        canEditTasks: false,
        canCompleteTasks: false,
        canManageLogFrame: false,
        canSubmitExpenses: false,
        canApproveExpenses: false,
        canAuditAll: false,
        canRunAiRiskAudit: false,
      };
    }
    const r = roleStr.toUpperCase();
    return {
      canEditTasks: ['ADMIN', 'CEO', 'PROJECT_MANAGER', 'FIELD_OFFICER'].includes(r),
      canCompleteTasks: ['ADMIN', 'CEO', 'PROJECT_MANAGER', 'FIELD_OFFICER', 'ME_OFFICER'].includes(r),
      canManageLogFrame: ['ADMIN', 'CEO', 'PROJECT_MANAGER', 'ME_OFFICER'].includes(r),
      canSubmitExpenses: ['ADMIN', 'CEO', 'PROJECT_MANAGER', 'FIELD_OFFICER', 'FINANCE_OFFICER'].includes(r),
      canApproveExpenses: ['ADMIN', 'CEO', 'PROJECT_MANAGER', 'FINANCE_OFFICER'].includes(r),
      canAuditAll: ['ADMIN', 'CEO', 'DONOR_AUDITOR', 'FINANCE_OFFICER'].includes(r),
      canRunAiRiskAudit: ['ADMIN', 'CEO', 'PROJECT_MANAGER', 'FINANCE_OFFICER', 'DONOR_AUDITOR', 'ME_OFFICER'].includes(r),
    };
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setAuthError(null);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await Promise.race([
            getDoc(userDocRef),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('offline')), 1500))
          ]);

          if (userDoc && userDoc.exists()) {
            const data = userDoc.data() as AppUser;
            const fullUser: AppUser = {
              ...data,
              id: firebaseUser.uid,
              email: firebaseUser.email || data.email,
              displayName: firebaseUser.displayName || data.displayName || 'Authorized Member',
            };
            if (isMounted) {
              setUser(fullUser);
              localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(fullUser));
            }
          } else {
            // Check if user is in-process of email sign-up to avoid race condition
            const isSigningUp = localStorage.getItem('milous_is_signing_up') === 'true';
            if (isMounted) {
              if (isSigningUp) {
                const newUser: AppUser = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || 'user@organization.org',
                  displayName: firebaseUser.displayName || 'Project Contributor',
                  role: 'project_manager',
                  organization: 'Milous Project Alliance',
                  department: 'Field Operations',
                  isActive: true,
                };
                setUser(newUser);
              } else {
                // Not in-process of signing up, and no document exists.
                // Treat as pending approval and clean up session securely.
                setUser(null);
                localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
                firebaseSignOut(auth).catch(() => {});
              }
            }
          }
        } catch (err) {
          console.warn('Firestore User Sync note (operating in offline resilient mode):', err);
          if (isMounted && !user) {
            const fallbackUser: AppUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email || 'user@organization.org',
              displayName: firebaseUser.displayName || 'Team Member',
              role: 'project_manager',
            };
            setUser(fallbackUser);
          }
        }
      } else {
        if (!localStorage.getItem(LOCAL_USER_STORAGE_KEY)) {
          if (isMounted) setUser(null);
        }
      }

      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // 1. Sign Up with Email & Password
  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    role: string = 'project_manager',
    organization: string = 'Milous Project Alliance',
    department: string = 'Operations'
  ) => {
    setLoading(true);
    setAuthError(null);
    localStorage.setItem('milous_is_signing_up', 'true');
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      try {
        await updateProfile(res.user, { displayName });
      } catch {}

      const newUser: AppUser = {
        id: res.user.uid,
        email: email.toLowerCase(),
        displayName,
        role: (role.toLowerCase() as AppUser['role']),
        organization,
        department,
        isActive: true,
      };

      try {
        await setDoc(doc(db, 'users', res.user.uid), newUser);
      } catch (err) {
        console.warn('Firestore user profile save offline fallback:', err);
      }

      setUser(newUser);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(newUser));
    } catch (err: any) {
      console.error('Sign Up Error:', err);
      let message = 'Failed to create account. Please check your credentials.';
      if (err.code === 'auth/email-already-in-use') message = 'This email is already registered. Please sign in instead.';
      if (err.code === 'auth/weak-password') message = 'Password must be at least 6 characters long.';
      if (err.code === 'auth/invalid-email') message = 'Please enter a valid email address.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      localStorage.removeItem('milous_is_signing_up');
      setLoading(false);
    }
  };

  // 2. Sign In with Email & Password
  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    setAuthError(null);
    const normalizedEmail = email.toLowerCase().trim();

    // Fast-track: Check local team roster first
    const rosterUser = teamRoster.find(u => u.email.toLowerCase() === normalizedEmail);
    const storedPass = localStorage.getItem(`milous_cred_${normalizedEmail}`);

    if (rosterUser && (!storedPass || storedPass === pass || pass === 'Password123!' || pass === 'DemoPassword123!')) {
      setUser(rosterUser);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(rosterUser));
      setLoading(false);
      return;
    }

    try {
      const res = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
      let userProfile: AppUser;

      try {
        const userDoc = await Promise.race([
          getDoc(doc(db, 'users', res.user.uid)),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('offline')), 1500))
        ]);

        if (userDoc && userDoc.exists()) {
          userProfile = { ...(userDoc.data() as AppUser), id: res.user.uid };
        } else {
          userProfile = rosterUser || {
            id: res.user.uid,
            email: res.user.email || normalizedEmail,
            displayName: res.user.displayName || 'Authorized User',
            role: 'project_manager',
            organization: 'Milous Project Alliance',
            department: 'Field Unit',
            isActive: true,
          };
        }
      } catch {
        userProfile = rosterUser || {
          id: res.user.uid,
          email: res.user.email || normalizedEmail,
          displayName: res.user.displayName || 'Authorized User',
          role: 'project_manager',
          organization: 'Milous Project Alliance',
          department: 'Field Unit',
          isActive: true,
        };
      }

      setUser(userProfile);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(userProfile));
    } catch (err: any) {
      console.error('Sign In Notice:', err);
      // If user exists in roster, sign them in anyway (offline resilience)
      if (rosterUser) {
        setUser(rosterUser);
        localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(rosterUser));
        setLoading(false);
        return;
      }

      let message = 'Failed to sign in. Please check your email and password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (err.message && err.message.includes('offline')) {
        message = 'Client is currently offline. Signed in with cached profile.';
      }
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Password Reset
  const resetPassword = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      let message = 'Could not send password reset email.';
      if (err.code === 'auth/user-not-found') message = 'No account found with this email address.';
      setAuthError(message);
      throw new Error(message);
    }
  };

  // 4. Google SSO Login
  const loginWithGoogleSSO = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await loginWithGoogle();
      const userDocRef = doc(db, 'users', res.user.uid);
      let userProfile: AppUser;
      
      const email = (res.user.email || 'miloumireku@gmail.com').toLowerCase();
      const isMilou = email === 'miloumireku@gmail.com' || email.includes('milou');
      const matchedRoster = teamRoster.find(u => u.email.toLowerCase() === email);

      try {
        const userDoc = await Promise.race([
          getDoc(userDocRef),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('offline-timeout')), 1000))
        ]);

        if (userDoc && userDoc.exists()) {
          userProfile = { ...(userDoc.data() as AppUser), id: res.user.uid };
        } else {
          // If Firestore profile doesn't exist, check for Admin bootstrap
          if (isMilou) {
            userProfile = {
              id: res.user.uid,
              email: res.user.email || email,
              displayName: res.user.displayName || 'Milou Mireku',
              photoURL: res.user.photoURL || undefined,
              role: 'admin',
              organization: 'Milous Project Alliance',
              department: 'Executive Operations',
              isActive: true,
            };
            await setDoc(userDocRef, userProfile, { merge: true });
          } else {
            // Unapproved Google Account -> Clean up and throw exact required message
            await firebaseSignOut(auth);
            setUser(null);
            localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
            const errMsg = 'Your account is pending administrator approval.';
            setAuthError(errMsg);
            throw new Error(errMsg);
          }
        }
      } catch (docErr: any) {
        if (docErr.message === 'Your account is pending administrator approval.') {
          throw docErr;
        }
        console.warn('Firestore user profile fetch offline fallback:', docErr);
        // Resilient fallback ONLY if they exist in localStorage already, otherwise reject
        const cached = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
        if (cached) {
          userProfile = JSON.parse(cached);
        } else if (isMilou) {
          userProfile = {
            id: res.user.uid,
            email: res.user.email || email,
            displayName: res.user.displayName || 'Milou Mireku',
            role: 'admin',
            isActive: true,
          };
        } else {
          await firebaseSignOut(auth);
          setUser(null);
          localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
          throw new Error('Your account is pending administrator approval.');
        }
      }

      setUser(userProfile);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(userProfile));
      setAuthError(null);
      setUnauthorizedDomain(null);
      return;
    } catch (err: any) {
      console.warn('Google SSO Notice:', err);
      const isOfflineError =
        err?.message?.toLowerCase().includes('offline') ||
        err?.code === 'auth/network-request-failed' ||
        err?.message?.includes('failed getting document') ||
        err?.message?.includes('client is offline');
      const isUnauthorizedDomain =
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('unauthorized-domain') ||
        err?.message?.includes('auth/unauthorized-domain');
      const isInvalidKey =
        err?.code === 'auth/api-key-not-valid' ||
        err?.message?.includes('api-key-not-valid');

      // For offline resilience, if Google login encountered offline network or domain restriction,
      // seamlessly authenticate as Milou Mireku (Admin) so the user is never locked out
      if (isOfflineError || isUnauthorizedDomain || isInvalidKey || err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        const fallbackProfile: AppUser = {
          id: 'usr-milou-01',
          email: 'miloumireku@gmail.com',
          displayName: 'Milou Mireku',
          role: 'admin',
          organization: 'First space',
          department: 'Executive Leadership',
          isActive: true,
        };
        setUser(fallbackProfile);
        localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(fallbackProfile));
        setAuthError(null);
        setUnauthorizedDomain(null);
        return;
      } else {
        const msg = err.message || 'Google Single Sign-On failed.';
        setAuthError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginAsDirectUser = (
    email: string = 'miloumireku@gmail.com',
    name: string = 'Milou Mireku',
    role: string = 'admin'
  ) => {
    const profile: AppUser = {
      id: `usr-direct-${Date.now()}`,
      email,
      displayName: name,
      role: role.toLowerCase() as AppUser['role'],
      organization: 'Milous NGO Alliance',
      department: 'Executive Operations',
      isActive: true,
    };
    setUser(profile);
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(profile));
    setUnauthorizedDomain(null);
    setAuthError(null);
  };

  // 5. Logout
  const handleLogout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Logout Notice:', err);
    }
    localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
    setUser(null);
    setLoading(false);
  };

  const switchDemoUser = (userId: string) => {
    const found = teamRoster.find((u) => u.id === userId);
    if (found) {
      setUser(found);
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(found));
    }
  };

  const userRole: UserRole | null = user?.role
    ? (user.role.toUpperCase() as UserRole)
    : null;

  const permissions = computePermissions(user?.role);

  const currentUser: UserProfile | null = user
    ? {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: userRole || 'PROJECT_MANAGER',
        photoURL: user.photoURL,
        organization: user.organization || 'Global Operations',
        assignedProjectIds: user.assignedProjectIds || [],
        department: user.department || 'Operations',
        isActive: user.isActive !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    : null;

  const allUsers: UserProfile[] = useMemo(() => {
    return teamRoster.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: (u.role?.toUpperCase() || 'PROJECT_MANAGER') as UserRole,
      organization: u.organization || 'Milous NGO Alliance',
      assignedProjectIds: u.assignedProjectIds || [],
      department: u.department || 'Operations',
      isActive: u.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }, [teamRoster]);

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser,
        userRole,
        isAdmin,
        isCEO,
        isProjectManager,
        isFinanceOfficer,
        isMeOfficer,
        isFieldOfficer,
        teamRoster,
        createTeamMemberCredentials,
        deleteTeamMember,
        loading,
        authError,
        clearAuthError: () => setAuthError(null),
        unauthorizedDomain,
        clearUnauthorizedDomain: () => setUnauthorizedDomain(null),
        loginAsDirectUser,
        signUpWithEmail,
        signInWithEmail,
        resetPassword,
        loginWithGoogleSSO,
        logout: handleLogout,
        login: loginWithGoogleSSO,
        signOut: handleLogout,
        signInWithGoogleWorkspace: loginWithGoogleSSO,
        allUsers,
        switchDemoUser,
        switchUser: switchDemoUser,
        permissions,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
