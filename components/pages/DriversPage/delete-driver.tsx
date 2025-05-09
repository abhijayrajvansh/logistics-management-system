'use client';

import { useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface DeleteDriverProps {
  driverId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteDriverDialog({ driverId, isOpen, onClose, onSuccess }: DeleteDriverProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!driverId) return;

    setIsDeleting(true);
    try {
      // Delete the driver document from Firestore
      await deleteDoc(doc(db, 'drivers', driverId));

      toast.success('Driver deleted successfully');

      // Call onSuccess callback if provided (for refreshing data)
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error('Failed to delete driver', {
        description: 'Please try again later',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this driver?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the driver and remove all
            their data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600"
          >
            {isDeleting ? 'Deleting...' : 'Delete Driver'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteDriverDialog;
