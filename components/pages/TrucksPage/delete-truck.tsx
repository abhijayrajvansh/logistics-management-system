'use client';

import { useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
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

interface DeleteTruckProps {
  truckId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteTruckDialog({ truckId, isOpen, onClose, onSuccess }: DeleteTruckProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!truckId) return;

    setIsDeleting(true);
    try {
      // Delete the truck document from Firestore
      await deleteDoc(doc(db, 'trucks', truckId));

      toast.success('Truck deleted successfully');

      // Call onSuccess callback if provided (for refreshing data)
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Error deleting truck:', error);
      toast.error('Failed to delete truck', {
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
          <AlertDialogTitle>Are you sure you want to delete this truck?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the truck and remove its data
            from our servers.
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
            {isDeleting ? 'Deleting...' : 'Delete Truck'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteTruckDialog;
