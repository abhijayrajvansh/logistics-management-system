'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface UpdateWalletFormProps {
  walletId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  available_balance: number;
}

export function UpdateWalletForm({ walletId, onSuccess, onCancel }: UpdateWalletFormProps) {
  const [formData, setFormData] = useState<FormData>({
    available_balance: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const walletRef = doc(db, 'wallets', walletId);
      await updateDoc(walletRef, {
        available_balance: formData.available_balance,
        updatedAt: new Date(),
      });

      toast.success('Wallet updated successfully!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error updating wallet:', error);
      toast.error('Error updating wallet: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="balance">Available Balance</Label>
        <Input
          id="balance"
          type="number"
          step="0.01"
          placeholder="Enter balance"
          value={formData.available_balance}
          onChange={(e) => handleInputChange('available_balance', e.target.value)}
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating Wallet...' : 'Update Wallet'}
        </Button>
      </div>
    </form>
  );
}
