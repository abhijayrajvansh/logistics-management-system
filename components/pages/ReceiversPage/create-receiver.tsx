'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateReceiverFormProps {
  onSuccess?: () => void;
}

export function CreateReceiverForm({ onSuccess }: CreateReceiverFormProps) {
  const [formData, setFormData] = useState({
    receiverName: '',
    receiverDetails: '',
    receiverContact: '',
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
      // Generate a unique receiver ID
      const receiverId = `RCV${Date.now().toString(36).toUpperCase()}`;

      // Add the receiver to Firestore
      const receiverRef = await addDoc(collection(db, 'receivers'), {
        receiverId,
        receiverName: formData.receiverName,
        receiverDetails: formData.receiverDetails,
        receiverContact: formData.receiverContact,
        created_at: new Date(),
      });

      toast.success('Receiver created successfully!', {
        description: `Receiver ID: ${receiverId}`,
      });

      // Reset form after successful submission
      setFormData({
        receiverName: '',
        receiverDetails: '',
        receiverContact: '',
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating receiver:', error);
      toast.error('Failed to create receiver', {
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
            <Label htmlFor="receiverName">Receiver Name</Label>
            <Input
              id="receiverName"
              placeholder="Enter receiver name"
              value={formData.receiverName}
              onChange={(e) => handleInputChange('receiverName', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiverContact">Contact Number</Label>
            <Input
              id="receiverContact"
              placeholder="Enter contact number"
              value={formData.receiverContact}
              onChange={(e) => handleInputChange('receiverContact', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="receiverDetails">Receiver Details</Label>
          <Input
            id="receiverDetails"
            placeholder="Enter receiver details"
            value={formData.receiverDetails}
            onChange={(e) => handleInputChange('receiverDetails', e.target.value)}
            required
          />
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                receiverName: '',
                receiverDetails: '',
                receiverContact: '',
              });
            }}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Receiver...' : 'Create Receiver'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CreateReceiverForm;
