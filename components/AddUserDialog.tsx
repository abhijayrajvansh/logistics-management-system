import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import env from '@/constants';
import { IconLoader2 } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react';
import { z } from 'zod';

const userSchema = z.object({
  userId: z.string().refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num.toString().length >= 6;
  }, 'User Login ID must be a number with at least 6 digits'),
  username: z.string(),
  password: z.string().min(8, 'Password must contain at least 8 characters'),
  roles: z.array(z.string()).min(1, 'At least one role must be assigned'),
});

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const availableRoles = ['worker', 'manager', 'admin'];

export function AddUserDialog({ isOpen, onOpenChange }: AddUserDialogProps) {
  const [formData, setFormData] = React.useState({
    userId: '',
    username: '',
    password: '',
    roles: [] as string[],
  });
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (userData: {
      userId: string;
      username: string;
      password: string;
      roles: string[];
    }) => {
      const payload = {
        ...userData,
        userId: parseInt(userData.userId),
      };
      console.log('Creating user with payload:', payload);
      const response = await axios.post(`${env.SERVER_URL}/api/users/create`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
      setFormData({
        userId: '',
        username: '',
        password: '',
        roles: [],
      });
      setValidationError(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      userSchema.parse(formData);
      setValidationError(null);
      createUserMutation.mutate(formData);
      window.location.reload();
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0].message);
      }
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(value)
        ? prev.roles.filter((role) => role !== value)
        : [...prev.roles, value],
    }));
  };

  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        userId: '',
        username: '',
        password: '',
        roles: [],
      });
      setValidationError(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(createUserMutation.error || validationError) && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {validationError ||
                (createUserMutation.error instanceof Error
                  ? createUserMutation.error.message
                  : 'An error occurred while creating the user')}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="userId">Login ID</Label>
            <Input
              id="userId"
              value={formData.userId}
              onChange={(e) => setFormData((prev) => ({ ...prev, userId: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Name</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Assign Roles</Label>
            <div className="flex gap-2 mt-3">
              {availableRoles.map((role) => (
                <Button
                  size={'sm'}
                  key={role}
                  type="button"
                  variant={formData.roles.includes(role) ? 'default' : 'outline'}
                  onClick={() => handleRoleChange(role)}
                  className="capitalize text-xs"
                >
                  {role}
                </Button>
              ))}
            </div>
            <p className="text-xs mt-5 text-black/60 pl-1">
              Caution: Assigning admin role grants full access to all features & permissions.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? (
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Add User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
