'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Wallet, WalletTransaction } from '@/types';

interface UpdateWalletFormProps {
  walletId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
}

export function UpdateWalletForm({ walletId, onSuccess, onCancel }: UpdateWalletFormProps) {
  const [formData, setFormData] = useState<FormData>({
    amount: 0,
    type: 'credit',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    const walletRef = doc(db, 'wallets', walletId);
    const unsubscribe = onSnapshot(
      walletRef,
      (doc) => {
        if (doc.exists()) {
          setWallet(doc.data() as Wallet);
        }
      },
      (error) => {
        console.error('Error fetching wallet:', error);
        toast.error('Error fetching wallet details');
      },
    );

    return () => unsubscribe();
  }, [walletId]);

  const handleInputChange = (name: keyof FormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!wallet) {
      toast.error('Wallet not found');
      return;
    }

    try {
      const walletRef = doc(db, 'wallets', walletId);
      const transaction: WalletTransaction = {
        amount: formData.amount,
        type: formData.type,
        reason: formData.reason,
        date: Timestamp.now(),
      };

      const newBalance =
        formData.type === 'credit'
          ? wallet.available_balance + formData.amount
          : wallet.available_balance - formData.amount;

      await updateDoc(walletRef, {
        available_balance: newBalance,
        transactions: [...wallet.transactions, transaction],
        updatedAt: Timestamp.now(),
      });

      toast.success('Transaction completed successfully!');
      setFormData({ amount: 0, type: 'credit', reason: '' });
      onSuccess?.();
    } catch (error: any) {
      console.error('Error updating wallet:', error);
      toast.error('Error updating wallet: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Current Balance</h3>
        <p className="text-2xl font-bold">₹{wallet?.available_balance.toFixed(2) || '0.00'}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Transaction Type</Label>
          <RadioGroup
            value={formData.type}
            onValueChange={(value) => handleInputChange('type', value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="credit" id="credit" />
              <Label htmlFor="credit" className="text-green-600">
                Credit
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="debit" id="debit" />
              <Label htmlFor="debit" className="text-red-600">
                Debit
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="Enter amount"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Input
            id="reason"
            type="text"
            placeholder="Enter reason for transaction"
            value={formData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !wallet || formData.amount <= 0}
          variant={formData.type === 'credit' ? 'default' : 'destructive'}
        >
          {isSubmitting
            ? 'Processing...'
            : `${formData.type === 'credit' ? 'Add' : 'Deduct'} Funds`}
        </Button>
      </div>
    </form>
  );
}
