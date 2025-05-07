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
} from 'firebase/firestore';
import { db } from '@/firebase/database';
import { useDrivers } from '@/hooks/useDrivers';
import { useOrders } from '@/hooks/useOrders';
import { Driver } from '@/types';

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
  const { drivers, isLoading: isLoadingDrivers } = useDrivers();
  const { orders, isLoading: isLoadingOrders } = useOrders();
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

  // Filter orders that are ready to transport
  const availableOrders = orders.filter(
    (order) => order.status === 'Ready To Transport' || selectedOrderIds.includes(order.order_id),
  );

  const fetchTripData = useCallback(async () => {
    try {
      const tripsRef = collection(db, 'trips');
      const tripQuery = query(tripsRef, where('tripId', '==', tripId));
      const querySnapshot = await getDocs(tripQuery);

      if (querySnapshot.empty) {
        toast.error('Trip not found');
        onCancel?.();
        return;
      }

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
        const tripOrdersData = tripOrdersDoc.data();
        setSelectedOrderIds(tripOrdersData.orderIds || []);
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
        driver: driver.id,
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
    if (!selectedDriver) {
      toast.error('Please select a driver');
      return;
    }

    // Validate currentStatus for active trips
    if (formData.type === 'active' && formData.currentStatus === 'NA') {
      toast.error('Please select a valid status (Delivering or Returning) for active trip');
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse and validate form data
      const validatedData = {
        ...formData,
        numberOfStops: parseInt(formData.numberOfStops),
        startDate: new Date(formData.startDate),
        updated_at: new Date(),
      };

      // Find the document with the given tripId
      const tripsRef = collection(db, 'trips');
      const tripQuery = query(tripsRef, where('tripId', '==', tripId));
      const querySnapshot = await getDocs(tripQuery);

      if (querySnapshot.empty) {
        toast.error('Trip not found');
        return;
      }

      // Update the trip in Firestore
      const tripDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'trips', tripDoc.id), validatedData);

      // Update trip_orders
      const tripOrdersRef = collection(db, 'trip_orders');
      const tripOrdersQuery = query(tripOrdersRef, where('tripId', '==', tripId));
      const tripOrdersSnapshot = await getDocs(tripOrdersQuery);

      let previousOrderIds: string[] = [];

      if (!tripOrdersSnapshot.empty) {
        const tripOrdersDoc = tripOrdersSnapshot.docs[0];
        previousOrderIds = tripOrdersDoc.data().orderIds || [];
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

      // Update or create trip_orders document
      if (tripOrdersSnapshot.empty) {
        // Create new trip_orders document if there are selected orders
        if (selectedOrderIds.length > 0) {
          await addDoc(collection(db, 'trip_orders'), {
            tripId,
            orderIds: selectedOrderIds,
            updatedAt: new Date(),
          });
        }
      } else {
        // Update existing trip_orders document
        const tripOrdersDoc = tripOrdersSnapshot.docs[0];
        await updateDoc(doc(db, 'trip_orders', tripOrdersDoc.id), {
          orderIds: selectedOrderIds,
          updatedAt: new Date(),
        });
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
              id="numberOfStops"
              type="number"
              placeholder="Enter number of stops"
              value={formData.numberOfStops}
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
            <Label htmlFor="truck">Truck Number</Label>
            <Input
              id="truck"
              placeholder="Enter truck number"
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

        {/* Add this section before the buttons */}
        <div className="space-y-4">
          <Label>Select Orders for this Trip</Label>
          <ScrollArea className="h-[200px] border rounded-md p-4">
            {isLoadingOrders ? (
              <div className="text-center py-4">Loading orders...</div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-4">No orders available</div>
            ) : (
              <div className="space-y-2">
                {availableOrders.map((order) => (
                  <div key={order.order_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={order.order_id}
                      checked={selectedOrderIds.includes(order.order_id)}
                      onCheckedChange={(checked) =>
                        handleOrderSelection(order.order_id, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={order.order_id}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {order.docket_id} - {order.shipper_details} to {order.receiver_details}
                    </label>
                  </div>
                ))}
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
