'use client';

import { ColumnDef } from '@tanstack/react-table';
import { TAT_Mapping } from '@/hooks/useTATs';
import { useState } from 'react';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Timestamp } from 'firebase/firestore';
import UpdateTATForm from './update-tat';
import DeleteTATDialog from './delete-tat';

// Create a component for the actions cell to manage edit dialog state
const ActionCell = ({ row }: { row: any }) => {
  const tat = row.original;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleUpdateSuccess = () => {
    setIsEditDialogOpen(false);
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

      {/* Edit TAT Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit TAT Mapping</DialogTitle>
            <DialogDescription>
              Update the TAT mapping details below. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          <UpdateTATForm
            tatId={tat.id}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete TAT Dialog */}
      <DeleteTATDialog
        tatId={tat.id}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};

const formatDate = (timestamp: Timestamp) => {
  if (!timestamp) return '';
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};

export const columns: ColumnDef<TAT_Mapping>[] = [
  {
    accessorKey: 'center_id',
    header: 'Center',
  },
  {
    accessorKey: 'client_id',
    header: 'Client',
  },
  {
    accessorKey: 'receiver_id',
    header: 'Receiver',
  },
  {
    accessorKey: 'tat_value',
    header: 'TAT (Hours)',
    cell: ({ row }) => {
      const hours: number = row.getValue('tat_value');
      return <div className="text-left font-medium">{hours} H</div>;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created At',
    cell: ({ row }) => {
      const timestamp = row.getValue('created_at') as Timestamp;
      return <div>{formatDate(timestamp)}</div>;
    },
  },
  {
    accessorKey: 'updated_at',
    header: 'Last Updated',
    cell: ({ row }) => {
      const timestamp = row.getValue('updated_at') as Timestamp;
      return <div>{formatDate(timestamp)}</div>;
    },
  },
  {
    accessorKey: 'actions',
    header: () => <div className="text-center">Actions</div>,
    id: 'actions',
    cell: ActionCell,
  },
];
