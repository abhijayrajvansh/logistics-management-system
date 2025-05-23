'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useClients from '@/hooks/useClients';
import { Order } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import DeleteOrderDialog from './delete-order';
import UpdateOrderForm from './update-order';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { FaRegEye } from 'react-icons/fa';

// Create a component for the proof cell to manage dialog state
const ProofCell = ({ row }: { row: any }) => {
  const order = row.original;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Check if proof of delivery is available and has photos
  const hasProofImages =
    order.proof_of_delivery !== 'NA' &&
    typeof order.proof_of_delivery === 'object' &&
    Array.isArray(order.proof_of_delivery.photo) &&
    order.proof_of_delivery.photo.length > 0;

  const handlePrevious = () => {
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : hasProofImages ? order.proof_of_delivery.photo.length - 1 : 0,
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) =>
      hasProofImages && prev < order.proof_of_delivery.photo.length - 1 ? prev + 1 : 0,
    );
  };

  return (
    <div className="text-center">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsDialogOpen(true)}
        disabled={!hasProofImages}
      >
        <FaRegEye />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Proof of Delivery - {order.docket_id}</DialogTitle>
          </DialogHeader>
          {hasProofImages ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative aspect-square w-full ">
                <Image
                  src={order.proof_of_delivery.photo[currentImageIndex]}
                  alt={`Proof of Delivery ${currentImageIndex + 1}`}
                  className="object-contain"
                  fill
                />
              </div>

              {order.proof_of_delivery.photo.length > 1 && (
                <div className="flex items-center justify-between w-full">
                  <Button variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <span>
                    {currentImageIndex + 1} of {order.proof_of_delivery.photo.length}
                  </span>
                  <Button variant="outline" onClick={handleNext}>
                    Next
                  </Button>
                </div>
              )}

              {/* Image thumbnails for quick navigation */}
              {order.proof_of_delivery.photo.length > 1 && (
                <div className="flex overflow-x-auto space-x-2 w-full py-2">
                  {order.proof_of_delivery.photo.map((photo: string, index: number) => (
                    <div
                      key={index}
                      className={`relative h-16 w-16 flex-shrink-0 cursor-pointer border-2 ${
                        currentImageIndex === index ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <Image
                        src={photo}
                        alt={`Thumbnail ${index + 1}`}
                        className="object-cover"
                        fill
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">No proof of delivery images available</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Create a component for payment proof cell to manage dialog state
const PaymentProofCell = ({ row }: { row: any }) => {
  const order = row.original;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if payment proof is available
  const isPaymentProofAvailable =
    order.proof_of_payment &&
    order.proof_of_payment !== 'NA' &&
    typeof order.proof_of_payment === 'object' &&
    order.proof_of_payment.photo;

  return (
    <div className="text-center">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsDialogOpen(true)}
        disabled={!isPaymentProofAvailable}
      >
        <FaRegEye />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proof of Payment - {order.docket_id}</DialogTitle>
          </DialogHeader>
          {isPaymentProofAvailable && (
            <div className="relative aspect-square w-full">
              <Image
                src={order.proof_of_payment.photo}
                alt="Proof of Payment"
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
        order={order} // Pass the full order object
      />
    </div>
  );
};

// Create a component for the minimum weight cell to handle client rate card
const MinWeightCell = ({ row }: { row: any }) => {
  const { clients } = useClients();
  const chargeBasis: string = row.getValue('charge_basis');
  const clientDetails = row.getValue('client_details') as string;
  const client = clients?.find((c: { clientName: string }) => c.clientName === clientDetails);
  const minWeight = client?.rateCard?.minPriceWeight;

  return (
    <div className="text-left font-medium">
      {chargeBasis === 'By Weight' && minWeight && minWeight !== 'NA' ? `${minWeight} kg` : 'NA'}
    </div>
  );
};

export const columns: ColumnDef<Order>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
    header: 'Total Units',
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
      const tat: number = row.getValue('tat');
      return <div className="text-left font-medium">{tat} H</div>;
    },
  },
  {
    accessorKey: 'deadline',
    header: 'Deadline',
    cell: ({ row }) => {
      const deadlineValue = row.getValue('deadline');

      // Handle different date formats that might come from Firestore
      let formattedDate = '';

      if (deadlineValue) {
        try {
          // Handle if it's a Date object
          if (deadlineValue instanceof Date) {
            formattedDate = deadlineValue.toLocaleDateString();
          }
          // Handle string date format
          else if (typeof deadlineValue === 'string') {
            formattedDate = new Date(deadlineValue).toLocaleDateString();
          }
          // Handle timestamp object
          else if (
            deadlineValue &&
            typeof deadlineValue === 'object' &&
            'seconds' in deadlineValue
          ) {
            formattedDate = new Date((deadlineValue.seconds as number) * 1000).toLocaleDateString();
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
    accessorKey: 'minimum_charged_weight',
    header: 'Charged Weight',
    cell: MinWeightCell,
  },
  {
    accessorKey: 'docket_price',
    header: 'Docket Price',
    cell: ({ row }) => {
      const price: number = row.getValue('docket_price');
      return <div className="text-left font-medium">₹ {price}</div>;
    },
  },

  {
    accessorKey: 'calculated_price',
    header: 'Calculated Price',
    cell: ({ row }) => {
      const price: number = row.getValue('calculated_price');
      return <div className="text-left font-medium">₹ {price}</div>;
    },
  },

  {
    accessorKey: 'total_price',
    header: 'Total Price',
    cell: ({ row }) => {
      const price: number = row.getValue('total_price');
      return <div className="text-left font-medium">₹ {price}</div>;
    },
  },

  {
    accessorKey: 'invoice',
    header: 'Payment Terms',
    cell: ({ row }) => {
      const invoice: string = row.getValue('invoice');

      // Define styles based on invoice status
      let styles = '';
      if (invoice === 'paid') {
        styles = 'text-green-700 bg-green-200 border border-green-500 px-3';
      } else if (invoice === 'to pay') {
        styles = 'text-red-700 bg-red-200 border border-red-500 px-3';
      } else if (invoice === 'received') {
        styles = 'text-yellow-700 bg-yellow-200 border border-yellow-500 px-3';
      }

      return (
        <div className={`font-medium ${styles} text-center rounded-lg text-xs px-1`}>{invoice}</div>
      );
    },
  },
  {
    accessorKey: 'payment_mode',
    header: 'Payment Mode',
    cell: ({ row }) => {
      const paymentMode: string = row.getValue('payment_mode');

      // Define styles based on payment mode
      let styles = '';
      if (paymentMode === 'cash') {
        styles = 'text-blue-700 bg-blue-100 border border-blue-500';
      } else if (paymentMode === 'online') {
        styles = 'text-purple-700 bg-purple-100 border border-purple-500';
      } else {
        styles = 'text-gray-700 bg-gray-100 border';
      }

      return (
        <div className={`font-medium ${styles} text-center rounded-lg text-xs`}>{paymentMode}</div>
      );
    },
  },

  {
    accessorKey: 'status',
    header: 'Status',
  },

  {
    accessorKey: 'proof_of_payment',
    header: 'Payment Proof',
    cell: PaymentProofCell,
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
