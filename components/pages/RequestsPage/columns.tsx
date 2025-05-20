'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { Driver, DriversRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

type RequestColumnsProps = {
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  drivers: Driver[];
};

export const columns = ({
  onApprove,
  onReject,
  drivers,
}: RequestColumnsProps): ColumnDef<DriversRequest>[] => {
  return [
    {
      accessorKey: 'id',
      header: 'Request ID',
    },
    {
      accessorKey: 'driverId',
      header: 'Driver',
      cell: ({ row }) => {
        const driverId = row.getValue('driverId') as string;
        const driver = drivers.find((d) => d.driverId === driverId);
        return driver?.driverName || 'Unknown Driver';
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as DriversRequest['type'];
        return (
          <Badge variant="outline" className="capitalize">
            {type}
          </Badge>
        );
      },
        },
        {
      accessorKey: 'reason',
      header: 'Reason',
        },
        {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => {
        const date = row.getValue('startDate') as string;
        return date ? date.split('T')[0] : 'N/A';
      },
        },
        {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }) => {
        const date = row.getValue('endDate') as string;
        return date ? date.split('T')[0] : 'N/A';
      },
      // cell: ({ row }) => {
      //   const date = row.getValue('endDate') as Date;
      //   return date ? date.toLocaleDateString() : 'N/A';
      // },
    },
    {
      accessorKey: 'proofImageUrl',
      header: 'Proof',
      cell: ({ row }) => {
        const imageUrl = row.getValue('proofImageUrl') as string | undefined;
        if (!imageUrl) return 'No proof provided';
        return (
          <Image
            src={imageUrl}
            alt="Proof"
            width={50}
            height={50}
            className="rounded-md object-cover"
          />
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as DriversRequest['status'];
        return (
          <Badge
            variant={
              status === 'pending' ? 'outline' : status === 'approved' ? 'default' : 'destructive'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return date ? date.split('T')[0] : 'N/A';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const request = row.original;

        if (request.status === 'pending') {
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-green-500 hover:text-green-600"
                onClick={() => onApprove(request.id)}
                title="Approve Request"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                onClick={() => onReject(request.id)}
                title="Reject Request"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        }
        return null;
      },
    },
  ];
};
