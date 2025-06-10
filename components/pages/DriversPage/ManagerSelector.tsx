'use client';

import { useState, useEffect } from 'react';
import useUsers from '@/hooks/useUsers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ManagerSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ManagerSelector({ value, onChange }: ManagerSelectorProps) {
  const { users, isLoading } = useUsers(undefined, 'MANAGER');

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a Manager" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="NA">Not Assigned</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.userId} value={user.userId}>
            {user.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
