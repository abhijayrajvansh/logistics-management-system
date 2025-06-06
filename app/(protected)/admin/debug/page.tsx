'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { IconLoader, IconDatabase, IconUsers, IconShield } from '@tabler/icons-react';
import { useAuth } from '@/app/context/AuthContext';
import { usePermissions } from '@/app/context/PermissionsContext';
import { initializeRolePermissions } from '@/scripts/initializeRolePermissions';
import PermissionDebugger from '@/components/PermissionDebugger';

export default function SystemDebugPage() {
  const [loading, setLoading] = useState(false);
  const { userData } = useAuth();
  const { permissions } = usePermissions();

  const handleInitializeRolePermissions = async () => {
    setLoading(true);
    try {
      const result = await initializeRolePermissions();
      if (result.success) {
        toast.success('Role permissions initialized successfully!');
      } else {
        toast.error('Failed to initialize role permissions');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while initializing permissions');
    } finally {
      setLoading(false);
    }
  };

  if (!userData || userData.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Access Denied</CardTitle>
              <CardDescription>
                This debug page is only accessible to admin users.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Debug Panel</h1>
          <p className="text-muted-foreground">
            Debug and manage the role-based permission system
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* System Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconDatabase className="h-5 w-5" />
                System Actions
              </CardTitle>
              <CardDescription>
                Initialize and manage the role-based permission system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleInitializeRolePermissions}
                disabled={loading}
                className="w-full"
              >
                {loading && <IconLoader className="h-4 w-4 animate-spin mr-2" />}
                <IconShield className="h-4 w-4 mr-2" />
                Initialize Role Permissions
              </Button>
              
              <div className="text-sm text-muted-foreground">
                <p>This will create default role permissions in Firestore for:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Admin (all permissions)</li>
                  <li>Manager (management permissions)</li>
                  <li>Accountant (financial permissions)</li>
                  <li>Driver (basic permissions)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Current User Debug */}
          <PermissionDebugger />

          {/* System Status */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUsers className="h-5 w-5" />
                Role-Based Permission System Status
              </CardTitle>
              <CardDescription>
                Current status of the permission system transition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <div className="font-medium">Role System</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{permissions.length}</div>
                  <div className="font-medium">Loaded Permissions</div>
                  <div className="text-sm text-muted-foreground">For {userData.role}</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">4</div>
                  <div className="font-medium">Available Roles</div>
                  <div className="text-sm text-muted-foreground">Admin, Manager, Accountant, Driver</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">✅ Migration Complete</h4>
                <p className="text-sm text-green-700">
                  Your system has been successfully transitioned to role-based permissions. 
                  Users now inherit permissions based on their assigned role instead of individual permission settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
