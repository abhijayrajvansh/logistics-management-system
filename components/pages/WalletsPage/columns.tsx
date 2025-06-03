import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Wallet } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import { UpdateWalletForm } from './update-wallet';
import { DeleteWalletDialog } from './delete-wallet';

// Create a component for the actions cell to manage edit dialog state
const ActionCell = ({ row }: { row: any }) => {
  const wallet = row.original;
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

      {/* Edit Wallet Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Wallet</DialogTitle>
            <DialogDescription>
              Update the wallet details below. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          <UpdateWalletForm
            walletId={wallet.id}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Wallet Dialog */}
      <DeleteWalletDialog
        walletId={wallet.id}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};

export const columns: ColumnDef<Wallet>[] = [
  {
    accessorKey: 'userId',
    header: 'User ID',
  },
  {
    accessorKey: 'available_balance',
    header: 'Available Balance',
    cell: ({ row }) => {
      const balance: number = row.getValue('available_balance');
      return (
        <div className="font-mono">
          ₹{balance.toFixed(2)}
        </div>
      );
    },
  },
  {
    accessorKey: 'transactions',
    header: 'Transactions',
    cell: ({ row }) => {
      const transactions = row.getValue('transactions') as any[];
      return (
        <div>
          {transactions.length} transactions
        </div>
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