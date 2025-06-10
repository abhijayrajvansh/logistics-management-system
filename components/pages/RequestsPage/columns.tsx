'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { DriversRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ProofCell } from './ProofCell';
import { PermissionGate } from '@/components/PermissionGate';

type RequestColumnsProps = {
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
};

// Enhanced request type with driver and trip details
type EnhancedRequest = DriversRequest & {
  driverDetails?: {
    driverName: string;
    driverId: string;
  } | null;
  tripDetails?: {
    tripId: string;
    destination: string;
    startingPoint: string;
  } | null;
};

// Helper function to format dates consistently
const formatDate = (dateValue: any): string => {
  if (!dateValue) return 'N/A';

  try {
    // Handle Firestore Timestamp
    if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
      return dateValue.toDate().toLocaleDateString();
    }
    // Handle regular Date object
    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString();
    }
    // Handle string date
    if (typeof dateValue === 'string') {
      return new Date(dateValue).toLocaleDateString();
    }
    // Handle timestamp with seconds
    if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      return new Date(dateValue.seconds * 1000).toLocaleDateString();
    }
  } catch (error) {
    console.error('Error formatting date:', error);
  }

  return 'Invalid Date';
};

export const columns = ({
  onApprove,
  onReject,
}: RequestColumnsProps): ColumnDef<EnhancedRequest>[] => {
  return [
    {
      accessorKey: 'id',
      header: 'Request ID',
    },
    {
      accessorKey: 'driverId',
      header: 'Driver',
      cell: ({ row }) => {
        const request = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium">
              {request.driverDetails?.driverName || 'Unknown Driver'}
            </div>
            <div className="text-xs text-muted-foreground">ID: {request.driverId}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'tripId',
      header: 'Trip Info',
      cell: ({ row }) => {
        const request = row.original;
        if (!request.tripDetails) {
          return <span className="text-muted-foreground text-xs">No trip data</span>;
        }
        return (
          <div className="space-y-1">
            <div className="text-xs font-medium">
              {request.tripDetails.startingPoint} → {request.tripDetails.destination}
            </div>
            <div className="text-xs text-muted-foreground">Trip ID: {request.tripId}</div>
          </div>
        );
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
        return <div className="text-left">{formatDate(startDateValue)}</div>;
      },
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }) => {
        const endDateValue = row.getValue('endDate');
        return <div className="text-left">{formatDate(endDateValue)}</div>;
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
        return <div className="text-left">{formatDate(createdAtValue)}</div>;
      },
    },
    {
      id: 'actions',
      header: () => (
        <PermissionGate features={['FEATURE_REQUESTS_APPROVE', 'FEATURE_REQUESTS_REJECT']}>
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
