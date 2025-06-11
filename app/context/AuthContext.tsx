'use client';

import { auth } from '@/firebase/auth';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { User } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearUserData = useCallback(() => {
    setUserData(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        clearUserData();
      }
    });

    return () => unsubscribe();
  }, [clearUserData]);

  // Subscribe to user data in Firestore when auth state changes
  useEffect(() => {
    if (!user?.uid) return;

    const userDoc = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userDoc,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const userData = {
            userId: doc.id,
            email: data.email || '',
            password: data.password || '',
            displayName: data.displayName || '',
            location: data.location || '',
            role: data.role || '',
            walletId: data.walletId || 'NA',
            createdAt: data.createdAt.toDate() || '',
          } as User;

          setUserData(userData);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user data:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
