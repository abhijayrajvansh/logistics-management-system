'use client';

import { useState } from 'react';
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

interface CreateTripFormProps {
  onSuccess?: () => void;
}

export function CreateTripForm({ onSuccess }: CreateTripFormProps) {
  const [formData, setFormData] = useState({
    id: '',
    startingPoint: '',
    destination: '',
    driver: 'Unassigned',
    numberOfStops: '',
    startDate: '',
    truck: '',
    status: 'unassigned',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Parse and validate form data
      const validatedData = {
        ...formData,
        numberOfStops: parseInt(formData.numberOfStops) || 0,
        startDate: new Date(formData.startDate),
      };

      // Add the trip to Firestore
      const tripRef = await addDoc(collection(db, 'trips'), {
        ...validatedData,
        created_at: new Date(),
      });

      toast.success('Trip created successfully!', {
        description: `Trip ID: ${tripRef.id}`,
      });

      // Reset form after successful submission
      setFormData({
        id: '',
        startingPoint: '',
        destination: '',
        driver: 'Unassigned',
        numberOfStops: '',
        startDate: '',
        truck: '',
        status: 'unassigned',
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

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                id: '',
                startingPoint: '',
                destination: '',
                driver: 'Unassigned',
                numberOfStops: '',
                startDate: '',
                truck: '',
                status: 'unassigned',
              });
            }}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Trip...' : 'Create Trip'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CreateTripForm;
