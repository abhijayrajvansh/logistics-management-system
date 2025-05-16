'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateCenterFormProps {
  onSuccess?: () => void;
}

export function CreateCenterForm({ onSuccess }: CreateCenterFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    pincode: '',
  });

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
      // Add new center to Firestore
      await addDoc(collection(db, 'centers'), {
        ...formData,
        created_at: new Date(),
      });

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
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating Center...' : 'Create Center'}
      </Button>
    </form>
  );
}
