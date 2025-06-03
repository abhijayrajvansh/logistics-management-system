'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { toast } from 'sonner';

interface DeleteWalletDialogProps {
  walletId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteWalletDialog({ walletId, isOpen, onClose }: DeleteWalletDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'wallets', walletId));
      toast.success('Wallet deleted successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error deleting wallet:', error);
      toast.error('Error deleting wallet: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this wallet?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the wallet and all its
            transaction history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Wallet'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}