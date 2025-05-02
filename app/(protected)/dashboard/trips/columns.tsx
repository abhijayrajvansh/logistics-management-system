'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ColumnDef } from '@tanstack/react-table';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import UpdateTripForm from './update-trip';
import DeleteTripDialog from './delete-trip';

// This type is used to define the shape of our data
export type Trip = {
  id: string;        // Firestore document ID
  tripId: string;    // Our custom unique trip ID
  startingPoint: string;
  destination: string;
  driver: string;
  numberOfStops: number;
  startDate: Date;
  truck: string;
  status: string;
};

// Create a component for the actions cell to manage edit dialog state
const ActionCell = ({ row }: { row: any }) => {
  const trip = row.original;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleUpdateSuccess = () => {
    setIsEditDialogOpen(false);
    // Refresh the page to show updated data
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleDeleteSuccess = () => {
    // Refresh the page to show updated data
    setTimeout(() => {
      window.location.reload();
    }, 1000);
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

      {/* Edit Trip Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>
              Update the trip details below. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          <UpdateTripForm
            tripId={trip.tripId}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Trip Dialog */}
      <DeleteTripDialog
        tripId={trip.tripId}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export const columns: ColumnDef<Trip>[] = [
  {
    accessorKey: 'tripId',
    header: 'Trip ID',
  },
  {
    accessorKey: 'startingPoint',
    header: 'Starting Point',
  },
  {
    accessorKey: 'destination',
    header: 'Destination',
  },
  {
    accessorKey: 'driver',
    header: 'Driver',
  },
  {
    accessorKey: 'numberOfStops',
    header: 'Number of Stops',
    cell: ({ row }) => {
      const count: number = row.getValue('numberOfStops');
      return <div className="text-left font-medium">{count}</div>;
    },
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
    cell: ({ row }) => {
      const startDateValue = row.getValue('startDate');

      // Handle different date formats that might come from Firestore
      let formattedDate = '';

      if (startDateValue) {
        try {
          // Handle if it's a Date object
          if (startDateValue instanceof Date) {
            formattedDate = startDateValue.toLocaleDateString();
          }
          // Handle string date format
          else if (typeof startDateValue === 'string') {
            formattedDate = new Date(startDateValue).toLocaleDateString();
          }
          // Handle timestamp object
          else if (
            startDateValue &&
            typeof startDateValue === 'object' &&
            'seconds' in startDateValue
          ) {
            formattedDate = new Date(
              (startDateValue.seconds as number) * 1000,
            ).toLocaleDateString();
          }
        } catch (error) {
          console.error('Error formatting Start Date:', error);
        }
      }

      return <div className="text-left">{formattedDate}</div>;
    },
  },
  {
    accessorKey: 'truck',
    header: 'Truck',
  },
  {
    accessorKey: 'actions',
    header: () => <div className="text-center">Actions</div>,
    id: 'actions',
    cell: ActionCell,
  },
];

export default columns;
