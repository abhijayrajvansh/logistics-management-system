'use client';

import { auth } from '@/firebase/auth';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { User } from '@/types';
import { usePermissions } from './PermissionsContext';
import { DEFAULT_ROLE_PERMISSIONS } from '@/constants/permissions';

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
  const { setPermissions, clearPermissions } = usePermissions();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setUserData(null);
        clearPermissions(); // Clear permissions on logout
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [clearPermissions]);

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
            permissions: data.permissions || [],
            createdAt: data.createdAt.toDate() || '',
          } as User;
          
          setUserData(userData);
          
          // Load permissions - use custom permissions if available, otherwise use default role permissions
          const userPermissions = userData.permissions && userData.permissions.length > 0 
            ? userData.permissions 
            : DEFAULT_ROLE_PERMISSIONS[userData.role] || [];
          
          setPermissions(userPermissions);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user data:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid, setPermissions]);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
