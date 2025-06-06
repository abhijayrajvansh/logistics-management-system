'use client';

import { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { usePermissions } from './PermissionsContext';
import { DEFAULT_ROLE_PERMISSIONS } from '@/constants/permissions';

/**
 * Component that handles loading user permissions when user data changes
 * This separates the permission loading logic from the AuthContext to avoid circular dependencies
 */
export const PermissionsLoader = ({ children }: { children: React.ReactNode }) => {
  const { userData, user } = useAuth();
  const { setPermissions, clearPermissions } = usePermissions();

  useEffect(() => {
    if (!user) {
      // Clear permissions on logout
      clearPermissions();
      return;
    }

    if (userData) {
      // Load permissions - use custom permissions if available, otherwise use default role permissions
      const userPermissions =
        userData.permissions && userData.permissions.length > 0
          ? userData.permissions
          : DEFAULT_ROLE_PERMISSIONS[userData.role] || [];

      setPermissions(userPermissions);
    }
  }, [userData, user, setPermissions, clearPermissions]);

  return <>{children}</>;
};
