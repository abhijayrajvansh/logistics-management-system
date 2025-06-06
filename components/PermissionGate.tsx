'use client';

import { useFeatureAccess, usePermissions } from '@/app/context/PermissionsContext';
import { FeatureId } from '@/constants/permissions';
import { ReactNode } from 'react';

interface PermissionGateProps {
  feature: FeatureId;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export const PermissionGate = ({ feature, children, fallback = null }: PermissionGateProps) => {
  const { can } = useFeatureAccess();
  
  return can(feature) ? <>{children}</> : <>{fallback}</>;
};

/**
 * Hook for checking multiple permissions at once
 */
export const useMultiplePermissions = (features: FeatureId[]) => {
  const { hasPermission } = usePermissions();
  
  const results = features.reduce((acc, feature) => {
    acc[feature] = hasPermission(feature);
    return acc;
  }, {} as Record<FeatureId, boolean>);
  
  const hasAll = features.every(feature => hasPermission(feature));
  const hasAny = features.some(feature => hasPermission(feature));
  
  return {
    permissions: results,
    hasAll,
    hasAny,
  };
};

/**
 * Higher-order component for protecting entire pages
 */
export const withPermission = (
  WrappedComponent: React.ComponentType<any>,
  requiredPermission: FeatureId,
  fallbackComponent?: React.ComponentType
) => {
  return function PermissionProtectedComponent(props: any) {
    const { can } = useFeatureAccess();
    
    if (!can(requiredPermission)) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent {...props} />;
      }
      
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this feature.
            </p>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};
