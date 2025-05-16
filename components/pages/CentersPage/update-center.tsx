'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCenterData = async () => {
      try {
        const centerDoc = await getDoc(doc(db, 'centers', centerId));
        if (centerDoc.exists()) {
          const data = centerDoc.data();
          setFormData({
            name: data.name || '',
            location: data.location || '',
            pincode: data.pincode || '',
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
      // Update center in Firestore
      const centerRef = doc(db, 'centers', centerId);
      await updateDoc(centerRef, {
        ...formData,
        updated_at: new Date(),
      });

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
