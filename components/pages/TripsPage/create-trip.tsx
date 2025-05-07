'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getUniqueVerifiedTripId } from '@/lib/createUniqueTripId';
import { useDrivers } from '@/hooks/useDrivers';
import { Driver, Trip } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrders } from '@/hooks/useOrders';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateTripFormProps {
  onSuccess?: () => void;
}

export function CreateTripForm({ onSuccess }: CreateTripFormProps) {
  const { drivers, isLoading: isLoadingDrivers, error: driverError } = useDrivers();
  const { orders, isLoading: isLoadingOrders } = useOrders();
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Define form data with proper types matching the Trip interface
  const [formData, setFormData] = useState<Omit<Trip, 'id' | 'startDate'> & { startDate: string }>({
    tripId: '',
    startingPoint: '',
    destination: '',
    driver: '',
    numberOfStops: 0,
    startDate: new Date().toISOString().split('T')[0], // Set default to current date
    truck: '',
    type: 'unassigned',
    currentStatus: 'NA', // Default to 'NA' for new trips
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

  // Effect to update truck details when driver is selected
  useEffect(() => {
    if (selectedDriver) {
      setFormData((prevData) => ({
        ...prevData,
        driver: selectedDriver.id,
        truck: selectedDriver.driverTruckId || '',
      }));
    }
  }, [selectedDriver]);

  // Filter orders that are ready to transport
  const availableOrders = orders.filter((order) => order.status === 'Ready To Transport');

  const handleDriverChange = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    setSelectedDriver(driver || null);
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
      startingPoint: '',
      destination: '',
      driver: '',
      numberOfStops: 0,
      startDate: '',
      truck: '',
      type: 'unassigned',
      currentStatus: 'NA', // Reset to 'NA'
    });
    setSelectedDriver(null);
    setSelectedOrderIds([]);

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

    // Only validate currentStatus for active trips
    if (formData.type === 'active' && formData.currentStatus === 'NA') {
      toast.error('Please select a valid status (Delivering or Returning) for active trip');
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse and validate form data
      const validatedData: Omit<Trip, 'id'> = {
        ...formData,
        startDate: new Date(formData.startDate),
        numberOfStops: Number(formData.numberOfStops),
        currentStatus: formData.currentStatus,
        driver: selectedDriver?.id || 'Not Assigned',
        truck: selectedDriver?.driverTruckId || 'Not Assigned',
      };

      // Add the trip to Firestore
      const tripRef = await addDoc(collection(db, 'trips'), {
        ...validatedData,
        created_at: new Date(),
      });

      // Create trip_orders document if there are selected orders
      if (selectedOrderIds.length > 0) {
        // Add trip_orders document
        await addDoc(collection(db, 'trip_orders'), {
          tripId: formData.tripId,
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
        {/* Row 1: Trip ID, Starting Point, Destination */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
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
                {driverError && (
                  <SelectItem value="error" disabled>
                    {driverError.message}
                  </SelectItem>
                )}
                {!isLoadingDrivers &&
                  !driverError &&
                  drivers.map((driver) => (
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
              placeholder="Enter truck number (or select driver)"
              value={formData.truck}
              onChange={(e) => handleInputChange('truck', e.target.value)}
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

        {/* Row 3: Start Date, Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <Label>Select Orders for this Trip</Label>
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
                      {order.docket_id} - {order.shipper_details} to {order.receiver_details}
                    </label>
                    {/* add more feilds here... like tat, number of boxes and weight */}
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
          <Button type="submit" disabled={isSubmitting || isGeneratingId || isLoadingDrivers}>
            {isSubmitting ? 'Creating Trip...' : 'Create Trip'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CreateTripForm;
