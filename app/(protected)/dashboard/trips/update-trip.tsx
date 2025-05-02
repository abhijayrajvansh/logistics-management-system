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
    numberOfStops: '',
    startDate: '',
    truck: '',
    status: '',
  });

  const [docId, setDocId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
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

  if (isLoading) {
    return <div className="py-8 text-center">Loading trip data...</div>;
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
            <Input
              id="driver"
              placeholder="Assign a driver (optional)"
              value={formData.driver}
              onChange={(e) => handleInputChange('driver', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="truck">Truck</Label>
            <Input
              id="truck"
              placeholder="Assign a truck"
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
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
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
