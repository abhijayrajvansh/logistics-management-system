'use client';

import React, { useState } from 'react';
import { useDrivers } from '@/hooks/useDrivers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ColumnDef } from '@tanstack/react-table';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import UpdateTripForm from './update-trip';
import DeleteTripDialog from './delete-trip';
import { Trip } from '@/types';
import { db } from '@/firebase/database';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Create TypeCell component for handling type updates
const TypeCell = ({ row }: { row: any }) => {
  const trip = row.original;
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'Delivering' | 'Returning'>('Delivering');

  const updateTripType = async (
    newType: string,
    currentStatus?: 'Delivering' | 'Returning' | null,
  ) => {
    setIsUpdating(true);
    try {
      const tripRef = doc(db, 'trips', trip.id);

      // Always include currentStatus in the update
      const updateData = {
        type: newType,
        currentStatus: newType === 'active' ? currentStatus : null,
      };

      await updateDoc(tripRef, updateData);
      toast.success('Trip type updated successfully');
      setShowStatusDialog(false);
    } catch (error) {
      console.error('Error updating trip type:', error);
      toast.error('Failed to update trip type');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTypeChange = async (newType: string) => {
    if (newType === trip.type) return;

    // Validate driver and truck assignment when changing to active
    if (newType === 'active') {
      if (
        !trip.driver ||
        trip.driver === 'Not Assigned' ||
        !trip.truck ||
        trip.truck === 'Not Assigned'
      ) {
        toast.error('Cannot set trip to active: Driver and truck must be assigned first');
        return;
      }
      setShowStatusDialog(true);
    } else {
      await updateTripType(newType);
    }
  };

  return (
    <>
      <Select value={trip.type} onValueChange={handleTypeChange} disabled={isUpdating}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ready to ship">Ready to Ship</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="past">Past</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Trip Status</DialogTitle>
            <DialogDescription>Select the current status for this active trip.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <Select
                value={selectedStatus || ''}
                onValueChange={(value: 'Delivering' | 'Returning') => setSelectedStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select current status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Delivering">Delivering</SelectItem>
                  <SelectItem value="Returning">Returning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateTripType('active', selectedStatus)}
              disabled={!selectedStatus}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Create a component for the actions cell to manage edit dialog state
const ActionCell = ({ row }: { row: any }) => {
  const trip = row.original;
  // console.log({trip})
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
      {trip.type !== 'past' && (
        <button
          className="hover:bg-red-500 p-1 rounded-lg cursor-pointer border border-red-500 text-red-500 hover:text-white"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <MdDeleteOutline size={15} />
        </button>
      )}

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
            tripId={trip.id}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Trip Dialog */}
      {trip.type !== 'past' && (
        <DeleteTripDialog
          tripId={trip.tripId}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
        />
      )}
    </div>
  );
};

// columns definition for the trips table
// exporting headless cols
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
    cell: ({ row }) => {
      const driverId = row.getValue('driver') as string;
      const { drivers } = useDrivers();
      const driver = drivers.find((d) => d.id === driverId);
      return <div className="text-left">{driver?.driverName || driverId}</div>;
    },
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
    accessorKey: 'type',
    header: 'Type',
    cell: TypeCell,
  },
  {
    accessorKey: 'currentStatus',
    header: 'Current Status',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      const status = row.getValue('currentStatus') as string | undefined;
      return type === 'active' ? (
        <div className="text-left">{status || '-'}</div>
      ) : (
        <div className="text-left">-</div>
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

export default columns;
