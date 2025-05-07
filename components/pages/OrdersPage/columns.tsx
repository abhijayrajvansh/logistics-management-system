'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Order } from '@/types'; // Import the Order type from your hooks
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import DeleteOrderDialog from './delete-order';
import UpdateOrderForm from './update-order';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { FaRegEye } from "react-icons/fa";

// This type is used to define the shape of our data based on the image schema

// Create a component for the proof cell to manage dialog state
const ProofCell = ({ row }: { row: any }) => {
  const order = row.original;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className='text-center'>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsDialogOpen(true)}
        disabled={order.proof_of_delivery === 'NA'}
      >
        <FaRegEye />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proof of Delivery - {order.docket_id}</DialogTitle>
          </DialogHeader>
          {order.proof_of_delivery !== 'NA' && (
            <div className="relative aspect-square w-full">
              <Image
                src={order.proof_of_delivery.photo}
                alt="Proof of Delivery"
                className="object-contain"
                fill
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Create a component for the actions cell to manage edit dialog state
const ActionCell = ({ row }: { row: any }) => {
  const order = row.original;
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
            orderId={order.order_id}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Order Dialog */}
      <DeleteOrderDialog
        orderId={order.order_id}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
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
    accessorKey: 'receiver_name',
    header: 'Receiver Name',
  },
  {
    accessorKey: 'receiver_details',
    header: 'Receiver Details',
    cell: ({ row }) => {
      const details: string = row.getValue('receiver_details');
      return (
        <div className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">
          {details}
        </div>
      );
    },
  },
  {
    accessorKey: 'receiver_contact',
    header: 'Receiver Contact',
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
        <div
          className={`font-medium ${invoice === 'paid' ? 'text-green-700 bg-green-200 border text-center rounded-lg text-xs border-green-500 px-1' : 'text-red-700 bg-red-200 border text-center rounded-lg border-red-500 px-1 text-xs'}`}
        >
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
    accessorKey: 'proof_of_delivery',
    header: 'Delivery Proof',
    cell: ProofCell,
  },

  {
    accessorKey: 'actions',
    header: () => <div className="text-center">Actions</div>,
    id: 'actions',
    cell: ActionCell,
  },
];
