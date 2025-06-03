'use client';

import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateWalletFormProps {
  onSuccess?: () => void;
}

interface FormData {
  userId: string;
  available_balance: number;
}

export function CreateWalletForm({ onSuccess }: CreateWalletFormProps) {
  const [formData, setFormData] = useState<FormData>({
    userId: '',
    available_balance: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'available_balance' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const now = Timestamp.now();
      await addDoc(collection(db, 'wallets'), {
        ...formData,
        transactions: [],
        createdAt: now,
        updatedAt: now,
      });

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
        <Label htmlFor="userId">User ID</Label>
        <Input
          id="userId"
          placeholder="Enter user ID"
          value={formData.userId}
          onChange={(e) => handleInputChange('userId', e.target.value)}
          required
        />
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
