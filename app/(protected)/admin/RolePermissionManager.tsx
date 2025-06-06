'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { IconLoader, IconDeviceFloppy, IconRefresh } from '@tabler/icons-react';
import { doc, setDoc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { useAuth } from '@/app/context/AuthContext';
import { 
  PERMISSION_FEATURES, 
  AVAILABLE_ROLES, 
  DEFAULT_ROLE_PERMISSIONS, 
  Role,
  FeatureId 
} from '@/constants/permissions';
import { RolePermissions } from '@/types';

interface RolePermissionState {
  [role: string]: {
    [permission: string]: boolean;
  };
}

export default function RolePermissionManager() {
  const [rolePermissions, setRolePermissions] = useState<RolePermissionState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { userData } = useAuth();

  // Initialize role permissions state
  useEffect(() => {
    const initializePermissions = () => {
      const initialState: RolePermissionState = {};
      
      AVAILABLE_ROLES.forEach(role => {
        initialState[role] = {};
        Object.values(PERMISSION_FEATURES).flat().forEach(permission => {
          const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
          initialState[role][permission] = defaultPermissions.includes(permission);
        });
      });
      
      setRolePermissions(initialState);
    };

    initializePermissions();
  }, []);

  // Load role permissions from Firestore
  useEffect(() => {
    setLoading(true);
    const unsubscribes: (() => void)[] = [];

    AVAILABLE_ROLES.forEach(role => {
      const roleDoc = doc(db, 'rolePermissions', role);
      
      const unsubscribe = onSnapshot(
        roleDoc,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() as RolePermissions;
            setRolePermissions(prev => ({
              ...prev,
              [role]: Object.values(PERMISSION_FEATURES).flat().reduce((acc, permission) => {
                acc[permission] = data.permissions.includes(permission);
                return acc;
              }, {} as { [permission: string]: boolean })
            }));
          }
        },
        (error) => {
          console.error(`Error loading permissions for role ${role}:`, error);
          toast.error(`Failed to load permissions for ${role}`);
        }
      );
      
      unsubscribes.push(unsubscribe);
    });

    // Set loading to false after a brief delay to ensure all subscriptions are set up
    setTimeout(() => setLoading(false), 500);

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const togglePermission = (role: Role, permission: FeatureId) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: !prev[role]?.[permission]
      }
    }));
    setHasChanges(true);
  };

  const saveRolePermissions = async () => {
    if (!userData) {
      toast.error('You must be logged in to save permissions');
      return;
    }

    setSaving(true);
    
    try {
      const savePromises = AVAILABLE_ROLES.map(async (role) => {
        const permissions = Object.entries(rolePermissions[role] || {})
          .filter(([_, enabled]) => enabled)
          .map(([permission]) => permission);

        const rolePermissionData: RolePermissions = {
          roleId: role,
          permissions,
          updatedAt: new Date(),
          updatedBy: userData.userId
        };

        const roleDoc = doc(db, 'rolePermissions', role);
        return setDoc(roleDoc, rolePermissionData);
      });

      await Promise.all(savePromises);
      setHasChanges(false);
      toast.success('Role permissions updated successfully');
    } catch (error) {
      console.error('Error saving role permissions:', error);
      toast.error('Failed to save role permissions');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultState: RolePermissionState = {};
    
    AVAILABLE_ROLES.forEach(role => {
      defaultState[role] = {};
      Object.values(PERMISSION_FEATURES).flat().forEach(permission => {
        const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
        defaultState[role][permission] = defaultPermissions.includes(permission);
      });
    });
    
    setRolePermissions(defaultState);
    setHasChanges(true);
    toast.info('Reset to default permissions');
  };

  const initializeRolePermissions = async () => {
    setSaving(true);
    
    try {
      const initPromises = AVAILABLE_ROLES.map(async (role) => {
        const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
        
        const rolePermissionData: RolePermissions = {
          roleId: role,
          permissions: defaultPermissions,
          updatedAt: new Date(),
          updatedBy: userData?.userId || 'admin'
        };

        const roleDoc = doc(db, 'rolePermissions', role);
        return setDoc(roleDoc, rolePermissionData);
      });

      await Promise.all(initPromises);
      setHasChanges(false);
      toast.success('Role permissions initialized with default values');
    } catch (error) {
      console.error('Error initializing role permissions:', error);
      toast.error('Failed to initialize role permissions');
    } finally {
      setSaving(false);
    }
  };

  const formatFeatureName = (permission: string) => {
    return permission
      .replace('FEATURE_', '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRoleColor = (role: Role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      manager: 'bg-blue-100 text-blue-800 border-blue-200',
      accountant: 'bg-green-100 text-green-800 border-green-200',
      driver: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconLoader className="h-6 w-6 animate-spin mr-2" />
        Loading role permissions...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Role-Based Permission Management</CardTitle>
              <CardDescription>
                Manage permissions for each role in the system. Changes are saved to all users with that role.
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={initializeRolePermissions}
                disabled={saving}
              >
                <IconRefresh className="h-4 w-4 mr-2" />
                Initialize Defaults
              </Button>
              <Button 
                variant="outline" 
                onClick={resetToDefaults}
                disabled={saving}
              >
                <IconRefresh className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button 
                onClick={saveRolePermissions} 
                disabled={!hasChanges || saving}
              >
                {saving && <IconLoader className="h-4 w-4 animate-spin mr-2" />}
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Feature</th>
                  {AVAILABLE_ROLES.map(role => (
                    <th key={role} className="text-center p-3 font-medium min-w-[120px]">
                      <Badge className={getRoleColor(role)}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(PERMISSION_FEATURES).flatMap(([featureGroup, permissions]) => [
                  // Feature group header row
                  <tr key={featureGroup} className="border-b bg-gray-50">
                    <td colSpan={AVAILABLE_ROLES.length + 1} className="p-3 font-semibold text-gray-700">
                      {featureGroup}
                    </td>
                  </tr>,
                  // Permission rows for this feature group
                  ...permissions.map(permission => (
                    <tr key={permission} className="border-b hover:bg-gray-50">
                      <td className="p-3 pl-6 text-sm">
                        {formatFeatureName(permission)}
                      </td>
                      {AVAILABLE_ROLES.map(role => (
                        <td key={`${role}-${permission}`} className="p-3 text-center">
                          <Switch
                            checked={rolePermissions[role]?.[permission] || false}
                            onCheckedChange={() => togglePermission(role, permission as FeatureId)}
                            disabled={saving}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ])}
              </tbody>
            </table>
          </div>
          
          {hasChanges && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                You have unsaved changes. Click "Save Changes" to apply them.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
