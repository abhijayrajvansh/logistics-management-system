'use client';

import { useState } from 'react';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
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
      // First get the driver document to find the corresponding user document
      const driverRef = doc(db, 'drivers', driverId);
      const driverDoc = await getDoc(driverRef);

      if (!driverDoc.exists()) {
        throw new Error('Driver not found');
      }

      // Delete from users collection (using same ID as driver document)
      const userRef = doc(db, 'users', driverId);
      await deleteDoc(userRef);

      // Delete from attendance collection
      const attendanceRef = doc(db, 'attendance', driverId);
      await deleteDoc(attendanceRef);

      // Delete from drivers collection
      await deleteDoc(driverRef);

      toast.success('Driver deleted successfully');

      // Call onSuccess callback if provided (for refreshing data)
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error('Failed to delete driver', {
        description: error instanceof Error ? error.message : 'Please try again later',
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
