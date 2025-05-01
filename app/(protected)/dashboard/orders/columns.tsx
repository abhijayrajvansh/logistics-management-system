'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MdEdit } from 'react-icons/md';
import { FaRegEye } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { MdDeleteOutline } from 'react-icons/md';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import UpdateOrderForm from './update-order';
import DeleteOrderDialog from './delete-order';

// This type is used to define the shape of our data based on the image schema
export type Order = {
  id: string;
  shipper_details: string;
  receiver_details: string;
  total_boxes_count: number;
  packing_type: string;
  dimensions: string;
  total_order_weight: number;
  lr_no: string;
  eway_bill_no: string;
  tat: Date;
  charge_basis: string; // Enum type
  docket_id: string;
  current_location: string;
  client_details: string;
  price: string | number;
  invoice: string;
  status: string;
};

// Create a component for the actions cell to manage edit dialog state
const ActionCell = ({ row }: { row: any }) => {
  const order = row.original;
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
      {/* <button className="hover:bg-gray-800 p-1 rounded-lg cursor-pointer border border-gray-500 hover:text-white">
        <FaRegEye size={15} />
      </button> */}
      <button
        className="hover:bg-red-500 p-1 rounded-lg cursor-pointer border border-red-500 text-red-500 hover:text-white"
        onClick={() => setIsDeleteDialogOpen(true)}
      >
        <MdDeleteOutline size={15} />
      </button>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Update the order details below. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          <UpdateOrderForm
            orderId={order.id}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Order Dialog */}
      <DeleteOrderDialog
        orderId={order.id}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'docket_id',
    header: 'Docket ID',
  },
  {
    accessorKey: 'client_details',
    header: 'Client',
  },
  {
    accessorKey: 'shipper_details',
    header: 'Shipper Details',
  },
  {
    accessorKey: 'receiver_details',
    header: 'Receiver Details',
  },
  {
    accessorKey: 'total_boxes_count',
    header: 'Total Boxes',
    cell: ({ row }) => {
      const count: number = row.getValue('total_boxes_count');
      return <div className="text-left font-medium">{count}</div>;
    },
  },
  {
    accessorKey: 'packing_type',
    header: 'Packing Type',
  },
  {
    accessorKey: 'dimensions',
    header: 'Dimensions',
  },
  {
    accessorKey: 'total_order_weight',
    header: 'Total Weight',
    cell: ({ row }) => {
      const weight: string = row.getValue('total_order_weight');
      return <div className="text-left font-medium">{weight} kg</div>;
    },
  },
  {
    accessorKey: 'lr_no',
    header: 'LR No',
  },
  {
    accessorKey: 'eway_bill_no',
    header: 'E-way Bill No',
  },
  {
    accessorKey: 'tat',
    header: 'TAT',
    cell: ({ row }) => {
      const tatValue = row.getValue('tat');

      // Handle different date formats that might come from Firestore
      let formattedDate = '';

      if (tatValue) {
        try {
          // Handle if it's a Date object
          if (tatValue instanceof Date) {
            formattedDate = tatValue.toLocaleDateString();
          }
          // Handle string date format
          else if (typeof tatValue === 'string') {
            formattedDate = new Date(tatValue).toLocaleDateString();
          }
          // Handle timestamp object
          else if (tatValue && typeof tatValue === 'object' && 'seconds' in tatValue) {
            formattedDate = new Date((tatValue.seconds as number) * 1000).toLocaleDateString();
          }
        } catch (error) {
          console.error('Error formatting TAT date:', error);
        }
      }

      return <div className="text-left">{formattedDate}</div>;
    },
  },
  {
    accessorKey: 'charge_basis',
    header: 'Charge Basis',
  },

  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const price: string = row.getValue('price');
      return <div className="text-left font-medium">₹ {price}</div>;
    },
  },

  {
    accessorKey: 'invoice',
    header: 'Invoice',
    cell: ({ row }) => {
      const invoice: string = row.getValue('invoice');
      return (
        <div className={`font-medium ${invoice === 'paid' ? 'text-green-700 bg-green-200 border text-center rounded-lg text-xs border-green-500 px-1' : 'text-red-700 bg-red-200 border text-center rounded-lg border-red-500 px-1 text-xs'}`}>
          {invoice}
        </div>
      );
    },
  },

  {
    accessorKey: 'status',
    header: 'Status',
  },

  {
    accessorKey: 'actions',
    header: () => <div className="text-center">Actions</div>,
    id: 'actions',
    cell: ActionCell,
  },
];
