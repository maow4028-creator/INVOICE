import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import {
  auth,
  isFirebaseConfigured,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from '../services/firebase.js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirebaseActive: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseActive, setIsFirebaseActive] = useState(isFirebaseConfigured());

  useEffect(() => {
    // If Firebase Auth is initialized and configured
    if (auth && isFirebaseConfigured()) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          setUser({
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            createdAt: fbUser.metadata.creationTime,
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local session check
      const savedUser = localStorage.getItem('invoicify_current_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem('invoicify_current_user');
        }
      }
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      if (auth && isFirebaseConfigured()) {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const fbUser = cred.user;
        const loggedUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email || email,
        };
        setUser(loggedUser);
        localStorage.setItem('invoicify_current_user', JSON.stringify(loggedUser));
      } else {
        // Local user account matching or creation
        const normalized = email.toLowerCase().trim();
        const userId = `usr_${btoa(normalized).replace(/=/g, '').substring(0, 16)}`;
        const loggedUser: User = {
          id: userId,
          name: normalized.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' '),
          email: normalized,
          createdAt: new Date().toISOString(),
        };
        setUser(loggedUser);
        localStorage.setItem('invoicify_current_user', JSON.stringify(loggedUser));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      if (auth && isFirebaseConfigured()) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if (cred.user) {
          await updateProfile(cred.user, { displayName: name });
        }
        const loggedUser: User = {
          id: cred.user.uid,
          name: name || cred.user.email?.split('@')[0] || 'User',
          email: cred.user.email || email,
        };
        setUser(loggedUser);
        localStorage.setItem('invoicify_current_user', JSON.stringify(loggedUser));
      } else {
        const normalized = email.toLowerCase().trim();
        const userId = `usr_${btoa(normalized).replace(/=/g, '').substring(0, 16)}`;
        const loggedUser: User = {
          id: userId,
          name: name.trim() || normalized.split('@')[0],
          email: normalized,
          createdAt: new Date().toISOString(),
        };
        setUser(loggedUser);
        localStorage.setItem('invoicify_current_user', JSON.stringify(loggedUser));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      if (auth && isFirebaseConfigured()) {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        const fbUser = cred.user;
        const loggedUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Google User',
          email: fbUser.email || '',
        };
        setUser(loggedUser);
        localStorage.setItem('invoicify_current_user', JSON.stringify(loggedUser));
      } else {
        // Demo Google Login
        const demoGoogleUser: User = {
          id: 'usr_google_demo_apex',
          name: 'Alexander Hayes',
          email: 'alexander@apexstudio.design',
        };
        setUser(demoGoogleUser);
        localStorage.setItem('invoicify_current_user', JSON.stringify(demoGoogleUser));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async () => {
    const demoUser: User = {
      id: 'usr_demo_apex_studio',
      name: 'Alexander Hayes',
      email: 'demo@invoicepro.com',
      createdAt: new Date().toISOString(),
    };
    setUser(demoUser);
    localStorage.setItem('invoicify_current_user', JSON.stringify(demoUser));
  };

  const logout = async () => {
    if (auth && isFirebaseConfigured()) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Firebase signOut error:', err);
      }
    }
    localStorage.removeItem('invoicify_current_user');
    setUser(null);
  };

  const sendResetEmail = async (email: string) => {
    if (auth && isFirebaseConfigured()) {
      await sendPasswordResetEmail(auth, email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isFirebaseActive,
        login,
        register,
        loginWithGoogle,
        demoLogin,
        logout,
        sendResetEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
