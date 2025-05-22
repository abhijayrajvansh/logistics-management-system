'use client';

import React, { useState, useEffect } from 'react';
import { useDrivers } from '@/hooks/useDrivers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ColumnDef } from '@tanstack/react-table';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';
import UpdateTripForm from './update-trip';
import DeleteTripDialog from './delete-trip';
import { Trip } from '@/types';
import { db } from '@/firebase/database';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FaArrowRightLong } from 'react-icons/fa6';

// Create TypeCell component for handling type updates
const TypeCell = ({ row }: { row: any }) => {
  const trip = row.original;
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'Delivering' | 'Returning'>('Delivering');

  const updateTripType = async (
    newType: string,
    currentStatus?: 'Delivering' | 'Returning' | null,
  ) => {
    setIsUpdating(true);
    try {
      const tripRef = doc(db, 'trips', trip.id);

      // Always include currentStatus in the update
      const updateData = {
        type: newType,
        currentStatus: newType === 'active' ? currentStatus : null,
      };

      await updateDoc(tripRef, updateData);

      // If the trip is becoming active, update all associated orders
      if (newType === 'active') {
        // Get the trip_orders document
        const tripOrdersRef = doc(db, 'trip_orders', trip.id);
        const tripOrdersDoc = await getDoc(tripOrdersRef);

        if (tripOrdersDoc.exists()) {
          const orderIds = tripOrdersDoc.data().orderIds || [];

          // Update all associated orders to "In Transit" status
          const orderUpdatePromises = orderIds.map((orderId: string) =>
            updateDoc(doc(db, 'orders', orderId), {
              status: 'In Transit',
              updated_at: new Date(),
            }),
          );

          await Promise.all(orderUpdatePromises);
          toast.success(`Updated ${orderIds.length} orders to In Transit status`);
        }
      }

      if (newType === 'ready to ship') {
        // Get the trip_orders document
        const tripOrdersRef = doc(db, 'trip_orders', trip.id);
        const tripOrdersDoc = await getDoc(tripOrdersRef);

        if (tripOrdersDoc.exists()) {
          const orderIds = tripOrdersDoc.data().orderIds || [];

          // Update all associated orders to "Assigned" status
          const orderUpdatePromises = orderIds.map((orderId: string) =>
            updateDoc(doc(db, 'orders', orderId), {
              status: 'Assigned',
              updated_at: new Date(),
            }),
          );

          await Promise.all(orderUpdatePromises);
          toast.success(`Updated ${orderIds.length} orders to Assigned status`);
        }
      }

      if (newType === 'past') {
        // Get the trip_orders document
        const tripOrdersRef = doc(db, 'trip_orders', trip.id);
        const tripOrdersDoc = await getDoc(tripOrdersRef);

        if (tripOrdersDoc.exists()) {
          const orderIds = tripOrdersDoc.data().orderIds || [];

          // Fetch all orders first to check their transfer status
          const orderDocs = await Promise.all(
            orderIds.map((orderId: string) => getDoc(doc(db, 'orders', orderId))),
          );

          // Process each order based on its transfer status
          const orderUpdatePromises = orderDocs.map((orderDoc) => {
            if (!orderDoc.exists()) return null;

            const order = orderDoc.data();
            const orderId = orderDoc.id;

            if (order.to_be_transferred) {
              // For orders being transferred
              return updateDoc(doc(db, 'orders', orderId), {
                status: 'Transferred',
                previous_center_location: order.current_location, // Store current location as previous
                current_location: order.transfer_center_location, // Update current location to transfer destination
                updated_at: new Date(),
              });
            } else {
              // For regular deliveries
              return updateDoc(doc(db, 'orders', orderId), {
                status: 'Delivered',
                updated_at: new Date(),
              });
            }
          });

          // Execute all updates
          await Promise.all(orderUpdatePromises.filter(Boolean));
          toast.success(`Updated ${orderIds.length} orders status based on their transfer status`);
        }
      }

      toast.success('Trip type updated successfully');
      setShowStatusDialog(false);
    } catch (error) {
      console.error('Error updating trip type:', error);
      toast.error('Failed to update trip type');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTypeChange = async (newType: string) => {
    if (newType === trip.type) return;

    // Validate driver and truck assignment when changing to active
    if (newType === 'active') {
      if (
        !trip.driver ||
        trip.driver === 'Not Assigned' ||
        !trip.truck ||
        trip.truck === 'Not Assigned'
      ) {
        toast.error('Cannot set trip to active: Driver and truck must be assigned first');
        return;
      }
      setShowStatusDialog(true);
    } else {
      await updateTripType(newType);
    }
  };

  return (
    <>
      <Select value={trip.type} onValueChange={handleTypeChange} disabled={isUpdating}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ready to ship">Ready to Ship</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="past">Past</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Trip Status</DialogTitle>
            <DialogDescription>Select the current status for this active trip.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <Select
                value={selectedStatus || ''}
                onValueChange={(value: 'Delivering' | 'Returning') => setSelectedStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select current status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Delivering">Delivering</SelectItem>
                  <SelectItem value="Returning">Returning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateTripType('active', selectedStatus)}
              disabled={!selectedStatus}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Create ViewTripDialog component for past trips
const ViewTripDialog = ({
  trip,
  isOpen,
  onClose,
}: {
  trip: any;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [associatedOrders, setAssociatedOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssociatedOrders = async () => {
      try {
        setIsLoading(true);
        // Get the trip_orders document using the trip ID
        const tripOrdersDoc = await getDoc(doc(db, 'trip_orders', trip.id));

        if (!tripOrdersDoc.exists()) {
          setAssociatedOrders([]);
          return;
        }

        const orderIds = tripOrdersDoc.data().orderIds || [];

        // Fetch all order documents in parallel
        const orderPromises = orderIds.map((id: string) => getDoc(doc(db, 'orders', id)));
        const orderDocs = await Promise.all(orderPromises);

        const orders = orderDocs
          .filter((doc) => doc.exists())
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

        setAssociatedOrders(orders);
      } catch (error) {
        console.error('Error fetching associated orders:', error);
        toast.error('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && trip.id) {
      fetchAssociatedOrders();
    }
  }, [isOpen, trip.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Trip Details</DialogTitle>
          <DialogDescription>Details of the completed trip.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-bold">Trip ID</Label>
              <div className="mt-1 text-sm">{trip.tripId}</div>
            </div>
            <div>
              <Label className="font-bold">Driver</Label>
              <div className="mt-1 text-sm">
                {(() => {
                  const driverId = trip.driver;
                  const { drivers } = useDrivers();
                  const driver = drivers.find((d) => d.id === driverId);
                  const showDriverName = driver ? driver.driverName : trip.driver;
                  return showDriverName;
                })()}
              </div>
            </div>
            <div>
              <Label className="font-bold">Starting Point</Label>
              <div className="mt-1 text-sm">{trip.startingPoint}</div>
            </div>
            <div>
              <Label className="font-bold">Destination</Label>
              <div className="mt-1 text-sm">{trip.destination}</div>
            </div>
            <div>
              <Label className="font-bold">Number of Stops</Label>
              <div className="mt-1 text-sm">{trip.numberOfStops}</div>
            </div>
            <div>
              <Label className="font-bold">Vehicle Number</Label>
              <div className="mt-1 text-sm">{trip.truck}</div>
            </div>
            <div>
              <Label className="font-bold">Start Date</Label>
              <div className="mt-1 text-sm">
                {(() => {
                  try {
                    if (trip.startDate instanceof Date) {
                      return trip.startDate.toLocaleDateString();
                    }
                    if (
                      typeof trip.startDate === 'object' &&
                      trip.startDate &&
                      'seconds' in trip.startDate
                    ) {
                      return new Date(trip.startDate.seconds * 1000).toLocaleDateString();
                    }
                    return new Date(trip.startDate).toLocaleDateString();
                  } catch (error) {
                    return 'Invalid Date';
                  }
                })()}
              </div>
            </div>
          </div>

          {/* Orders Section */}
          <div className="space-y-4">
            <Label className="font-bold">Delivered Orders</Label>
            <ScrollArea className="h-[200px] border rounded-md p-4">
              {isLoading ? (
                <div className="text-center py-4">Loading orders...</div>
              ) : associatedOrders.length === 0 ? (
                <div className="text-center py-4">No orders found for this trip</div>
              ) : (
                <div className="space-y-4">
                  {associatedOrders.map((order) => (
                    <div key={order.id} className="text-sm border-b pb-2 last:border-0">
                      <div className="flex items-center gap-1">
                        <span className="flex gap-2 items-center">
                          <span className="font-medium">{order.docket_id}:</span>
                          {order.client_details} <FaArrowRightLong /> {order.receiver_name}
                        </span>
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        <span className="font-medium">Boxes:</span> {order.total_boxes_count} |{' '}
                        <span className="font-medium">Deadline:</span>{' '}
                        {(() => {
                          try {
                            if (order.deadline instanceof Date) {
                              return order.deadline.toLocaleDateString();
                            }
                            if (
                              typeof order.deadline === 'object' &&
                              order.deadline &&
                              'seconds' in order.deadline
                            ) {
                              return new Date(order.deadline.seconds * 1000).toLocaleDateString();
                            }
                            return new Date(order.deadline).toLocaleDateString();
                          } catch (error) {
                            return 'Invalid Date';
                          }
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Update ActionCell component
const ActionCell = ({ row }: { row: any }) => {
  const trip = row.original;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleUpdateSuccess = () => {
    setIsEditDialogOpen(false);
  };

  if (trip.type === 'past') {
    return (
      <div className="text-center">
        <button
          className="hover:bg-[#FB8E15] p-1 rounded-lg cursor-pointer border border-[#FB8E15] text-[#FB8E15] hover:text-white"
          onClick={() => setIsViewDialogOpen(true)}
        >
          <span className="px-2">View</span>
        </button>
        <ViewTripDialog
          trip={trip}
          isOpen={isViewDialogOpen}
          onClose={() => setIsViewDialogOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="text-center space-x-2">
      <button
        className="hover:bg-primary p-1 rounded-lg cursor-pointer border border-primary text-primary hover:text-white"
        onClick={() => setIsEditDialogOpen(true)}
      >
        <MdEdit size={15} />
      </button>
      {trip.type !== 'past' && (
        <button
          className="hover:bg-red-500 p-1 rounded-lg cursor-pointer border border-red-500 text-red-500 hover:text-white"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <MdDeleteOutline size={15} />
        </button>
      )}

      {/* Edit Trip Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>
              Update the trip details below. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          <UpdateTripForm
            tripId={trip.id}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Trip Dialog */}
      {trip.type !== 'past' && (
        <DeleteTripDialog
          tripId={trip.tripId}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
        />
      )}
    </div>
  );
};

// columns definition for the trips table
// exporting headless cols
export const columns: ColumnDef<Trip>[] = [
  {
    accessorKey: 'tripId',
    header: 'Trip ID',
  },
  {
    accessorKey: 'startingPoint',
    header: 'Starting Point',
  },
  {
    accessorKey: 'destination',
    header: 'Destination',
  },
  {
    accessorKey: 'driver',
    header: 'Driver',
    cell: ({ row }) => {
      const driverId = row.getValue('driver') as string;
      const { drivers } = useDrivers();
      const driver = drivers.find((d) => d.id === driverId);
      return <div className="text-left">{driver?.driverName || driverId}</div>;
    },
  },
  {
    accessorKey: 'numberOfStops',
    header: 'Number of Stops',
    cell: ({ row }) => {
      const count: number = row.getValue('numberOfStops');
      return <div className="text-left font-medium">{count}</div>;
    },
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
          console.error('Error formatting Start Date:', error);
        }
      }

      return <div className="text-left">{formattedDate}</div>;
    },
  },
  {
    accessorKey: 'truck',
    header: 'Truck',
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: TypeCell,
  },
  {
    accessorKey: 'currentStatus',
    header: 'Current Status',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      const status = row.getValue('currentStatus') as string | undefined;
      return type === 'active' ? (
        <div className="text-left">{status || '-'}</div>
      ) : (
        <div className="text-left">-</div>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: () => <div className="text-center">Actions</div>,
    id: 'actions',
    cell: ActionCell,
  },
];

export default columns;
