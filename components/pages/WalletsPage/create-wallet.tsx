'use client';

import { useState } from 'react';
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import useUsers from '@/hooks/useUsers';
import { User } from '@/types';

interface CreateWalletFormProps {
  onSuccess?: () => void;
}

interface FormData {
  userId: string;
  available_balance: number;
  displayName: string; // Added to store the user's display name
}

export function CreateWalletForm({ onSuccess }: CreateWalletFormProps) {
  const { users, isLoading: isLoadingUsers } = useUsers(undefined, 'manager');
  const [formData, setFormData] = useState<FormData>({
    userId: '',
    available_balance: 0,
    displayName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (name: keyof FormData, value: string) => {
    if (name === 'userId') {
      const selectedUser = users.find((user) => user.userId === value);
      setFormData((prev) => ({
        ...prev,
        userId: value,
        displayName: selectedUser?.displayName || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'available_balance' ? Number(value) : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if user already has a wallet
      const walletsRef = collection(db, 'wallets');
      const userWalletQuery = query(walletsRef, where('userId', '==', formData.userId));
      const existingWallets = await getDocs(userWalletQuery);

      if (!existingWallets.empty) {
        toast.error('User already has a wallet');
        return;
      }

      const now = Timestamp.now();
      // Create the wallet first
      const walletDoc = await addDoc(collection(db, 'wallets'), {
        userId: formData.userId,
        displayName: formData.displayName,
        available_balance: formData.available_balance,
        transactions: [],
        createdAt: now,
        updatedAt: now,
      });

      // Update the user's walletId in users collection
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('userId', '==', formData.userId));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          walletId: walletDoc.id,
        });
      }

      toast.success('Wallet created successfully!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      toast.error('Error creating wallet: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userId">Select Manager</Label>
        <Select
          value={formData.userId}
          onValueChange={(value) => handleInputChange('userId', value)}
          disabled={isLoadingUsers}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a manager" />
          </SelectTrigger>
          <SelectContent>
            {users
              .filter((user) => !user.walletId || user.walletId === 'NA') // Only show users without wallets
              .map((user) => (
                <SelectItem key={user.userId} value={user.userId}>
                  {user.displayName}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="balance">Initial Balance</Label>
        <Input
          id="balance"
          type="number"
          step="0.01"
          placeholder="Enter initial balance"
          value={formData.available_balance}
          onChange={(e) => handleInputChange('available_balance', e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating Wallet...' : 'Create Wallet'}
      </Button>
    </form>
  );
}
