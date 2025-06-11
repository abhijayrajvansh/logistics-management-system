import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Center } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import { UpdateCenterForm } from './update-center';
import { DeleteCenterDialog } from './delete-center';
import { PermissionGate } from '@/components/PermissionGate';

// Create a component for the actions cell to manage edit dialog state
const ActionCell = ({ row }: { row: any }) => {
  const center = row.original;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleUpdateSuccess = () => {
    setIsEditDialogOpen(false);
  };

  return (
    <div className="text-center space-x-2">
      <PermissionGate feature="FEATURE_CENTERS_EDIT" fallback={null}>
        <button
          className="hover:bg-primary p-1 rounded-lg cursor-pointer border border-primary text-primary hover:text-white"
          onClick={() => setIsEditDialogOpen(true)}
        >
          <MdEdit size={15} />
        </button>
      </PermissionGate>

      <PermissionGate feature="FEATURE_CENTERS_DELETE" fallback={null}>
        <button
          className="hover:bg-red-500 p-1 rounded-lg cursor-pointer border border-red-500 text-red-500 hover:text-white"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <MdDeleteOutline size={15} />
        </button>
      </PermissionGate>

      {/* Edit Center Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Center</DialogTitle>
            <DialogDescription>
              Update the center details below. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          <UpdateCenterForm
            centerId={center.id}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Center Dialog */}
      <DeleteCenterDialog
        centerId={center.id}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};

export const columns: ColumnDef<Center>[] = [
  {
    accessorKey: 'name',
    header: 'Center Name',
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => {
      const location: string = row.getValue('location');
      return (
        <div className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[300px]">
          {location}
        </div>
      );
    },
  },
  {
    accessorKey: 'pincode',
    header: 'Pincode',
  },
  {
    accessorKey: 'actions',
    header: () => (
      <PermissionGate features={['FEATURE_CENTERS_EDIT', 'FEATURE_CENTERS_DELETE']} fallback={null}>
        <div className="text-center">Actions</div>
      </PermissionGate>
    ),
    id: 'actions',
    cell: ActionCell,
  },
];
