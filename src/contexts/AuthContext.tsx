'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AppUser, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  userData: AppUser | null;
  loading: boolean;
  firestoreReady: boolean;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  firestoreReady: false,
  signOut: async () => {},
  refreshUserData: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firestoreReady, setFirestoreReady] = useState(false);

  const fetchUserData = async (uid: string, email?: string) => {
    if (!db) { setFirestoreReady(false); return; }

    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data() as AppUser);
      }
    } catch (e) {
      console.error('fetchUserData failed:', e);
    }

    setFirestoreReady(true);
  };

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (cancelled) return;
      clearTimeout(timeout);
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        fetchUserData(firebaseUser.uid, firebaseUser.email || undefined);
      } else {
        setUserData(null);
        setFirestoreReady(true);
      }
    }, () => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; clearTimeout(timeout); unsubscribe(); };
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserData(null);
  };

  const refreshUserData = async () => {
    if (user) await fetchUserData(user.uid, user.email || undefined);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, firestoreReady, signOut, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function hasPermission(userData: AppUser | null, allowedRoles: UserRole[]): boolean {
  if (!userData) return false;
  return allowedRoles.includes(userData.role) || userData.role === 'super_admin';
}

export function useRoleAccess(allowedRoles: UserRole[]) {
  const { userData } = useAuth();
  return hasPermission(userData, allowedRoles);
}
