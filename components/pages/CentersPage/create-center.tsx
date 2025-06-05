'use client';

import { useState } from 'react';
import { collection, addDoc, doc, writeBatch } from 'firebase/firestore';
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
import useTrucks from '@/hooks/useTrucks';
import { toast } from 'sonner';

interface CreateCenterFormProps {
  onSuccess?: () => void;
}

export function CreateCenterForm({ onSuccess }: CreateCenterFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    pincode: '',
    selectedTrucks: [] as string[],
  });

  const { trucks, isLoading: isLoadingTrucks } = useTrucks();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const batch = writeBatch(db);

      // Add new center to Firestore
      const centerRef = doc(collection(db, 'centers'));
      batch.set(centerRef, {
        name: formData.name,
        location: formData.location,
        pincode: formData.pincode,
        created_at: new Date(),
      });

      // Create truck-center relationships
      formData.selectedTrucks.forEach((truckId) => {
        const relationshipId = `${truckId}_${centerRef.id}`;
        const relationshipRef = doc(db, 'truck_centers', relationshipId);
        batch.set(relationshipRef, {
          id: relationshipId,
          truckId,
          centerId: centerRef.id,
          createdAt: new Date(),
        });
      });

      // Commit the batch
      await batch.commit();

      toast.success('Center created successfully!');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating center:', error);
      toast.error('Failed to create center', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="grid gap-6 py-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Center Name</Label>
          <Input
            id="name"
            placeholder="Enter center name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Enter center location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            placeholder="Enter pincode"
            value={formData.pincode}
            onChange={(e) => handleInputChange('pincode', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trucks">Assign Trucks</Label>
          {isLoadingTrucks ? (
            <div className="text-sm text-gray-500">Loading trucks...</div>
          ) : (
            <Select
              value="dummy-value"
              onValueChange={(value) => {
                const truck = trucks.find((t) => t.id === value);
                if (truck && !formData.selectedTrucks.includes(truck.id)) {
                  setFormData((prev) => ({
                    ...prev,
                    selectedTrucks: [...prev.selectedTrucks, truck.id],
                  }));
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select trucks to assign" />
              </SelectTrigger>
              <SelectContent>
                {trucks
                  .filter((truck) => !formData.selectedTrucks.includes(truck.id))
                  .map((truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.regNumber}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
          {/* Display selected trucks */}
          <div className="mt-4 flex flex-wrap gap-2">
            {formData.selectedTrucks.map((truckId) => {
              const truck = trucks.find((t) => t.id === truckId);
              if (!truck) return null;
              return (
                <div
                  key={truckId}
                  className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1"
                >
                  <span className="text-sm">{truck.regNumber}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        selectedTrucks: prev.selectedTrucks.filter((id) => id !== truckId),
                      }));
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating Center...' : 'Create Center'}
      </Button>
    </form>
  );
}
