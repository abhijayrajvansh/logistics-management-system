'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { FeatureId } from '@/constants/permissions';

interface PermissionsContextType {
  permissions: string[];
  setPermissions: (permissions: string[]) => void;
  clearPermissions: () => void;
  hasPermission: (featureId: FeatureId) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: [],
  setPermissions: () => {},
  clearPermissions: () => {},
  hasPermission: () => false,
});

interface PermissionsProviderProps {
  children: ReactNode;
}

export const PermissionsProvider = ({ children }: PermissionsProviderProps) => {
  const [permissions, setPermissionsState] = useState<string[]>([]);

  const setPermissions = (newPermissions: string[]) => {
    setPermissionsState(newPermissions);
  };

  const clearPermissions = () => {
    setPermissionsState([]);
  };

  const hasPermission = (featureId: FeatureId): boolean => {
    return permissions.includes(featureId);
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        setPermissions,
        clearPermissions,
        hasPermission,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
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
