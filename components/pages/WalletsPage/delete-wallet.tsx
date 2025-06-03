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
import {
  doc,
  deleteDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
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
      // First get the wallet to find the userId
      const walletRef = doc(db, 'wallets', walletId);
      const walletSnap = await getDoc(walletRef);

      if (walletSnap.exists()) {
        const walletData = walletSnap.data();

        // Find and update the user document
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('userId', '==', walletData.userId));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await updateDoc(doc(db, 'users', userDoc.id), {
            walletId: 'NA',
          });
        }

        // Then delete the wallet
        await deleteDoc(walletRef);
        toast.success('Wallet deleted successfully!');
      } else {
        toast.error('Wallet not found');
      }
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
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Wallet'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
