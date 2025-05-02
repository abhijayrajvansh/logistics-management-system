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
import { Loader2 } from 'lucide-react';

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
  });

  // Keep track of whether the user has manually edited the truck or status
  const [userOverrides, setUserOverrides] = useState({
    truck: false,
    status: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(true);

  // Fetch drivers data
  const { drivers, isLoading: isLoadingDrivers, error: driversError } = useDrivers();

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

      toast.success('Trip created successfully!', {
        description: `Trip ID: ${formData.tripId}`,
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
      });

      // Reset user overrides
      setUserOverrides({
        truck: false,
        status: false,
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Add small delay before refreshing to allow toast to be visible
      setTimeout(() => {
        window.location.reload();
      }, 1000);
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
              </SelectContent>
            </Select>
            {/* {!!formData.driverDetails && !userOverrides.status && (
              <p className="text-xs text-muted-foreground">
                Auto-set to "assigned" when driver is selected (you can change this)
              </p>
            )} */}
          </div>
        </div>

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
              });

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
