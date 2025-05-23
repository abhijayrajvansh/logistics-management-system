'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Truck } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import DeleteTruckDialog from './delete-truck';
import UpdateTruckForm from './update-truck';
import { Button } from '@/components/ui/button';

// Create a component for the actions cell to manage edit dialog state
const ActionCell = ({ row }: { row: any }) => {
  const truck = row.original;
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

      {/* Edit Truck Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Truck</DialogTitle>
            <DialogDescription>
              Update the truck details below. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          <UpdateTruckForm
            truckId={truck.id}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Truck Dialog */}
      <DeleteTruckDialog
        truckId={truck.id}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};

export const columns: ColumnDef<Truck>[] = [
  {
    accessorKey: 'regNumber',
    header: 'Reg Number',
  },
  {
    accessorKey: 'axleConfig',
    header: 'Axle Config',
  },
  {
    accessorKey: 'ownership',
    header: 'Ownership',
    cell: ({ row }) => {
      const ownership: string = row.getValue('ownership');
      return (
        <div className='flex justify-start items-center w-full'>
          <div
          className={`font-medium px-3 ${
            ownership === 'Owned'
              ? 'text-green-700 bg-green-200 border text-center rounded-lg text-xs border-green-500 px-1'
              : 'text-blue-700 bg-blue-200 border text-center rounded-lg border-blue-500 px-1 text-xs'
          }`}
        >
          {ownership}
        </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'emiAmount',
    header: 'EMI Amount',
    cell: ({ row }) => {
      const emiAmount: number = row.getValue('emiAmount');
      const ownership: string = row.getValue('ownership');

      return (
        <div className="text-left font-medium">
          {ownership === 'OnLoan' ? `₹ ${emiAmount}` : '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'insuranceExpiry',
    header: 'Insurance Expiry',
    cell: ({ row }) => {
      const insuranceValue = row.getValue('insuranceExpiry');

      // Handle different date formats that might come from Firestore
      let formattedDate = '';

      if (insuranceValue) {
        try {
          // Handle if it's a Date object
          if (insuranceValue instanceof Date) {
            formattedDate = insuranceValue.toLocaleDateString();
          }
          // Handle string date format
          else if (typeof insuranceValue === 'string') {
            formattedDate = new Date(insuranceValue).toLocaleDateString();
          }
          // Handle timestamp object
          else if (
            insuranceValue &&
            typeof insuranceValue === 'object' &&
            'seconds' in insuranceValue
          ) {
            formattedDate = new Date(
              (insuranceValue.seconds as number) * 1000,
            ).toLocaleDateString();
          }
        } catch (error) {
          console.error('Error formatting insurance date:', error);
        }
      }

      // Calculate if the insurance is expiring soon (within 30 days)
      let isExpiringSoon = false;
      try {
        const today = new Date();
        const expiryDate = new Date(formattedDate);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isExpiringSoon = diffDays <= 30 && diffDays >= 0;
      } catch (error) {
        console.error('Error calculating insurance expiry:', error);
      }

      return (
        <div className={`text-left ${isExpiringSoon ? 'text-orange-500 font-medium' : ''}`}>
          {formattedDate}
        </div>
      );
    },
  },
  {
    accessorKey: 'permitExpiry',
    header: 'Permit Expiry',
    cell: ({ row }) => {
      const permitValue = row.getValue('permitExpiry');

      // Handle different date formats that might come from Firestore
      let formattedDate = '';

      if (permitValue) {
        try {
          // Handle if it's a Date object
          if (permitValue instanceof Date) {
            formattedDate = permitValue.toLocaleDateString();
          }
          // Handle string date format
          else if (typeof permitValue === 'string') {
            formattedDate = new Date(permitValue).toLocaleDateString();
          }
          // Handle timestamp object
          else if (permitValue && typeof permitValue === 'object' && 'seconds' in permitValue) {
            formattedDate = new Date((permitValue.seconds as number) * 1000).toLocaleDateString();
          }
        } catch (error) {
          console.error('Error formatting permit date:', error);
        }
      }

      // Calculate if the permit is expiring soon (within 30 days)
      let isExpiringSoon = false;
      try {
        const today = new Date();
        const expiryDate = new Date(formattedDate);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isExpiringSoon = diffDays <= 30 && diffDays >= 0;
      } catch (error) {
        console.error('Error calculating permit expiry:', error);
      }

      return (
        <div className={`text-left ${isExpiringSoon ? 'text-orange-500 font-medium' : ''}`}>
          {formattedDate}
        </div>
      );
    },
  },
  {
    accessorKey: 'odoCurrent',
    header: 'Current ODO (km)',
    cell: ({ row }) => {
      const odoCurrent: number = row.getValue('odoCurrent');
      return <div className="text-left font-medium">{odoCurrent.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: 'odoAtLastService',
    header: 'ODO at Service (km)',
    cell: ({ row }) => {
      const odoAtLastService: number = row.getValue('odoAtLastService');
      return <div className="text-left font-medium">{odoAtLastService.toLocaleString()}</div>;
    },
  },
  // Uncomment this section if you want to display service status
  // Note: This requires the service status logic to be implemented
  // {
  //   accessorKey: 'serviceStatus',
  //   header: 'Service Due',
  //   cell: ({ row }) => {
  //     const odoCurrent: number = row.getValue('odoCurrent');
  //     const odoAtLastService: number = row.getValue('odoAtLastService');

  //     // Calculate kilometers since last service
  //     const kmSinceService = odoCurrent - odoAtLastService;

  //     // Determine if service is due (assuming service is required every 10,000 km)
  //     const serviceThreshold = 10000;
  //     const isServiceDue = kmSinceService >= serviceThreshold;
  //     const isServiceSoonDue = kmSinceService >= serviceThreshold * 0.8 && !isServiceDue;

  //     return (
  //       <div
  //         className={`text-center font-medium rounded-lg text-xs px-2 py-1 ${
  //           isServiceDue
  //             ? 'bg-red-200 text-red-800 border border-red-500'
  //             : isServiceSoonDue
  //               ? 'bg-orange-200 text-orange-800 border border-orange-500'
  //               : 'bg-green-200 text-green-800 border border-green-500'
  //         }`}
  //       >
  //         {isServiceDue
  //           ? `Due (${kmSinceService.toLocaleString()} km)`
  //           : isServiceSoonDue
  //             ? `Soon (${kmSinceService.toLocaleString()} km)`
  //             : `OK (${kmSinceService.toLocaleString()} km)`}
  //       </div>
  //     );
  //   },
  // },
  {
    accessorKey: 'actions',
    header: () => <div className="text-center">Actions</div>,
    id: 'actions',
    cell: ActionCell,
  },
];
