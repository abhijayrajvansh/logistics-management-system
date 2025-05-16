'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Driver, Order } from '@/types';
import { fetchAvailableOrders } from '@/lib/fetchAvailableOrders';
import { fetchActiveDrivers } from '@/lib/fetchActiveDrivers';
import { FaArrowRightLong } from 'react-icons/fa6';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

interface UpdateTripFormProps {
  tripId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UpdateTripForm({ tripId, onSuccess, onCancel }: UpdateTripFormProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [associatedOrders, setAssociatedOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    startingPoint: '',
    destination: '',
    driver: '',
    driverName: '', // Add this field to store driver name
    numberOfStops: '',
    startDate: '',
    truck: '',
    type: '',
    currentStatus: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const fetchAssociatedOrders = async (tripDocId: string) => {
    try {
      // Use the same document ID tripDocId to fetch from trip_orders collection
      const tripOrdersDoc = await getDoc(doc(db, 'trip_orders', tripDocId));
      // console.log('Trip orders doc exists?', tripOrdersDoc.exists());
      // console.log('Trip orders data:', tripOrdersDoc.data());

      if (!tripOrdersDoc.exists()) {
        // console.log('No trip_orders document found for tripDocId:', tripDocId);
        return [];
      }

      // Get the orderIds array
      const orderIds = tripOrdersDoc.data().orderIds || [];
      // console.log('Found orderIds:', orderIds);

      if (orderIds.length === 0) {
        // console.log('No orderIds found in trip_orders document');
        return [];
      }

      // Now fetch all the orders in parallel
      // console.log('Fetching orders for IDs:', orderIds);
      const ordersPromises = orderIds.map((id: string) => getDoc(doc(db, 'orders', id)));
      const orderDocs = await Promise.all(ordersPromises);

      const orders = orderDocs
        .filter((doc) => doc.exists())
        .map(
          (doc) =>
            ({
              order_id: doc.id,
              ...doc.data(),
            }) as Order,
        );

      // console.log('Successfully fetched orders:', orders);
      return orders;
    } catch (error) {
      console.error('Error in fetchAssociatedOrders:', error);
      return [];
    }
  };

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const orders = await fetchAvailableOrders();
      setAvailableOrders(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load available orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Load orders when component mounts
  useEffect(() => {
    loadOrders();
  }, []);

  const fetchTripData = useCallback(async () => {
    try {
      const tripDocRef = doc(db, 'trips', tripId);
      const tripDocSnap = await getDoc(tripDocRef);

      if (!tripDocSnap.exists()) {
        toast.error('Trip not found');
        onCancel?.();
        return;
      }

      // Create a structure similar to querySnapshot to maintain compatibility with the rest of the code
      const querySnapshot = {
        docs: [
          {
            data: () => tripDocSnap.data(),
            id: tripDocSnap.id,
          },
        ],
        empty: false,
      };

      const tripDoc = querySnapshot.docs[0];
      const data = tripDoc.data();

      // Format date for input field if it exists
      let formattedStartDate = '';
      if (data.startDate) {
        if (data.startDate.toDate) {
          // Handle Firestore timestamp
          formattedStartDate = data.startDate.toDate().toISOString().split('T')[0];
        } else if (data.startDate instanceof Date) {
          // Handle regular Date object
          formattedStartDate = data.startDate.toISOString().split('T')[0];
        } else if (typeof data.startDate === 'string') {
          // Handle string date
          formattedStartDate = data.startDate;
        }
      }

      // Find the driver to get their name
      const selectedDriver = drivers.find((d) => d.id === data.driver);

      setFormData({
        startingPoint: data.startingPoint || '',
        destination: data.destination || '',
        driver: data.driver || '',
        driverName: selectedDriver?.driverName || '',
        numberOfStops: data.numberOfStops?.toString() || '',
        startDate: formattedStartDate,
        truck: data.truck || '',
        type: data.type || '',
        currentStatus: data.currentStatus || '',
      });

      // Fetch associated orders
      const tripOrdersRef = collection(db, 'trip_orders');
      const tripOrdersQuery = query(tripOrdersRef, where('tripId', '==', tripId));
      const tripOrdersSnapshot = await getDocs(tripOrdersQuery);

      if (!tripOrdersSnapshot.empty) {
        const tripOrdersDoc = tripOrdersSnapshot.docs[0];
        const orderIds = tripOrdersDoc.data().orderIds || [];
        setSelectedOrderIds(orderIds);

        // Fetch the actual order documents
        const associatedOrders = await fetchAssociatedOrders(tripId);
        setAssociatedOrders(associatedOrders);
      }

      // Find and set the selected driver
      if (selectedDriver) {
        setSelectedDriver(selectedDriver);
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
      toast.error('Failed to load trip data');
    } finally {
      setIsLoading(false);
    }
  }, [tripId, onCancel, drivers]);

  // Fetch trip data and associated orders on component mount
  useEffect(() => {
    if (drivers.length > 0) {
      fetchTripData();
    }
  }, [drivers, fetchTripData]);

  const handleDriverChange = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (driver) {
      setSelectedDriver(driver);
      setFormData((prev) => ({
        ...prev,
        driver: driverId, // Use the same ID consistently
        driverName: driver.driverName,
        truck: driver.driverTruckId || prev.truck,
      }));
    }
  };

  const handleOrderSelection = (orderId: string, isSelected: boolean) => {
    setSelectedOrderIds((prev) =>
      isSelected ? [...prev, orderId] : prev.filter((id) => id !== orderId),
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      if (field === 'type') {
        // Handle type change and set appropriate currentStatus
        const newType = value as 'unassigned' | 'active' | 'past';

        // Validate driver and truck assignment when changing to active
        if (newType === 'active') {
          if (
            !prev.driver ||
            prev.driver === 'Not Assigned' ||
            !prev.truck ||
            prev.truck === 'Not Assigned'
          ) {
            toast.error('Cannot set trip to active: Driver and truck must be assigned first');
            return prev; // Return previous state without changes
          }
        }

        return {
          ...prev,
          type: newType,
          currentStatus:
            newType === 'unassigned'
              ? 'NA'
              : newType === 'active'
                ? prev.currentStatus === 'NA'
                  ? 'Delivering'
                  : prev.currentStatus
                : 'NA',
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only validate currentStatus for active trips
    if (formData.type === 'active') {
      if (
        !formData.driver ||
        formData.driver === 'Not Assigned' ||
        !formData.truck ||
        formData.truck === 'Not Assigned'
      ) {
        toast.error('Cannot set trip to active: Driver and truck must be assigned first');
        return;
      }
      if (formData.currentStatus === 'NA') {
        toast.error('Please select a valid status (Delivering or Returning) for active trip');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Get current trip data to check for driver changes
      const tripDocRef = doc(db, 'trips', tripId);
      const tripDocSnap = await getDoc(tripDocRef);

      if (!tripDocSnap.exists()) {
        toast.error('Trip not found');
        return;
      }

      const currentTripData = tripDocSnap.data();
      const previousDriverId = currentTripData.driver;

      // Update trip data
      const validatedData = {
        ...formData,
        numberOfStops: selectedOrderIds.length,
        startDate: new Date(formData.startDate),
        updated_at: new Date(),
      };

      // Update the trip in Firestore
      await updateDoc(tripDocRef, validatedData);

      // Handle driver status updates if driver assignment changed
      if (previousDriverId !== formData.driver) {
        // Handle previous driver: Set status back to Active and remove from trip_drivers
        if (previousDriverId && previousDriverId !== 'Not Assigned') {
          // Update previous driver's status
          const prevDriverRef = doc(db, 'drivers', previousDriverId);
          await updateDoc(prevDriverRef, {
            status: 'Active',
            updated_at: new Date(),
          });

          // Remove previous trip-driver mapping
          await deleteDoc(doc(db, 'trip_drivers', tripId));
        }

        // Handle new driver: Set status to OnTrip and create trip_drivers mapping
        if (formData.driver && formData.driver !== 'Not Assigned') {
          // Create new trip-driver mapping
          await setDoc(doc(db, 'trip_drivers', tripId), {
            tripId: tripId,
            driverId: formData.driver,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Update new driver's status
          const newDriverRef = doc(db, 'drivers', formData.driver);
          await updateDoc(newDriverRef, {
            status: 'On Trip',
            updated_at: new Date(),
          });
        }
      }

      // Get current trip_orders document using the same ID as the trip document
      const tripOrdersDocRef = doc(db, 'trip_orders', tripId);
      const tripOrdersSnap = await getDoc(tripOrdersDocRef);

      let previousOrderIds: string[] = [];

      if (tripOrdersSnap.exists()) {
        previousOrderIds = tripOrdersSnap.data().orderIds || [];
      }

      // Find orders to add and remove
      const ordersToAdd = selectedOrderIds.filter((id) => !previousOrderIds.includes(id));
      const ordersToRemove = previousOrderIds.filter((id) => !selectedOrderIds.includes(id));

      // Update orders being added to 'Assigned' status
      const addPromises = ordersToAdd.map((orderId) =>
        updateDoc(doc(db, 'orders', orderId), {
          status: 'Assigned',
          updated_at: new Date(),
        }),
      );

      // Update orders being removed to 'Ready To Transport' status
      const removePromises = ordersToRemove.map((orderId) =>
        updateDoc(doc(db, 'orders', orderId), {
          status: 'Ready To Transport',
          updated_at: new Date(),
        }),
      );

      // Wait for all order status updates to complete
      await Promise.all([...addPromises, ...removePromises]);

      // Update or create trip_orders document using the same ID as the trip
      if (selectedOrderIds.length > 0) {
        if (tripOrdersSnap.exists()) {
          // Update existing trip_orders document
          await updateDoc(tripOrdersDocRef, {
            orderIds: selectedOrderIds,
            updatedAt: new Date(),
          });
        } else {
          // Create new trip_orders document with same ID as trip
          await setDoc(tripOrdersDocRef, {
            tripId,
            orderIds: selectedOrderIds,
            updatedAt: new Date(),
          });
        }
      } else if (tripOrdersSnap.exists()) {
        // If no orders selected and document exists, delete it
        await deleteDoc(tripOrdersDocRef);
      }

      toast.success('Trip updated successfully!');

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating trip:', error);
      toast.error('Failed to update trip', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load active drivers and current trip's driver
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        setIsLoadingDrivers(true);
        const activeDrivers = await fetchActiveDrivers();

        // If this trip has a driver assigned, fetch their info too, even if not active
        const tripDoc = await getDoc(doc(db, 'trips', tripId));
        if (tripDoc.exists() && tripDoc.data().driver) {
          const currentDriverId = tripDoc.data().driver;
          const currentDriverDoc = await getDoc(doc(db, 'drivers', currentDriverId));

          if (currentDriverDoc.exists()) {
            const currentDriver = {
              id: currentDriverDoc.id,
              ...currentDriverDoc.data(),
            } as Driver;

            // Add current driver to list if not already included
            if (!activeDrivers.find((d) => d.id === currentDriver.id)) {
              activeDrivers.push(currentDriver);
            }
          }
        }

        setDrivers(activeDrivers);
      } catch (error) {
        console.error('Error loading drivers:', error);
        toast.error('Failed to load drivers');
      } finally {
        setIsLoadingDrivers(false);
      }
    };

    loadDrivers();
  }, [tripId]);

  if (isLoading || isLoadingDrivers) {
    return <div className="py-8 text-center">Loading trip data...</div>;
  }

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startingPoint">Starting Point</Label>
            <Input
              id="startingPoint"
              placeholder="Enter starting location"
              value={formData.startingPoint}
              onChange={(e) => handleInputChange('startingPoint', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              placeholder="Enter destination"
              value={formData.destination}
              onChange={(e) => handleInputChange('destination', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numberOfStops">Number of Stops</Label>
            <Input
              disabled={true}
              id="numberOfStops"
              type="number"
              placeholder="Enter number of stops"
              value={selectedOrderIds.length}
              onChange={(e) => handleInputChange('numberOfStops', e.target.value)}
              required
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="driver">Driver</Label>
            <Select
              value={selectedDriver?.id || ''}
              onValueChange={handleDriverChange}
              disabled={isLoadingDrivers}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isLoadingDrivers
                      ? 'Loading drivers...'
                      : formData.driverName || 'Select a driver'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.driverName} ({driver.driverTruckId || 'No Truck Assigned'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="truck">Vehicle Number</Label>
            <Input
              id="truck"
              placeholder="Enter Vehicle number"
              value={formData.truck}
              onChange={(e) => handleInputChange('truck', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Trip Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select trip type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'active' && (
            <div className="space-y-2">
              <Label htmlFor="currentStatus">Current Status</Label>
              <Select
                value={formData.currentStatus}
                onValueChange={(value) => handleInputChange('currentStatus', value)}
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
          )}
        </div>

        {/* Orders section */}
        <div className="space-y-4">
          <Label>Select Orders for this Trip</Label>
          <ScrollArea className="h-[200px] border rounded-md p-4">
            {isLoadingOrders ? (
              <div className="text-center py-4">Loading orders...</div>
            ) : availableOrders.length === 0 && associatedOrders.length === 0 ? (
              <div className="text-center py-4">No orders available</div>
            ) : (
              <div className="space-y-4">
                {/* Associated Orders Section */}
                {associatedOrders.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Currently Assigned Orders:
                    </div>
                    {associatedOrders.map((order) => (
                      <div key={order.order_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`assigned-${order.order_id}`}
                          checked={selectedOrderIds.includes(order.order_id)}
                          onCheckedChange={(checked) =>
                            handleOrderSelection(order.order_id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`assigned-${order.order_id}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <span className="flex items-center gap-1">
                            <span className="flex gap-2 items-center">
                              <span className="font-medium">{order.docket_id}:</span>
                              {order.client_details} <FaArrowRightLong /> {order.receiver_name},
                            </span>
                            <span className="font-medium">Deadline:</span>
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
                                  return new Date(
                                    (order.deadline as any).seconds * 1000,
                                  ).toLocaleDateString();
                                }
                                return new Date(order.deadline as string).toLocaleDateString();
                              } catch (error) {
                                return 'Invalid Date';
                              }
                            })()}
                            , Boxes: {order.total_boxes_count}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {/* Available Orders Section */}
                {availableOrders.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Available Orders:
                    </div>
                    {availableOrders.map((order) => (
                      <div key={order.order_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`available-${order.order_id}`}
                          checked={selectedOrderIds.includes(order.order_id)}
                          onCheckedChange={(checked) =>
                            handleOrderSelection(order.order_id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`available-${order.order_id}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <span className="flex items-center gap-1">
                            <span className="flex gap-2 items-center">
                              <span className="font-medium">{order.docket_id}:</span>
                              {order.client_details} <FaArrowRightLong /> {order.receiver_name},
                            </span>
                            <span className="font-medium">Dealine:</span>
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
                                  return new Date(
                                    (order.deadline as any).seconds * 1000,
                                  ).toLocaleDateString();
                                }
                                return new Date(order.deadline as string).toLocaleDateString();
                              } catch (error) {
                                return 'Invalid Date';
                              }
                            })()}
                            , Boxes: {order.total_boxes_count}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating Trip...' : 'Update Trip'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default UpdateTripForm;
