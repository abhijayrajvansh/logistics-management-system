'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { FeatureId, DEFAULT_ROLE_PERMISSIONS } from '@/constants/permissions';

interface PermissionsContextType {
  permissions: string[];
  setPermissions: (permissions: string[]) => void;
  clearPermissions: () => void;
  hasPermission: (featureId: FeatureId) => boolean;
  loading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: [],
  setPermissions: () => {},
  clearPermissions: () => {},
  hasPermission: () => false,
  loading: false,
});

interface PermissionsProviderProps {
  children: ReactNode;
}

export const PermissionsProvider = ({ children }: PermissionsProviderProps) => {
  const [permissions, setPermissionsState] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const setPermissions = useCallback((newPermissions: string[]) => {
    setPermissionsState(newPermissions);
  }, []);

  const clearPermissions = useCallback(() => {
    setPermissionsState([]);
  }, []);

  const hasPermission = useCallback(
    (featureId: FeatureId): boolean => {
      return permissions.includes(featureId);
    },
    [permissions],
  );

  const contextValue = useMemo(
    () => ({
      permissions,
      setPermissions,
      clearPermissions,
      hasPermission,
      loading,
    }),
    [permissions, setPermissions, clearPermissions, hasPermission, loading],
  );

  return <PermissionsContext.Provider value={contextValue}>{children}</PermissionsContext.Provider>;
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

// Convenience hook for cleaner syntax
export const useFeatureAccess = () => {
  const { hasPermission } = usePermissions();
  return {
    can: (featureId: FeatureId) => hasPermission(featureId),
  };
};
