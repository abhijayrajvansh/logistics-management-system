'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
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

interface CreateTripFormProps {
  onSuccess?: () => void;
}

export function CreateTripForm({ onSuccess }: CreateTripFormProps) {
  const { drivers, isLoading: isLoadingDrivers, error: driverError } = useDrivers();

  // Define form data with proper types matching the Trip interface
  const [formData, setFormData] = useState<Omit<Trip, 'id' | 'startDate'> & { startDate: string }>({
    tripId: '',
    startingPoint: '',
    destination: '',
    driver: '',
    numberOfStops: 0,
    startDate: '',
    truck: '',
    type: 'unassigned',
    currentStatus: 'NA', // Default to 'NA' for new trips
  });

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(true);

  // Generate a unique trip ID when the component mounts
  useEffect(() => {
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

    generateUniqueId();
  }, []);

  // Effect to update truck details when driver is selected
  useEffect(() => {
    if (selectedDriver) {
      setFormData((prevData) => ({
        ...prevData,
        driver: selectedDriver.id,
        truck: selectedDriver.driverTruckNo || '',
      }));
    }
  }, [selectedDriver]);

  const handleDriverChange = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    setSelectedDriver(driver || null);
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
      const validatedData: Omit<Trip, 'id'> = {
        ...formData,
        startDate: new Date(formData.startDate),
        numberOfStops: Number(formData.numberOfStops),
        currentStatus: formData.currentStatus,
      };

      // Add the trip to Firestore
      const tripRef = await addDoc(collection(db, 'trips'), {
        ...validatedData,
        created_at: new Date(),
      });

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
                    {driverError}
                  </SelectItem>
                )}
                {!isLoadingDrivers &&
                  !driverError &&
                  drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.driverName} ({driver.driverTruckNo || 'No Truck Assigned'})
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
            disabled={isSubmitting || isGeneratingId || isLoadingDrivers || !selectedDriver}
          >
            {isSubmitting ? 'Creating Trip...' : 'Create Trip'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CreateTripForm;
