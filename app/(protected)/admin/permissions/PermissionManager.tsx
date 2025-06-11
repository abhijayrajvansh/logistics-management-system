'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { IconLoader, IconSearch, IconTrash, IconPlus } from '@tabler/icons-react';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { User } from '@/types';
import { FEATURE_IDS, FeatureId, DEFAULT_ROLE_PERMISSIONS } from '@/constants/permissions';

interface UserPermissions {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  permissions: string[];
}

export default function PermissionManager() {
  const [users, setUsers] = useState<UserPermissions[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Load all users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);

        const usersList: UserPermissions[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            userId: doc.id,
            email: data.email || '',
            displayName: data.displayName || '',
            role: data.role || '',
            permissions: data.permissions || DEFAULT_ROLE_PERMISSIONS[data.role] || [],
          };
        });

        setUsers(usersList);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Save permissions for selected user
  const savePermissions = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const userRef = doc(db, 'users', selectedUser.userId);
      await updateDoc(userRef, {
        permissions: selectedUser.permissions,
      });

      // Update local state
      setUsers(
        users.map((u) =>
          u.userId === selectedUser.userId ? { ...u, permissions: selectedUser.permissions } : u,
        ),
      );

      toast.success('Permissions updated successfully!');
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  // Add permission to selected user
  const addPermission = (featureId: FeatureId) => {
    if (!selectedUser || selectedUser.permissions.includes(featureId)) return;

    setSelectedUser({
      ...selectedUser,
      permissions: [...selectedUser.permissions, featureId],
    });
  };

  // Remove permission from selected user
  const removePermission = (featureId: string) => {
    if (!selectedUser) return;

    setSelectedUser({
      ...selectedUser,
      permissions: selectedUser.permissions.filter((p) => p !== featureId),
    });
  };

  // Reset to default role permissions
  const resetToDefaults = () => {
    if (!selectedUser) return;

    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[selectedUser.role] || [];
    setSelectedUser({
      ...selectedUser,
      permissions: [...defaultPermissions],
    });
  };

  // Group features by category
  const groupedFeatures = FEATURE_IDS.reduce(
    (acc, featureId) => {
      const category = featureId.split('_')[1]; // Extract category from FEATURE_CATEGORY_ACTION
      if (!acc[category]) acc[category] = [];
      acc[category].push(featureId);
      return acc;
    },
    {} as Record<string, FeatureId[]>,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Permission Management</h1>
        <p className="text-muted-foreground">
          Manage feature-based permissions for users in the system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Select a user to manage their permissions</CardDescription>

              {/* Search and Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {filteredUsers.map((user) => (
                  <div
                    key={user.userId}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedUser?.userId === user.userId ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {user.role}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {user.permissions.length} permissions
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">No users found</div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Permission Management */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Permissions for {selectedUser.displayName}</CardTitle>
                    <CardDescription>
                      Role:{' '}
                      <Badge variant="outline" className="capitalize">
                        {selectedUser.role}
                      </Badge>{' '}
                      • {selectedUser.permissions.length} permissions assigned
                    </CardDescription>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetToDefaults}>
                      Reset to Defaults
                    </Button>
                    <Button onClick={savePermissions} disabled={saving}>
                      {saving && <IconLoader className="h-4 w-4 animate-spin mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="assigned" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="assigned">
                      Assigned Permissions ({selectedUser.permissions.length})
                    </TabsTrigger>
                    <TabsTrigger value="available">
                      Available Permissions ({FEATURE_IDS.length - selectedUser.permissions.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="assigned" className="mt-4">
                    <ScrollArea className="h-[500px]">
                      {selectedUser.permissions.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          No permissions assigned
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedUser.permissions.map((permission) => (
                            <div
                              key={permission}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <div className="font-mono text-sm">{permission}</div>
                                <div className="text-xs text-muted-foreground">
                                  {permission.replace(/_/g, ' ').toLowerCase()}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removePermission(permission)}
                              >
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="available" className="mt-4">
                    <ScrollArea className="h-[500px]">
                      {Object.entries(groupedFeatures).map(([category, features]) => (
                        <div key={category} className="mb-6">
                          <h3 className="font-semibold mb-3 capitalize">{category} Features</h3>
                          <div className="space-y-2">
                            {features
                              .filter((feature) => !selectedUser.permissions.includes(feature))
                              .map((feature) => (
                                <div
                                  key={feature}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                  <div>
                                    <div className="font-mono text-sm">{feature}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {feature.replace(/_/g, ' ').toLowerCase()}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addPermission(feature)}
                                  >
                                    <IconPlus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                          </div>
                          {category !==
                            Object.keys(groupedFeatures)[
                              Object.keys(groupedFeatures).length - 1
                            ] && <Separator className="mt-4" />}
                        </div>
                      ))}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                  <div className="text-muted-foreground">
                    Select a user to manage their permissions
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
