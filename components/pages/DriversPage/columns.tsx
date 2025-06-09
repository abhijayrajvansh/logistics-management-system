'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useState, useEffect, useCallback } from 'react';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import { Badge } from '@/components/ui/badge';
import { Driver, ReferredBy } from '@/types';
import { UpdateDriverForm } from './update-driver';
import { DeleteDriverDialog } from './delete-driver';
import { db } from '@/firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import useTrucks from '@/hooks/useTrucks';
import useUsers from '@/hooks/useUsers';
import { ViewDriverDetails } from './ViewDriverDetails';
import { PermissionGate } from '@/components/PermissionGate';

// Create a component for the actions cell to manage edit dialog state
const ActionCell = ({ row, table }: { row: any; table: any }) => {
  const driver = row.original;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSuccess = () => {
    // Close dialogs
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    // Refresh the table data
    table.options.meta?.revalidate?.();
  };

  return (
    <>
      <div className="text-center space-x-2">
        <ViewDriverDetails driver={driver} />
        <PermissionGate feature="FEATURE_DRIVERS_EDIT">
          <button
            className="hover:bg-primary p-1 rounded-lg cursor-pointer border border-primary text-primary hover:text-white"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <MdEdit size={15} />
          </button>
        </PermissionGate>
        <PermissionGate feature="FEATURE_DRIVERS_DELETE">
          <button
            className="hover:bg-red-500 p-1 rounded-lg cursor-pointer border border-red-500 text-red-500 hover:text-white"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <MdDeleteOutline size={15} />
          </button>
        </PermissionGate>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Driver Details</DialogTitle>
            <DialogDescription>
              Make changes to the driver information below. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          <UpdateDriverForm
            driverId={driver.id}
            onSuccess={handleSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteDriverDialog
        driverId={driver.id}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-500';
      case 'On Trip':
        return 'bg-blue-100 text-blue-800 border-blue-500';
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      case 'Suspended':
        return 'bg-red-100 text-red-800 border-red-500';
      case 'Stuck':
        return 'bg-purple-100 text-purple-800 border-purple-500';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };

  return <Badge className={`${getStatusColor(status)} border px-2 py-1`}>{status}</Badge>;
};

// Add PasswordCell component
const PasswordCell = ({ driverId }: { driverId: string }) => {
  const [password, setPassword] = useState<string>('Loading...');

  const fetchPassword = useCallback(async () => {
    try {
      const userDocRef = doc(db, 'users', driverId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setPassword(userData.password);
      } else {
        setPassword('Not found');
      }
    } catch (error) {
      console.error('Error fetching password:', error);
      setPassword('Error');
    }
  }, [driverId]);

  useEffect(() => {
    fetchPassword();
  }, [fetchPassword]);

  return <span className="text-sm text-gray-500">{password}</span>;
};

// Add TruckCell component before the columns definition
const TruckCell = ({ truckId }: { truckId: string }) => {
  const { trucks } = useTrucks();

  if (truckId === 'NA') return <span>Not Assigned</span>;

  const truck = trucks.find((t) => t.id === truckId);
  return <span>{truck ? truck.regNumber : truckId}</span>;
};

// Add ReferrerCell component before columns definition
const ReferrerCell = ({ referral }: { referral: ReferredBy | 'NA' }) => {
  const { users } = useUsers();

  if (referral === 'NA') {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800">
        Self
      </Badge>
    );
  }

  const referrer = users.find((user) => user.userId === referral?.userId);
  return (
    <Badge variant="default" className="bg-gray-100 text-gray-800">
      {referrer?.displayName || 'Self'}
    </Badge>
  );
};

// Add DateCell component for formatting the date
const DateCell = ({ date }: { date: any }) => {
  if (date === 'NA') return <span className="text-gray-500">Not Available</span>;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Not Available';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return <span>{formatDate(date)}</span>;
};

export const columns: ColumnDef<Driver>[] = [
  {
    accessorKey: 'driverId',
    header: 'Driver ID',
  },
  {
    accessorKey: 'password',
    header: 'Password',
    cell: ({ row }) => {
      const driverId: string = row.original.id;
      return <PasswordCell driverId={driverId} />;
    },
  },
  {
    accessorKey: 'driverName',
    header: 'Name',
  },
  {
    accessorKey: 'assignedTruckId',
    header: 'Assigned Truck',
    cell: ({ row }) => {
      const truckId = row.getValue('assignedTruckId') as string;
      return <TruckCell truckId={truckId} />;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status: string = row.getValue('status');
      return <StatusBadge status={status} />;
    },
  },
  {
    accessorKey: 'languages',
    header: 'Languages',
    cell: ({ row }) => {
      const languages: string[] = row.getValue('languages') || [];
      return (
        <div className="flex gap-1">
          {languages.map((lang, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {lang}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Phone',
  },
  {
    accessorKey: 'wheelsCapability',
    header: 'Segment',
    cell: ({ row }) => {
      const wheels = row.getValue('wheelsCapability');

      // Return early for NA or undefined cases
      if (!wheels || wheels === 'NA') {
        return <span>Not Specified</span>;
      }

      // Ensure we're working with an array
      const wheelsArray = Array.isArray(wheels) ? wheels : [];

      return (
        <div className="flex flex-wrap gap-1">
          {wheelsArray.map((wheel, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {wheel} Wheeler
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: 'emergencyContact',
    header: 'Emergency Contact',
    cell: ({ row }) => {
      const contact = row.getValue('emergencyContact');
      return (
        <Badge
          variant="outline"
          className={contact === 'NA' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
        >
          {contact === 'NA' ? 'Not Found' : 'Provided'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'referredBy',
    header: 'Referred By',
    cell: ({ row }) => {
      const referral = row.getValue('referredBy') as ReferredBy | 'NA';
      return <ReferrerCell referral={referral} />;
    },
  },
  {
    accessorKey: 'driverDocuments',
    header: () => (
      <PermissionGate feature="FEATURE_DRIVERS_DOCUMENTS_VIEW" fallback={null}>
        <div>Documents Status</div>
      </PermissionGate>
    ),
    cell: ({ row }) => (
      <PermissionGate feature="FEATURE_DRIVERS_DOCUMENTS_VIEW" fallback={null}>
        {(() => {
          const docs = (row.getValue('driverDocuments') as Driver['driverDocuments']) || 'NA';
          const status = docs === 'NA' ? 'Pending' : docs.status;
          return (
            <Badge
              variant="outline"
              className={`text-xs ${
                status === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {status}
            </Badge>
          );
        })()}
      </PermissionGate>
    ),
  },
  {
    accessorKey: 'date_of_joining',
    header: 'Joining Date',
    cell: ({ row }) => {
      const date = row.getValue('date_of_joining');
      return <DateCell date={date} />;
    },
  },
  {
    accessorKey: 'actions',
    header: () => <div className="text-center">Actions</div>,
    id: 'actions',
    cell: ActionCell,
    meta: {
      className: 'text-center',
    },
  },
];
