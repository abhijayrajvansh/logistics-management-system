'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getUniqueVerifiedTripId } from '@/lib/createUniqueTripId';
import useDrivers, { Driver } from '@/hooks/useDrivers';
import useOrders, { Order } from '@/hooks/useOrders';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CreateTripFormProps {
  onSuccess?: () => void;
}

export function CreateTripForm({ onSuccess }: CreateTripFormProps) {
  const [formData, setFormData] = useState({
    tripId: '',
    startingPoint: '',
    destination: '',
    driver: 'Unassigned',
    driverDetails: null as Driver | null, // Store the full driver object
    numberOfStops: '',
    startDate: '',
    truck: '',
    status: 'unassigned',
    orderIds: [] as string[], // Add orderIds array to store selected order IDs
  });

  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]); // Track selected orders as full objects

  // Keep track of whether the user has manually edited the truck or status
  const [userOverrides, setUserOverrides] = useState({
    truck: false,
    status: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(true);

  // Fetch drivers data
  const { drivers, isLoading: isLoadingDrivers, error: driversError } = useDrivers();

  // Fetch orders data
  const { orders, isLoading: isLoadingOrders, error: ordersError } = useOrders();

  // Generate a unique trip ID when the component mounts
  useEffect(() => {
    const generateUniqueId = async () => {
      try {
        setIsGeneratingId(true);
        const uniqueTripId = await getUniqueVerifiedTripId(db);
        setFormData((prev) => ({ ...prev, tripId: uniqueTripId }));
      } catch (error) {
        console.error('Error generating unique trip ID:', error);
      } finally {
        setIsGeneratingId(false);
      }
    };

    generateUniqueId();
  }, []);

  // Update formData.orderIds whenever selectedOrders changes
  useEffect(() => {
    const orderIds = selectedOrders.map((order) => order.orderId);
    // Only update if the orderIds array has actually changed
    if (JSON.stringify(orderIds) !== JSON.stringify(formData.orderIds)) {
      setFormData((prev) => ({
        ...prev,
        orderIds: orderIds,
      }));
    }
  }, [selectedOrders]);

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

      if (isSelected) {
        // Remove order if it's already selected
        return prevSelectedOrders.filter((o) => o.orderId !== order.orderId);
      } else {
        // Add order if it's not selected
        return [...prevSelectedOrders, order];
      }
    });
  };

  // Check if an order is selected
  const isOrderSelected = (orderId: string) => {
    return selectedOrders.some((order) => order.orderId === orderId);
  };

  // Filter available orders based on status (only showing Ready To Transport orders)
  const availableOrders = orders.filter((order) => order.status === 'Ready To Transport');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a copy of formData without the driverDetails field
      const { driverDetails, ...dataToSubmit } = formData;

      // Parse and validate form data
      const validatedData = {
        ...dataToSubmit,
        numberOfStops: parseInt(formData.numberOfStops) || 0,
        startDate: new Date(formData.startDate),
        created_at: new Date(),
      };

      // Add the trip to Firestore
      const tripRef = await addDoc(collection(db, 'trips'), validatedData);

      // Update the status of all selected orders to 'assigned'
      const updatePromises = selectedOrders.map((order) => {
        return addDoc(collection(db, 'order_trip_mappings'), {
          orderId: order.orderId,
          tripId: formData.tripId,
          created_at: new Date(),
        });
      });

      await Promise.all(updatePromises);

      toast.success('Trip created successfully!', {
        description: `Trip ID: ${formData.tripId} with ${selectedOrders.length} orders assigned`,
      });

      // Reset form after successful submission
      setFormData({
        tripId: '', // Will be regenerated on next form render
        startingPoint: '',
        destination: '',
        driver: 'Unassigned',
        driverDetails: null,
        numberOfStops: '',
        startDate: '',
        truck: '',
        status: 'unassigned',
        orderIds: [],
      });

      // Reset selected orders
      setSelectedOrders([]);

      // Reset user overrides
      setUserOverrides({
        truck: false,
        status: false,
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      toast.error('Failed to create trip', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              placeholder="Generating unique ID..."
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
              disabled={isLoadingDrivers}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={isLoadingDrivers ? 'Loading drivers...' : 'Select a driver'}
                />
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
            {isLoadingDrivers && (
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Loading drivers...
              </div>
            )}
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
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Order Selection Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Orders for this Trip</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Loading orders...</span>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No unassigned orders available
              </div>
            ) : (
              <ScrollArea className="h-[200px] rounded-md border">
                <div className="p-4 space-y-2">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Available Orders ({availableOrders.length})
                  </div>
                  {availableOrders.map((order) => (
                    <div
                      key={order.orderId}
                      className="flex items-start space-x-2 p-3 rounded hover:bg-muted border-b border-muted last:border-0"
                      onClick={() => handleOrderSelection(order)}
                    >
                      <Checkbox
                        checked={isOrderSelected(order.orderId)}
                        onCheckedChange={() => handleOrderSelection(order)}
                        id={`order-${order.orderId}`}
                        className="mt-1"
                      />
                      <div className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm flex justify-between">
                          <span>Order ID: {order.docket_id || order.orderId}</span>
                            <span className="text-muted-foreground">TAT: {new Date(order.tat).toLocaleDateString()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                          <div>
                            <div className="font-semibold">Shipper:</div>
                            <div className="text-muted-foreground">
                              {order.shipper_details || order.customer_name}
                            </div>
                            <div className="text-muted-foreground">{order.pickup_location}</div>
                          </div>
                          <div>
                            <div className="font-semibold">Receiver:</div>
                            <div className="text-muted-foreground">
                              {order.receiver_details || 'N/A'}
                            </div>
                            <div className="text-muted-foreground">{order.delivery_location}</div>
                          </div>
                        </div>

                        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                          <span>Boxes: {order.total_boxes_count || 'N/A'}</span>
                          <span>Weight: {order.total_order_weight ? `${order.total_order_weight} kg` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Selected Orders: <span className="font-bold">{selectedOrders.length}</span>
                </span>
                {selectedOrders.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrders([])}
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              // Generate a new unique ID
              setIsGeneratingId(true);
              const uniqueTripId = await getUniqueVerifiedTripId(db);
              setIsGeneratingId(false);

              // Reset form and user overrides
              setFormData({
                tripId: uniqueTripId,
                startingPoint: '',
                destination: '',
                driver: 'Unassigned',
                driverDetails: null,
                numberOfStops: '',
                startDate: '',
                truck: '',
                status: 'unassigned',
                orderIds: [],
              });

              // Reset selected orders
              setSelectedOrders([]);

              setUserOverrides({
                truck: false,
                status: false,
              });
            }}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting || isGeneratingId}>
            {isSubmitting ? 'Creating Trip...' : 'Create Trip'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CreateTripForm;
