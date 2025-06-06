'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { useAuth } from './AuthContext';
import { usePermissions } from './PermissionsContext';
import { DEFAULT_ROLE_PERMISSIONS } from '@/constants/permissions';
import { RolePermissions } from '@/types';

/**
 * Component that handles loading role-based permissions when user data changes
 * This separates the permission loading logic from the AuthContext to avoid circular dependencies
 */
export const PermissionsLoader = ({ children }: { children: React.ReactNode }) => {
  const { userData, user } = useAuth();
  const { setPermissions, clearPermissions } = usePermissions();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      // Clear permissions on logout
      clearPermissions();
      return;
    }

    if (userData) {
      setLoading(true);
      
      // Subscribe to role permissions from Firestore
      const rolePermissionsRef = doc(db, 'rolePermissions', userData.role);
      
      const unsubscribe = onSnapshot(
        rolePermissionsRef,
        (doc) => {
          setLoading(false);
          if (doc.exists()) {
            // Use role permissions from Firestore
            const roleData = doc.data() as RolePermissions;
            setPermissions(roleData.permissions || []);
          } else {
            // Fallback to default role permissions
            const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[userData.role] || [];
            setPermissions(defaultPermissions);
          }
        },
        (error) => {
          console.error('Error loading role permissions:', error);
          setLoading(false);
          // Fallback to default role permissions on error
          const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[userData.role] || [];
          setPermissions(defaultPermissions);
        }
      );

      return () => unsubscribe();
    }
  }, [userData, user, setPermissions, clearPermissions]);

  return <>{children}</>;
};
