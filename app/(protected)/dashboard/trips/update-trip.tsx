'use client';

import { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/database';
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
import useDrivers, { Driver } from '@/hooks/useDrivers';
import useOrders, { Order } from '@/hooks/useOrders';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UpdateTripFormProps {
  tripId: string; // This is now the unique tripId, not the document ID
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UpdateTripForm({ tripId, onSuccess, onCancel }: UpdateTripFormProps) {
  const [formData, setFormData] = useState({
    tripId: '',
    startingPoint: '',
    destination: '',
    driver: '',
    driverDetails: null as Driver | null, // Store the full driver object
    numberOfStops: '',
    startDate: '',
    truck: '',
    status: '',
    orderIds: [] as string[], // Add orderIds array to store selected order IDs
  });

  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]); // Track selected orders
  const [loadingOrders, setLoadingOrders] = useState(true); // Track loading state for trip orders

  // Keep track of whether the user has manually edited the truck or status
  const [userOverrides, setUserOverrides] = useState({
    truck: false,
    status: false,
  });

  const [docId, setDocId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch drivers data
  const { drivers, isLoading: isLoadingDrivers, error: driversError } = useDrivers();

  // Fetch orders data
  const { orders, isLoading: isLoadingOrders, error: ordersError } = useOrders();

  // Fetch trip data on component mount
  useEffect(() => {
    const fetchTripData = async () => {
      try {
        // First we need to find the document with the given tripId
        const tripsRef = collection(db, 'trips');
        const tripQuery = query(tripsRef, where('tripId', '==', tripId));
        const querySnapshot = await getDocs(tripQuery);

        if (querySnapshot.empty) {
          toast.error('Trip not found');
          if (onCancel) onCancel();
          return;
        }

        // Get the first document that matches (should only be one)
        const tripDoc = querySnapshot.docs[0];
        const data = tripDoc.data();
        setDocId(tripDoc.id);

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

        setFormData({
          tripId: data.tripId || tripId,
          startingPoint: data.startingPoint || '',
          destination: data.destination || '',
          driver: data.driver || 'Unassigned',
          driverDetails: null, // Will set this when drivers are loaded
          numberOfStops: data.numberOfStops?.toString() || '0',
          startDate: formattedStartDate,
          truck: data.truck || '',
          status: data.status || 'unassigned',
          orderIds: data.orderIds || [], // Get existing orderIds if any
        });

        // Fetch the orders associated with this trip
        await fetchTripOrders(data.tripId || tripId);
      } catch (error) {
        console.error('Error fetching trip:', error);
        toast.error('Failed to load trip data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTripData();
  }, [tripId, onCancel]);

  // Fetch orders associated with the trip
  const fetchTripOrders = async (tripId: string) => {
    try {
      setLoadingOrders(true);
      const mappingsRef = collection(db, 'order_trip_mappings');
      const mappingsQuery = query(mappingsRef, where('tripId', '==', tripId));
      const mappingsSnapshot = await getDocs(mappingsQuery);

      const orderIds = mappingsSnapshot.docs.map((doc) => doc.data().orderId);

      // Update formData with the order IDs
      setFormData((prev) => ({
        ...prev,
        orderIds,
      }));
    } catch (error) {
      console.error('Error fetching trip orders:', error);
      toast.error('Failed to load associated orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Once both trip data and drivers are loaded, find the matching driver
  useEffect(() => {
    if (!isLoading && !isLoadingDrivers && formData.driver !== 'Unassigned' && drivers.length > 0) {
      // Try to find a matching driver by name
      const matchedDriver = drivers.find((d) => d.driverName === formData.driver);

      if (matchedDriver) {
        setFormData((prev) => ({
          ...prev,
          driverDetails: matchedDriver,
        }));
      }
    }
  }, [isLoading, isLoadingDrivers, formData.driver, drivers]);

  // Update selectedOrders when orders are loaded or formData.orderIds changes
  useEffect(() => {
    if (!isLoadingOrders && formData.orderIds.length > 0) {
      const ordersForTrip = orders.filter((order) => formData.orderIds.includes(order.orderId));
      setSelectedOrders(ordersForTrip);
    }
  }, [isLoadingOrders, formData.orderIds, orders]);

  const handleInputChange = (field: string, value: string) => {
    // If the user manually changes truck or status, mark it as overridden
    if (field === 'truck') {
      setUserOverrides((prev) => ({ ...prev, truck: true }));
    } else if (field === 'status') {
      setUserOverrides((prev) => ({ ...prev, status: true }));
    }

    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // Handle driver selection
  const handleDriverChange = (driverId: string) => {
    if (driverId === 'Unassigned') {
      // Reset driver-related fields if "Unassigned" is selected
      setFormData({
        ...formData,
        driver: 'Unassigned',
        driverDetails: null,
        truck: userOverrides.truck ? formData.truck : '', // Keep truck if overridden
        status: userOverrides.status ? formData.status : 'unassigned', // Keep status if overridden
      });
    } else {
      // Find the selected driver
      const selectedDriver = drivers.find((d) => d.driverId === driverId);
      if (selectedDriver) {
        setFormData({
          ...formData,
          driver: selectedDriver.driverName,
          driverDetails: selectedDriver,
          // Only auto-populate if user hasn't overridden these values
          truck: userOverrides.truck ? formData.truck : selectedDriver.driverTruckNo,
          status: userOverrides.status ? formData.status : 'assigned',
        });
      }
    }
  };

  // Handle order selection
  const handleOrderSelection = (order: Order) => {
    setSelectedOrders((prevSelectedOrders) => {
      const isSelected = prevSelectedOrders.some((o) => o.orderId === order.orderId);

      // Create new selectedOrders array
      const newSelectedOrders = isSelected
        ? prevSelectedOrders.filter((o) => o.orderId !== order.orderId)
        : [...prevSelectedOrders, order];
      
      // Update formData.orderIds directly here instead of in a separate useEffect
      setFormData(prev => ({
        ...prev,
        orderIds: newSelectedOrders.map(o => o.orderId)
      }));
      
      return newSelectedOrders;
    });
  };

  // Check if an order is selected
  const isOrderSelected = (orderId: string) => {
    return selectedOrders.some((order) => order.orderId === orderId);
  };

  // Filter available orders - for update form, we want to show both unassigned orders and this trip's orders
  const availableOrders = orders.filter(
    (order) => order.status === 'Assigned' || formData.orderIds.includes(order.orderId),
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // We need the document ID to update the correct document
      if (!docId) {
        toast.error('Cannot update: Document ID not found');
        return;
      }

      // Remove driverDetails from the data by destructuring
      const { driverDetails, ...dataToSubmit } = formData;

      // Parse and validate form data
      const validatedData = {
        ...dataToSubmit,
        numberOfStops: parseInt(formData.numberOfStops) || 0,
        startDate: new Date(formData.startDate),
        updated_at: new Date(),
      };

      // Update the trip in Firestore using the document ID
      const tripRef = doc(db, 'trips', docId);
      await updateDoc(tripRef, validatedData);

      // Get current order-trip mappings
      const mappingsRef = collection(db, 'order_trip_mappings');
      const mappingsQuery = query(mappingsRef, where('tripId', '==', tripId));
      const mappingsSnapshot = await getDocs(mappingsQuery);

      // Create a map of existing mappings
      const existingMappings = new Map();
      mappingsSnapshot.docs.forEach((doc) => {
        existingMappings.set(doc.data().orderId, doc.id);
      });

      // Remove mappings for orders that are no longer selected
      const removePromises = Array.from(existingMappings.entries())
        .filter(([orderId]) => !selectedOrders.some((order) => order.orderId === orderId))
        .map(([_, docId]) => deleteDoc(doc(db, 'order_trip_mappings', docId)));

      // Add mappings for newly selected orders
      const addPromises = selectedOrders
        .filter((order) => !existingMappings.has(order.orderId))
        .map((order) =>
          addDoc(collection(db, 'order_trip_mappings'), {
            orderId: order.orderId,
            tripId: formData.tripId,
            created_at: new Date(),
          }),
        );

      // Execute all mapping updates
      await Promise.all([...removePromises, ...addPromises]);

      toast.success('Trip updated successfully!', {
        description: `Trip ID: ${formData.tripId} with ${selectedOrders.length} orders assigned`,
      });

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

  if (isLoading || isLoadingDrivers || isLoadingOrders) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        <p className="mt-2">Loading trip data...</p>
      </div>
    );
  }

  if (driversError) {
    toast.error('Failed to load drivers');
  }

  if (ordersError) {
    toast.error('Failed to load orders');
  }

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 hidden">
            <Label htmlFor="tripId">Trip ID</Label>
            <Input
              id="tripId"
              placeholder="Trip ID"
              value={formData.tripId}
              disabled={true}
              className="bg-muted"
            />
          </div>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="driver">Driver</Label>
            <Select
              value={formData.driverDetails?.driverId || 'Unassigned'}
              onValueChange={handleDriverChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unassigned">Unassigned</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.driverId} value={driver.driverId}>
                    {driver.driverName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="truck">Truck</Label>
            <Input
              id="truck"
              placeholder={
                formData.driverDetails
                  ? 'Auto-assigned from driver (can override)'
                  : 'Enter truck details'
              }
              value={formData.truck}
              onChange={(e) => handleInputChange('truck', e.target.value)}
              required
            />
            {/* {!!formData.driverDetails && !userOverrides.truck && (
              <p className="text-xs text-muted-foreground">
                Auto-assigned from driver's information (you can edit this)
              </p>
            )} */}
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
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="space-y-2">
            <Label htmlFor="status">Trip Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select trip status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            {/* {!!formData.driverDetails && !userOverrides.status && (
              <p className="text-xs text-muted-foreground"></p>
                Auto-set to "assigned" when driver is selected (you can change this)
              </p>
            )} */}
          </div>
        </div>

        {/* Order selection section */}
        {!isLoadingOrders && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Associated Orders ({selectedOrders.length})</Label>
            </div>
            {availableOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available orders found.</p>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Orders</CardTitle>
                </CardHeader>
                <CardContent className="px-0 py-0">
                  <ScrollArea className="h-[200px]">
                    <div className="px-4 py-2 space-y-2">
                      {availableOrders.map((order) => (
                        <div
                          key={order.orderId}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                          onClick={() => handleOrderSelection(order)}
                        >
                          <Checkbox
                            checked={isOrderSelected(order.orderId)}
                            onCheckedChange={() => handleOrderSelection(order)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {order.orderId} - {order.customer_name || 'Unnamed Customer'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.pickup_location} → {order.delivery_location}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        )}

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
