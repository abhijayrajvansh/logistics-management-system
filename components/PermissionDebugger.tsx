'use client';

import { useAuth } from '@/app/context/AuthContext';
import { usePermissions } from '@/app/context/PermissionsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PermissionDebugger() {
  const { userData } = useAuth();
  const { permissions } = usePermissions();

  if (!userData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Debugger</CardTitle>
          <CardDescription>No user logged in</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Debugger</CardTitle>
        <CardDescription>Current user role and permissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">User Info</h4>
          <div className="space-y-1">
            <p>
              <strong>Name:</strong> {userData.displayName}
            </p>
            <p>
              <strong>Email:</strong> {userData.email}
            </p>
            <p>
              <strong>Role:</strong> <Badge variant="outline">{userData.role}</Badge>
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Loaded Permissions ({permissions.length})</h4>
          <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
            {permissions.map((permission) => (
              <Badge key={permission} variant="secondary" className="text-xs">
                {permission.replace('FEATURE_', '').replace(/_/g, ' ').toLowerCase()}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
