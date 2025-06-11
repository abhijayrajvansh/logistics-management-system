'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { db } from '@/firebase/database';
import { getUniqueVerifiedTripId } from '@/lib/createUniqueTripId';
import { Driver, Trip, Order } from '@/types';
import { addDoc, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FaArrowRightLong } from 'react-icons/fa6';
import { toast } from 'sonner';
import { fetchAvailableOrders } from '@/lib/fetchAvailableOrders';
import { fetchActiveDrivers } from '@/lib/fetchActiveDrivers';
import useTrucks from '@/hooks/useTrucks';
import { useAuth } from '@/app/context/AuthContext';
import useUsers from '@/hooks/useUsers';

interface CreateTripFormProps {
  onSuccess?: () => void;
}

export function CreateTripForm({ onSuccess }: CreateTripFormProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const { trucks } = useTrucks();

  // Add user authentication and location context
  const { user } = useAuth();
  const { users: currentUser } = useUsers(user?.uid);
  const userLocation = currentUser?.[0]?.location;

  // Define form data with proper types matching the Trip interface
  const [formData, setFormData] = useState<Omit<Trip, 'id' | 'startDate'> & { startDate: string }>({
    tripId: '',
    currentLocation: userLocation || '',
    startingPoint: '',
    destination: '',
    driver: '',
    numberOfStops: 0,
    startDate: new Date().toISOString().split('T')[0], // Set default to current date
    truck: '',
    type: 'ready to ship',
    currentStatus: 'NA', // Default to 'NA' for new trips
    odometerReading: 'NA', // Adding the missing odometerReading property
    voucher: 'NA', // Optional field, can be empty
  });

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(true);

  // Generate a unique trip ID when the component mounts
  const generateUniqueId = async () => {
    try {
      setIsGeneratingId(true);
      const uniqueTripId = await getUniqueVerifiedTripId(db, 'TR');
      setFormData((prev) => ({ ...prev, tripId: uniqueTripId }));
    } catch (error) {
      console.error('Error generating unique trip ID:', error);
      toast.error('Failed to generate Trip ID');
    } finally {
      setIsGeneratingId(false);
    }
  };

  useEffect(() => {
    generateUniqueId();
  }, []);

  // Update currentLocation when userLocation becomes available
  useEffect(() => {
    if (userLocation) {
      setFormData((prev) => ({
        ...prev,
        currentLocation: userLocation,
      }));
    }
  }, [userLocation]);

  // Load active drivers when component mounts
  useEffect(() => {
    const loadActiveDrivers = async () => {
      try {
        setIsLoadingDrivers(true);
        const activeDrivers = await fetchActiveDrivers();
        setDrivers(activeDrivers);
      } catch (error) {
        console.error('Error loading active drivers:', error);
        toast.error('Failed to load active drivers');
      } finally {
        setIsLoadingDrivers(false);
      }
    };

    loadActiveDrivers();
  }, []);

  // Effect to update truck details when driver is selected
  useEffect(() => {
    if (selectedDriver) {
      const truckRegNumber =
        trucks.find((truck) => truck.id === selectedDriver.assignedTruckId)?.regNumber ||
        'Not Assigned';
      setFormData((prevData) => ({
        ...prevData,
        driver: selectedDriver.id,
        truck: truckRegNumber || '',
      }));
    }
  }, [selectedDriver]);

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

  // Load orders when dialog opens
  useEffect(() => {
    loadOrders();
  }, []);

  const handleDriverChange = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (driver) {
      const truckRegNumber =
        trucks.find((truck) => truck.id === driver.assignedTruckId)?.regNumber || 'Not Assigned';
      setSelectedDriver(driver);
      setFormData((prevData) => ({
        ...prevData,
        driver: driverId, // Use the same ID that's passed from the select
        // truck: truckRegNumber,
      }));
    }
  };

  const handleOrderSelection = (orderId: string, isSelected: boolean) => {
    setSelectedOrderIds((prev) =>
      isSelected ? [...prev, orderId] : prev.filter((id) => id !== orderId),
    );
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => {
      if (field === 'type') {
        // Handle type change and set appropriate currentStatus
        const newType = value as 'ready to ship' | 'active' | 'past';

        // Validate driver and truck assignment when changing to active
        if (newType === 'active') {
          if (!selectedDriver || !formData.truck || formData.truck === 'Not Assigned') {
            toast.error('Cannot set trip to active: Driver and truck must be assigned first');
            return prev; // Return previous state without changes
          }
        }

        return {
          ...prev,
          type: newType,
          currentStatus:
            newType === 'ready to ship'
              ? 'NA'
              : newType === 'active'
                ? prev.currentStatus === 'NA'
                  ? 'Delivering'
                  : prev.currentStatus
                : 'NA',
        };
      }
      // Handle all other fields
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const resetForm = () => {
    setFormData({
      tripId: '', // Will be regenerated
      currentLocation: userLocation || '',
      startingPoint: '',
      destination: '',
      driver: '',
      numberOfStops: 0,
      startDate: '',
      truck: '',
      type: 'ready to ship',
      currentStatus: 'NA', // Reset to 'NA'
      odometerReading: 'NA', // Reset odometerReading to 'NA'
      voucher: formData.voucher, // Reset voucher to 'NA'
    });

    setSelectedDriver(null);
    setSelectedOrderIds([]);

    // Refresh available orders
    loadOrders();

    // Generate a new unique trip ID
    const generateNewId = async () => {
      try {
        setIsGeneratingId(true);
        const uniqueTripId = await getUniqueVerifiedTripId(db, 'TR');
        setFormData((prev) => ({ ...prev, tripId: uniqueTripId }));
      } catch (error) {
        console.error('Error generating unique trip ID:', error);
      } finally {
        setIsGeneratingId(false);
      }
    };
    generateNewId();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that userLocation is available
    if (!userLocation) {
      toast.error('Unable to determine your location. Please refresh the page and try again.');
      return;
    }

    // Only validate driver and truck assignment for active trips
    if (formData.type === 'active') {
      if (!selectedDriver || !formData.truck || formData.truck === 'Not Assigned') {
        toast.error('Cannot create active trip: Driver and truck must be assigned first');
        return;
      }
      if (formData.currentStatus === 'NA') {
        toast.error('Please select a valid status (Delivering or Returning) for active trip');
        return;
      }
    }

    setIsSubmitting(true);

    const truckRegNumber =
      trucks.find((truck) => truck.id === selectedDriver?.assignedTruckId)?.regNumber ||
      'Not Assigned';

    try {
      // Parse and validate form data
      const validatedData: Omit<Trip, 'id'> = {
        ...formData,
        currentLocation: userLocation, // Ensure we use the actual userLocation
        startDate: new Date(formData.startDate),
        numberOfStops: selectedOrderIds.length,
        currentStatus: formData.currentStatus,
        driver: selectedDriver?.id || 'Not Assigned',
        truck: truckRegNumber || 'Not Assigned',
      };

      // Add the trip to Firestore
      const tripRef = await addDoc(collection(db, 'trips'), {
        ...validatedData,
        created_at: new Date(),
      });

      // If a driver was selected, update driver status
      if (selectedDriver) {
        // Update driver status to "OnTrip"
        const driverRef = doc(db, 'drivers', selectedDriver.id);
        await updateDoc(driverRef, {
          status: 'On Trip',
          updated_at: new Date(),
        });
      }

      // Create trip_orders document if there are selected orders
      if (selectedOrderIds.length > 0) {
        // Use setDoc with trip ID as document ID
        await setDoc(doc(db, 'trip_orders', tripRef.id), {
          tripId: tripRef.id,
          orderIds: selectedOrderIds,
          updatedAt: new Date(),
        });

        // Update status of each selected order to 'Assigned'
        const orderPromises = selectedOrderIds.map((orderId) =>
          updateDoc(doc(db, 'orders', orderId), {
            status: 'Assigned',
            updated_at: new Date(),
          }),
        );
        await Promise.all(orderPromises);
      }

      toast.success('Trip created successfully!', {
        description: `Trip ID: ${validatedData.tripId}`,
      });

      resetForm();

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      toast.error('Failed to create trip', {
        description: 'Please check the details and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="grid gap-6 py-4">
        {/* Display current location info */}
        {userLocation ? (
          <div className="text-sm text-muted-foreground mb-4">
            <strong>Current Location:</strong> {userLocation}
          </div>
        ) : (
          <div className="text-sm text-yellow-600 mb-4">
            <strong>Warning:</strong> Unable to determine your location. Please refresh the page.
          </div>
        )}

        {/* Row 1: Starting Point, Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 hidden">
            <Label htmlFor="tripId">Trip ID</Label>
            <Input
              id="tripId"
              placeholder="Generating Trip ID..."
              value={formData.tripId}
              readOnly
              disabled={true}
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startingPoint">Origin</Label>
            <Input
              id="startingPoint"
              placeholder="Enter origin location"
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
            <Label htmlFor="type">Trip Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select trip type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ready to ship">Ready to Ship</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Driver, Truck, Number of Stops */}
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
                  placeholder={isLoadingDrivers ? 'Loading drivers...' : 'Select a driver'}
                />
              </SelectTrigger>
              <SelectContent>
                {!isLoadingDrivers &&
                  drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.driverName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="truck">Vehicle Number</Label>
            <Input
              disabled={true}
              id="truck"
              placeholder="Enter vehicle number (or select driver)"
              value={formData.truck}
              onChange={(e) => handleInputChange('truck', e.target.value)}
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

        {/* Row 3: Start Date, Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {formData.type === 'active' && (
            <div className="space-y-2">
              <Label htmlFor="currentStatus">Current Status</Label>
              <Select
                value={formData.currentStatus}
                onValueChange={(value: 'Delivering' | 'Returning') =>
                  handleInputChange('currentStatus', value)
                }
                required={formData.type === 'active'}
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

        {/* Add this section after the last form field group and before the buttons */}
        <div className="space-y-4">
          <Label className="font-bold">Select Orders for this Trip</Label>
          <div className="text-sm text-muted-foreground mb-2">
            Number of stops in this trip: {selectedOrderIds.length}
          </div>
          <ScrollArea className="h-[200px] border rounded-md p-4">
            {isLoadingOrders ? (
              <div className="text-center py-4">Loading orders...</div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-4">No orders ready for transport</div>
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
                      <span className="flex items-center gap-1">
                        <span className="flex gap-2 item-center">
                          <span className="font-medium">{order.docket_id}:</span>
                          {order.client_details} <FaArrowRightLong /> {order.receiver_name},{' '}
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
                        , Units: {order.total_boxes_count}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isSubmitting || isGeneratingId}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isGeneratingId || isLoadingDrivers || !userLocation}
          >
            {isSubmitting ? 'Creating Trip...' : 'Create Trip'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CreateTripForm;
