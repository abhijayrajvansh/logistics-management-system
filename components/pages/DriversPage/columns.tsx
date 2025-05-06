'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import { Badge } from '@/components/ui/badge';
import { Driver } from '@/types';
import { UpdateDriverForm } from './update-driver';
import { DeleteDriverDialog } from './delete-driver';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// Create a component for the actions cell to manage edit dialog state
const ActionCell = ({ row, table }: { row: any; table: any }) => {
  const driver = row.original;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSuccess = () => {
    // Close dialogs
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    // Refresh the table data
    table.options.meta?.revalidate?.();
  };

  return (
    <>
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
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Driver Details</DialogTitle>
            <DialogDescription>
              Make changes to the driver information below. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          <UpdateDriverForm
            driverId={driver.id}
            onSuccess={handleSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteDriverDialog
        driverId={driver.id}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-500';
      case 'OnTrip':
        return 'bg-blue-100 text-blue-800 border-blue-500';
      case 'OnLeave':
        return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      case 'Suspended':
        return 'bg-red-100 text-red-800 border-red-500';
      case 'Stuck':
        return 'bg-purple-100 text-purple-800 border-purple-500';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };

  return <Badge className={`${getStatusColor(status)} border px-2 py-1`}>{status}</Badge>;
};

export const columns: ColumnDef<Driver>[] = [
  {
    accessorKey: 'driverId',
    header: 'Driver ID',
  },
  {
    accessorKey: 'driverName',
    header: 'Name',
  },
  {
    accessorKey: 'driverTruckId',
    header: 'Assigned Truck',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status: string = row.getValue('status');
      return <StatusBadge status={status} />;
    },
  },
  {
    accessorKey: 'languages',
    header: 'Languages',
    cell: ({ row }) => {
      const languages: string[] = row.getValue('languages') || [];
      return (
        <div className="flex gap-1">
          {languages.map((lang, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {lang}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Phone',
  },
  {
    accessorKey: 'driverDocuments',
    header: 'Documents Status',
    cell: ({ row }) => {
      const docs = (row.getValue('driverDocuments') as Driver['driverDocuments']) || undefined;
      const status = docs?.status || 'Pending';
      return (
        <Badge
          variant="outline"
          className={`text-xs ${
            status === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: () => <div className="text-center">Actions</div>,
    id: 'actions',
    cell: ActionCell,
    meta: {
      className: 'text-center',
    },
  },
];
