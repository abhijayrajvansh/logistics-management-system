'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { Driver, DriversRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ProofCell } from './ProofCell';
import { PermissionGate } from '@/components/PermissionGate';

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
        const driver = drivers.find((d) => d.id === driverId);
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
        const startDateValue = row.getValue('startDate');

        // Handle different date formats that might come from Firestore
        let formattedDate = '';

        if (startDateValue) {
          try {
            // Handle if it's a Date object
            if (startDateValue instanceof Date) {
              formattedDate = startDateValue.toLocaleDateString();
            }
            // Handle string date format
            else if (typeof startDateValue === 'string') {
              formattedDate = new Date(startDateValue).toLocaleDateString();
            }
            // Handle timestamp object
            else if (
              startDateValue &&
              typeof startDateValue === 'object' &&
              'seconds' in startDateValue
            ) {
              formattedDate = new Date(
                (startDateValue.seconds as number) * 1000,
              ).toLocaleDateString();
            }
          } catch (error) {
            console.error('Error formatting TAT date:', error);
          }
        }

        return <div className="text-left">{formattedDate}</div>;
      },
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }) => {
        const endDateValue = row.getValue('endDate');

        // Handle different date formats that might come from Firestore
        let formattedDate = '';

        if (endDateValue) {
          try {
            // Handle if it's a Date object
            if (endDateValue instanceof Date) {
              formattedDate = endDateValue.toLocaleDateString();
            }
            // Handle string date format
            else if (typeof endDateValue === 'string') {
              formattedDate = new Date(endDateValue).toLocaleDateString();
            }
            // Handle timestamp object
            else if (
              endDateValue &&
              typeof endDateValue === 'object' &&
              'seconds' in endDateValue
            ) {
              formattedDate = new Date(
                (endDateValue.seconds as number) * 1000,
              ).toLocaleDateString();
            }
          } catch (error) {
            console.error('Error formatting TAT date:', error);
          }
        }

        return <div className="text-left">{formattedDate}</div>;
      },
    },
    {
      accessorKey: 'proofImageUrl',
      header: 'Proof',
      cell: ({ row }) => {
        const imageUrl = row.getValue('proofImageUrl') as string | undefined;
        return <ProofCell imageUrl={imageUrl} />;
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
        const createdAtValue = row.getValue('createdAt');

        // Handle different date formats that might come from Firestore
        let formattedDate = '';

        if (createdAtValue) {
          try {
            // Handle if it's a Date object
            if (createdAtValue instanceof Date) {
              formattedDate = createdAtValue.toLocaleDateString();
            }
            // Handle string date format
            else if (typeof createdAtValue === 'string') {
              formattedDate = new Date(createdAtValue).toLocaleDateString();
            }
            // Handle timestamp object
            else if (
              createdAtValue &&
              typeof createdAtValue === 'object' &&
              'seconds' in createdAtValue
            ) {
              formattedDate = new Date(
                (createdAtValue.seconds as number) * 1000,
              ).toLocaleDateString();
            }
          } catch (error) {
            console.error('Error formatting TAT date:', error);
          }
        }

        return <div className="text-left">{formattedDate}</div>;
      },
    },
    {
      id: 'actions',
      header: () => (
        <PermissionGate
          features={['FEATURE_REQUESTS_APPROVE', 'FEATURE_REQUESTS_REJECT']}
        >
          <div className="text-center">Actions</div>
        </PermissionGate>
      ),
      cell: ({ row }) => {
        const request = row.original;

        if (request.status === 'pending') {
          return (
            <div className="flex gap-2">
              <PermissionGate feature="FEATURE_REQUESTS_APPROVE">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-green-500 hover:text-green-600"
                  onClick={() => onApprove(request.id)}
                  title="Approve Request"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </PermissionGate>
              <PermissionGate feature="FEATURE_REQUESTS_REJECT">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                  onClick={() => onReject(request.id)}
                  title="Reject Request"
                >
                  <X className="h-4 w-4" />
                </Button>
              </PermissionGate>
            </div>
          );
        }
        return null;
      },
    },
  ];
};
