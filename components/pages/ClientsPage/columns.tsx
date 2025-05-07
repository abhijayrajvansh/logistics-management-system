'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Client } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import DeleteClientDialog from './delete-client';
import UpdateClientForm from './update-client';

// Create a component for the actions cell to manage edit dialog state
const ActionCell = ({ row }: { row: any }) => {
  const client = row.original;
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

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client details below. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          <UpdateClientForm
            clientId={client.id}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Client Dialog */}
      <DeleteClientDialog
        clientId={client.id}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: 'clientId',
    header: 'Client ID',
  },
  {
    accessorKey: 'clientName',
    header: 'Client Name',
  },
  {
    accessorKey: 'clientDetails',
    header: 'Client Details',
  },
  {
    accessorKey: 'current_tat',
    header: 'Current TAT',
    cell: ({ row }) => {
      const tatValue = row.original.current_tat;
      let formattedDate = '';

      try {
        // Handle Date object
        if (tatValue instanceof Date) {
          formattedDate = tatValue.toLocaleDateString();
        }
        // Handle Firestore Timestamp
        else if (tatValue && typeof tatValue === 'object' && 'seconds' in tatValue) {
          const timestamp = tatValue as { seconds: number; nanoseconds: number };
          formattedDate = new Date(timestamp.seconds * 1000).toLocaleDateString();
        }
        // Handle string date format
        else if (typeof tatValue === 'string') {
          formattedDate = new Date(tatValue).toLocaleDateString();
        }
      } catch (error) {
        console.error('Error formatting TAT date:', error);
        formattedDate = 'Invalid Date';
      }

      return <div className="text-left">{formattedDate}</div>;
    },
  },
  {
    accessorKey: 'rateCard.preferance',
    header: 'Rate Preference',
  },
  {
    accessorKey: 'rateCard.pricePerPref',
    header: 'Price',
    cell: ({ row }) => {
      const rateCard = row.original.rateCard;
      return <div className="text-left font-medium">₹ {rateCard.pricePerPref}</div>;
    },
  },
  {
    accessorKey: 'rateCard.minPriceWeight',
    header: 'Min Price (By Weight)',
    cell: ({ row }) => {
      const rateCard = row.original.rateCard;
      const minWeight = rateCard.minPriceWeight;

      if (minWeight === 'NA') {
        return <div className="text-left font-medium">NA</div>;
      }
      return typeof minWeight === 'number' ? (
        <div className="text-left font-medium">₹ {minWeight}</div>
      ) : (
        <div className="text-left font-medium">N/A</div>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: () => <div className="text-center">Actions</div>,
    id: 'actions',
    cell: ActionCell,
  },
];
