'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { toast } from 'sonner';
import { useState } from 'react';

interface DeleteTATDialogProps {
  tatId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteTATDialog({ tatId, isOpen, onClose }: DeleteTATDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'tats', tatId));
      toast.success('TAT mapping deleted successfully!');
      onClose();
    } catch (error) {
      console.error('Error deleting TAT mapping:', error);
      toast.error('Failed to delete TAT mapping', {
        description: 'Please try again',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete TAT Mapping</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this TAT mapping? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
