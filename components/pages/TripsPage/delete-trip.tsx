'use client';

import { useState } from 'react';
import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
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

interface DeleteTripProps {
  tripId: string; // This is now the unique tripId, not the document ID
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteTripDialog({ tripId, isOpen, onClose, onSuccess }: DeleteTripProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!tripId) return;

    setIsDeleting(true);
    try {
      // First we need to find the document with the given tripId
      const tripsRef = collection(db, 'trips');
      const tripQuery = query(tripsRef, where('tripId', '==', tripId));
      const querySnapshot = await getDocs(tripQuery);

      if (querySnapshot.empty) {
        toast.error('Trip not found');
        onClose();
        return;
      }

      // Get the document ID to delete
      const docId = querySnapshot.docs[0].id;

      // Delete the trip document from Firestore using the document ID
      await deleteDoc(doc(db, 'trips', docId));

      toast.success('Trip deleted successfully');

      // Call onSuccess callback if provided (for refreshing data)
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast.error('Failed to delete trip', {
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
          <AlertDialogTitle>Are you sure you want to delete this trip?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the trip and remove its data
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
            {isDeleting ? 'Deleting...' : 'Delete Trip'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteTripDialog;
