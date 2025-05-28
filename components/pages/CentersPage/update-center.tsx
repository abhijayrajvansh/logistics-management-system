'use client';

import { useState, useEffect } from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  collection,
  query,
  where,
  getDocs,
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
import useTrucks from '@/hooks/useTrucks';
import { toast } from 'sonner';

interface UpdateCenterFormProps {
  centerId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UpdateCenterForm({ centerId, onSuccess, onCancel }: UpdateCenterFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    pincode: '',
    selectedTrucks: [] as string[],
  });

  const { trucks, isLoading: isLoadingTrucks } = useTrucks();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCenterData = async () => {
      try {
        // Fetch center data
        const centerDoc = await getDoc(doc(db, 'centers', centerId));
        if (centerDoc.exists()) {
          const data = centerDoc.data();

          // Fetch assigned trucks
          const truckCentersQuery = query(
            collection(db, 'truck_centers'),
            where('centerId', '==', centerId),
          );
          const truckCentersSnapshot = await getDocs(truckCentersQuery);
          const assignedTruckIds = truckCentersSnapshot.docs.map((doc) => doc.data().truckId);

          setFormData({
            name: data.name || '',
            location: data.location || '',
            pincode: data.pincode || '',
            selectedTrucks: assignedTruckIds,
          });
        } else {
          toast.error('Center not found');
          if (onCancel) onCancel();
        }
      } catch (error) {
        console.error('Error fetching center:', error);
        toast.error('Failed to load center data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCenterData();
  }, [centerId, onCancel]);

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

      // Update center in Firestore
      const centerRef = doc(db, 'centers', centerId);
      batch.update(centerRef, {
        name: formData.name,
        location: formData.location,
        pincode: formData.pincode,
        updated_at: new Date(),
      });

      // First, get existing relationships
      const truckCentersQuery = query(
        collection(db, 'truck_centers'),
        where('centerId', '==', centerId),
      );
      const existingRelationships = await getDocs(truckCentersQuery);
      const existingTruckIds = existingRelationships.docs.map((doc) => doc.data().truckId);

      // Delete removed relationships
      existingRelationships.docs.forEach((doc) => {
        if (!formData.selectedTrucks.includes(doc.data().truckId)) {
          batch.delete(doc.ref);
        }
      });

      // Add new relationships
      formData.selectedTrucks.forEach((truckId) => {
        if (!existingTruckIds.includes(truckId)) {
          const relationshipId = `${truckId}_${centerId}`;
          const relationshipRef = doc(db, 'truck_centers', relationshipId);
          batch.set(relationshipRef, {
            id: relationshipId,
            truckId,
            centerId,
            createdAt: new Date(),
          });
        }
      });

      // Commit the batch
      await batch.commit();

      toast.success('Center updated successfully!');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating center:', error);
      toast.error('Failed to update center', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center">Loading center data...</div>;
  }

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

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating Center...' : 'Update Center'}
        </Button>
      </div>
    </form>
  );
}
