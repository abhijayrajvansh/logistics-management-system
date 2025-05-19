'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { Driver, DriversRequest } from '@/types';
import { Badge } from '@/components/ui/badge';

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
        return <Badge variant="outline">{type}</Badge>;
      },
    },
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as DriversRequest['status'];
        return (
          <Badge
            variant={
              status === 'Pending' ? 'outline' : status === 'Approve' ? 'default' : 'destructive'
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
        return new Date(row.getValue('createdAt')).toLocaleDateString();
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const request = row.original;

        if (request.status === 'Pending') {
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-green-500 hover:text-green-600"
                onClick={() => onApprove(request.id)}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                onClick={() => onReject(request.id)}
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
