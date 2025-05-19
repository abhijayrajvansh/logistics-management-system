'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { Request } from '@/types';
import { Badge } from '@/components/ui/badge';

type RequestColumnsProps = {
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
};

export const columns = ({ onApprove, onReject }: RequestColumnsProps): ColumnDef<Request>[] => [
  {
    accessorKey: 'id',
    header: 'Request ID',
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as Request['type'];
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
      const status = row.getValue('status') as Request['status'];
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
