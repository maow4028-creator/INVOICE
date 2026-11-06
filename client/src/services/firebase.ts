import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';

// Default / Environment Firebase Config
const getInitialFirebaseConfig = () => {
  // Check localStorage first for user-configured keys
  const saved = localStorage.getItem('invoicify_firebase_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
};

export const currentFirebaseConfig = getInitialFirebaseConfig();

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    currentFirebaseConfig.apiKey &&
    currentFirebaseConfig.projectId &&
    !currentFirebaseConfig.apiKey.includes('YOUR_')
  );
};

// Initialize Firebase App
let app: any = null;
let auth: any = null;
let db: any = null;

export const initFirebase = (config = currentFirebaseConfig) => {
  if (config.apiKey && config.projectId && !config.apiKey.includes('YOUR_')) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(config);
      auth = getAuth(app);
      db = getFirestore(app);
      console.log('🔥 Firebase initialized successfully with project:', config.projectId);
      return { app, auth, db };
    } catch (err) {
      console.warn('Firebase initialization warning:', err);
    }
  }
  return { app: null, auth: null, db: null };
};

const initialized = initFirebase();
app = initialized.app;
auth = initialized.auth;
db = initialized.db;

export {
  app,
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
};
export type { FirebaseUser, Firestore };

