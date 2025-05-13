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

interface DeleteReceiverProps {
  receiverId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteReceiverDialog({
  receiverId,
  isOpen,
  onClose,
  onSuccess,
}: DeleteReceiverProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!receiverId) return;

    setIsDeleting(true);
    try {
      // Delete the receiver document from Firestore
      await deleteDoc(doc(db, 'receivers', receiverId));

      toast.success('Receiver deleted successfully');

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Error deleting receiver:', error);
      toast.error('Failed to delete receiver', {
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
          <AlertDialogTitle>Are you sure you want to delete this receiver?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the receiver and remove their
            data from our servers.
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
            {isDeleting ? 'Deleting...' : 'Delete Receiver'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteReceiverDialog;
