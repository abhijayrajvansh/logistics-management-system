'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
import { Loader2 } from 'lucide-react';

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
  });

  const [docId, setDocId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch drivers data
  const { drivers, isLoading: isLoadingDrivers, error: driversError } = useDrivers();

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
        });
      } catch (error) {
        console.error('Error fetching trip:', error);
        toast.error('Failed to load trip data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTripData();
  }, [tripId, onCancel]);

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

  const handleInputChange = (field: string, value: string) => {
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
        truck: '',
        status: 'unassigned',
      });
    } else {
      // Find the selected driver
      const selectedDriver = drivers.find((d) => d.driverId === driverId);
      if (selectedDriver) {
        setFormData({
          ...formData,
          driver: selectedDriver.driverName,
          driverDetails: selectedDriver,
          truck: selectedDriver.driverTruckNo, // Auto-populate truck field
          status: 'assigned', // Auto-update status to assigned
        });
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // We need the document ID to update the correct document
      if (!docId) {
        toast.error('Cannot update: Document ID not found');
        return;
      }

      // Parse and validate form data
      const validatedData = {
        ...formData,
        numberOfStops: parseInt(formData.numberOfStops) || 0,
        startDate: new Date(formData.startDate),
        updated_at: new Date(),
        // Remove driverDetails from the data we send to Firestore
        driverDetails: undefined,
      };

      // Update the trip in Firestore using the document ID
      const tripRef = doc(db, 'trips', docId);
      await updateDoc(tripRef, validatedData);

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

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
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
              placeholder="Auto-assigned from driver"
              value={formData.truck}
              onChange={(e) => handleInputChange('truck', e.target.value)}
              disabled={!!formData.driverDetails} // Disable if driver is selected
              required
            />
            {!!formData.driverDetails && (
              <p className="text-xs text-muted-foreground">
                Auto-assigned from driver's information
              </p>
            )}
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
              disabled={!!formData.driverDetails} // Disable if driver is selected
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
            {!!formData.driverDetails && (
              <p className="text-xs text-muted-foreground">
                Status automatically set to "assigned" when driver is selected
              </p>
            )}
          </div>
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
