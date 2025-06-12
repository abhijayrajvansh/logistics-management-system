'use client';

import { PermissionGate } from '@/components/PermissionGate';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatFirestoreDate } from '@/lib/fomatTimestampToDate';
import { Tyre } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { FaClock } from 'react-icons/fa6';
import { MdDeleteOutline, MdEdit, MdRemoveRedEye } from 'react-icons/md';
import DeleteTyreDialog from './delete-tyre';
import UpdateTyreForm from './update-tyre';
import ViewTyreDetails from './ViewTyreDeatails';

// ServiceHistoryDialog component
const ServiceHistoryDialog = ({
  isOpen,
  onClose,
  serviceHistory,
}: {
  isOpen: boolean;
  onClose: () => void;
  serviceHistory: any[] | 'NA' | undefined;
}) => {
  if (!serviceHistory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Service History</DialogTitle>
          <DialogDescription>View all service records for this tyre.</DialogDescription>
        </DialogHeader>

        {serviceHistory === 'NA' ||
        !Array.isArray(serviceHistory) ||
        serviceHistory.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No service history available.
          </div>
        ) : (
          <div className="space-y-4">
            {serviceHistory.map((record, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="font-medium">{formatFirestoreDate(record.timestamp)}</div>
                <div className="text-sm text-muted-foreground">{record.serviceType}</div>
                <div className="text-sm font-medium">Amount: ₹{record.amount}</div>
                {record.notes && (
                  <div className="text-sm text-muted-foreground">Notes: {record.notes}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Create a component for the actions cell to manage dialog states
const ActionCell = ({ row }: { row: any }) => {
  const tyre = row.original;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

  const handleUpdateSuccess = () => {
    setIsEditDialogOpen(false);
  };

  // Check if tyre has service history
  const hasServiceHistory =
    tyre.history &&
    tyre.history !== 'NA' &&
    Array.isArray(tyre.history) &&
    tyre.history.some(
      (entry: any) =>
        entry.type === 'onTrip' &&
        entry.service &&
        entry.service !== 'NA' &&
        Array.isArray(entry.service) &&
        entry.service.length > 0,
    );

  // Extract service history from tyre history
  const serviceHistory = hasServiceHistory
    ? tyre.history
        .filter((entry: any) => entry.type === 'onTrip' && entry.service && entry.service !== 'NA')
        .flatMap((entry: any) => entry.service)
    : [];

  return (
    <div className="flex items-center gap-2">
      <div className='w-full items-center flex justify-center gap-2'>
        <PermissionGate feature="FEATURE_TYRES_VIEW_DETAILS">
        <button
          className="hover:bg-primary p-1 rounded-lg cursor-pointer border border-primary text-primary hover:text-white"
          onClick={() => setIsViewDetailsOpen(true)}
          title="View Details"
        >
          <MdRemoveRedEye size={15} />
        </button>
      </PermissionGate>
      <PermissionGate feature="FEATURE_TYRES_EDIT">
        <button
          className="hover:bg-primary p-1 rounded-lg cursor-pointer border border-primary text-primary hover:text-white"
          onClick={() => setIsEditDialogOpen(true)}
          title="Edit Tyre"
        >
          <MdEdit size={15} />
        </button>
      </PermissionGate>
      <PermissionGate feature="FEATURE_TYRES_SERVICE_HISTORY">
        <button
          className={`p-1 rounded-lg cursor-pointer border ${
            hasServiceHistory
              ? 'hover:bg-blue-500 border-blue-500 text-blue-500 hover:text-white'
              : 'border-gray-300 text-gray-300 cursor-not-allowed'
          }`}
          onClick={() => hasServiceHistory && setIsServiceDialogOpen(true)}
          title={hasServiceHistory ? 'View Service History' : 'No service history available'}
          disabled={!hasServiceHistory}
        >
          <FaClock size={15} />
        </button>
      </PermissionGate>
      <PermissionGate feature="FEATURE_TYRES_DELETE">
        <button
          className="hover:bg-red-500 p-1 rounded-lg cursor-pointer border border-red-500 text-red-500 hover:text-white"
          onClick={() => setIsDeleteDialogOpen(true)}
          title="Delete Tyre"
        >
          <MdDeleteOutline size={15} />
        </button>
      </PermissionGate>

      </div>
      {/* View Details Dialog */}
      <PermissionGate feature="FEATURE_TYRES_VIEW_DETAILS">
        <ViewTyreDetails
          isOpen={isViewDetailsOpen}
          onClose={() => setIsViewDetailsOpen(false)}
          tyre={tyre}
        />
      </PermissionGate>

      {/* Edit Tyre Dialog */}
      <PermissionGate feature="FEATURE_TYRES_EDIT">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Tyre</DialogTitle>
              <DialogDescription>
                Update the tyre details below. Click update when you're done.
              </DialogDescription>
            </DialogHeader>
            <UpdateTyreForm
              tyreId={tyre.id}
              onSuccess={handleUpdateSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </PermissionGate>

      {/* Delete Tyre Dialog */}
      <PermissionGate feature="FEATURE_TYRES_DELETE">
        <DeleteTyreDialog
          tyreId={tyre.id}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
        />
      </PermissionGate>

      {/* Service History Dialog */}
      {hasServiceHistory && (
        <PermissionGate feature="FEATURE_TYRES_SERVICE_HISTORY">
          <ServiceHistoryDialog
            isOpen={isServiceDialogOpen}
            onClose={() => setIsServiceDialogOpen(false)}
            serviceHistory={serviceHistory}
          />
        </PermissionGate>
      )}
    </div>
  );
};

export const columns: ColumnDef<Tyre>[] = [
  {
    accessorKey: 'company',
    header: 'Company',
  },
  {
    accessorKey: 'size',
    header: 'Size',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status: string = row.getValue('status');
      const statusColors = {
        ACTIVE: 'bg-green-200 text-green-800 border-green-500',
        RETIRED: 'bg-red-200 text-red-800 border-red-500',
        UNDER_RETRADING: 'bg-yellow-200 text-yellow-800 border-yellow-500',
        READY_TO_USE: 'bg-blue-200 text-blue-800 border-blue-500',
      };

      return (
        <Badge
          variant="default"
          className={`${statusColors[status as keyof typeof statusColors] || 'bg-gray-200 text-gray-800 border-gray-500'}`}
        >
          {status.replace(/_/g, ' ')}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'currentPosition',
    header: 'Current Position',
    cell: ({ row }) => {
      const currentPosition = row.getValue('currentPosition') as any;
      if (!currentPosition || currentPosition === 'NA') {
        return <span className="text-muted-foreground">Not mounted</span>;
      }
      return (
        <div className="text-sm">
          <div className="font-medium">{currentPosition.truckNumber}</div>
          <div className="text-muted-foreground">{currentPosition.position}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'purchaseDate',
    header: 'Purchase Date',
    cell: ({ row }) => {
      const purchaseDate: Date = row.getValue('purchaseDate');
      return (
        <div className="text-left font-medium">
          {purchaseDate ? purchaseDate.toLocaleDateString() : 'N/A'}
        </div>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: () => (
      <PermissionGate
        features={[
          'FEATURE_TYRES_VIEW_DETAILS',
          'FEATURE_TYRES_EDIT',
          'FEATURE_TYRES_DELETE',
          'FEATURE_TYRES_SERVICE_HISTORY',
        ]}
      >
        <div className="text-center">Actions</div>
      </PermissionGate>
    ),
    id: 'actions',
    cell: ActionCell,
  },
];
