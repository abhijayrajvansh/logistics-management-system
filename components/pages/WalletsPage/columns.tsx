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
import { PermissionGate } from '@/components/PermissionGate';
import { useFeatureAccess } from '@/app/context/PermissionsContext';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import { UpdateWalletForm } from './update-wallet';
import { DeleteWalletDialog } from './delete-wallet';
import useUsers from '@/hooks/useUsers';

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
      <PermissionGate feature="FEATURE_WALLETS_EDIT">
        <button
          className="hover:bg-primary p-1 rounded-lg cursor-pointer border border-primary text-primary hover:text-white"
          onClick={() => setIsEditDialogOpen(true)}
        >
          <MdEdit size={15} />
        </button>
      </PermissionGate>

      <PermissionGate feature="FEATURE_WALLETS_DELETE">
        <button
          className="hover:bg-red-500 p-1 rounded-lg cursor-pointer border border-red-500 text-red-500 hover:text-white"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <MdDeleteOutline size={15} />
        </button>
      </PermissionGate>

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

// Component for conditional Actions header
const ActionsHeader = () => {
  const { can } = useFeatureAccess();
  const hasEditPermission = can('FEATURE_WALLETS_EDIT');
  const hasDeletePermission = can('FEATURE_WALLETS_DELETE');

  // Only show Actions header if user has either edit or delete permissions
  if (hasEditPermission || hasDeletePermission) {
    return <div className="text-center">Actions</div>;
  }

  return null;
};

export const columns: ColumnDef<Wallet>[] = [
  {
    accessorKey: 'userId',
    header: 'User ID',
    cell: ({ row }) => {
      const userId: string = row.getValue('userId');
      const { users: userData } = useUsers(userId);
      const username = userData[0]?.displayName;
      return <div className="font-mono">{username}</div>;
    },
  },
  {
    accessorKey: 'available_balance',
    header: 'Available Balance',
    cell: ({ row }) => {
      const balance: number = row.getValue('available_balance');
      return <div className="font-mono">₹{balance.toFixed(2)}</div>;
    },
  },
  {
    accessorKey: 'transactions',
    header: 'Transactions',
    cell: ({ row }) => {
      const transactions = row.getValue('transactions') as any[];
      return <div>{transactions.length} transactions</div>;
    },
  },
  {
    id: 'view-transactions',
    header: () => {
      const { can } = useFeatureAccess();
      return can('FEATURE_WALLETS_TRANSACTIONS_VIEW') ? (
        <div className="text-center">Transaction History</div>
      ) : null;
    },
    cell: ({ row }) => {
      const [isOpen, setIsOpen] = useState(false);
      const wallet = row.original;
      const transactions = wallet.transactions || [];

      return (
        <PermissionGate feature="FEATURE_WALLETS_TRANSACTIONS_VIEW">
          <div className="text-center">
            <button
              onClick={() => setIsOpen(true)}
              className="hover:bg-blue-600 px-2 py-1 rounded-lg cursor-pointer border border-blue-500 text-blue-500 hover:text-white text-sm"
            >
              View All
            </button>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Transaction History</DialogTitle>
                <DialogDescription>
                  {(() => {
                    const { users } = useUsers(row.original.userId);
                    return `All transactions for ${users[0]?.displayName || row.original.userId}`;
                  })()}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4 overflow-auto max-h-[60vh]">
                {transactions.length === 0 ? (
                  <div className="text-center text-gray-500">No transactions found</div>
                ) : (
                  <div className="space-y-3">
                    {transactions
                      .sort((a: any, b: any) => b.date?.seconds - a.date?.seconds)
                      .map((transaction: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span
                              className={`font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {transaction.type === 'credit' ? '+' : ''}
                              {transaction.amount.toFixed(2)} ₹
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(transaction.date.seconds * 1000).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">{transaction.reason}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </PermissionGate>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: ActionsHeader,
    id: 'actions',
    cell: ActionCell,
  },
];
