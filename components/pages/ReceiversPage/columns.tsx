'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PermissionGate } from '@/components/PermissionGate';
import { useFeatureAccess } from '@/app/context/PermissionsContext';
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
      <PermissionGate feature="FEATURE_RECEIVERS_EDIT">
        <button
          className="hover:bg-primary p-1 rounded-lg cursor-pointer border border-primary text-primary hover:text-white"
          onClick={() => setIsEditDialogOpen(true)}
        >
          <MdEdit size={15} />
        </button>
      </PermissionGate>

      <PermissionGate feature="FEATURE_RECEIVERS_DELETE">
        <button
          className="hover:bg-red-500 p-1 rounded-lg cursor-pointer border border-red-500 text-red-500 hover:text-white"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <MdDeleteOutline size={15} />
        </button>
      </PermissionGate>

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

// Component for conditional Actions header
const ActionsHeader = () => {
  const { can } = useFeatureAccess();
  const hasEditPermission = can('FEATURE_RECEIVERS_EDIT');
  const hasDeletePermission = can('FEATURE_RECEIVERS_DELETE');

  // Only show Actions header if user has either edit or delete permissions
  if (hasEditPermission || hasDeletePermission) {
    return <div className="text-center">Actions</div>;
  }

  return null;
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
    accessorKey: 'receiverCity',
    header: 'City',
  },
  {
    accessorKey: 'receiverZone',
    header: 'Zone',
  },
  {
    accessorKey: 'receiverDetails',
    header: 'Details',
    cell: ({ row }) => {
      const details: string = row.getValue('receiverDetails');
      return (
        <div className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[300px]">
          {details}
        </div>
      );
    },
  },
  {
    accessorKey: 'receiverContact',
    header: 'Contact',
  },
  {
    accessorKey: 'pincode',
    header: 'Pincode',
  },
  {
    accessorKey: 'actions',
    header: ActionsHeader,
    id: 'actions',
    cell: ActionCell,
  },
];
