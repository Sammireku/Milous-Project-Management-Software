import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore,
  Firestore 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDmTkdv5CBH8lIq8FnGu8JCXootRAaK96M',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'milousproject.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'milousproject',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'milousproject.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '484489007892',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:484489007892:web:4855a490d93cb6a0bde801',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-RFKFSKP14Z'
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore with Offline Persistence (Multi-Tab Supported)
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch {
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;
export const storage = getStorage(app);

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
export const isConfiguredWithRealFirebase = true;
