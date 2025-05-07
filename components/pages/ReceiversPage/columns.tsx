'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReceiverDetails } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import DeleteReceiverDialog from './delete-receiver';
import UpdateReceiverForm from './update-receiver';

// Create a component for the actions cell to manage edit dialog state
const ActionCell = ({ row }: { row: any }) => {
  const receiver = row.original;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleUpdateSuccess = () => {
    setIsEditDialogOpen(false);
  };

  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="text-center space-x-2">
      <button
        className="hover:bg-primary p-1 rounded-lg cursor-pointer border border-primary text-primary hover:text-white"
        onClick={() => setIsEditDialogOpen(true)}
      >
        <MdEdit size={15} />
      </button>
      <button
        className="hover:bg-red-500 p-1 rounded-lg cursor-pointer border border-red-500 text-red-500 hover:text-white"
        onClick={() => setIsDeleteDialogOpen(true)}
      >
        <MdDeleteOutline size={15} />
      </button>

      {/* Edit Receiver Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Receiver</DialogTitle>
            <DialogDescription>
              Update the receiver details below. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          <UpdateReceiverForm
            receiverId={receiver.id}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Receiver Dialog */}
      <DeleteReceiverDialog
        receiverId={receiver.id}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export const columns: ColumnDef<ReceiverDetails>[] = [
  {
    accessorKey: 'receiverId',
    header: 'Receiver ID',
  },
  {
    accessorKey: 'receiverName',
    header: 'Receiver Name',
  },
  {
    accessorKey: 'receiverDetails',
    header: 'Receiver Details',
  },
  {
    accessorKey: 'receiverContact',
    header: 'Contact',
  },
  {
    accessorKey: 'actions',
    header: () => <div className="text-center">Actions</div>,
    id: 'actions',
    cell: ActionCell,
  },
];
