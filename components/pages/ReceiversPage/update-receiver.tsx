'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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

interface UpdateReceiverFormProps {
  receiverId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UpdateReceiverForm({ receiverId, onSuccess, onCancel }: UpdateReceiverFormProps) {
  const [formData, setFormData] = useState({
    receiverName: '',
    receiverDetails: '',
    receiverContact: '',
    receiverCity: '',
    receiverZone: '' as 'East' | 'West' | 'North' | 'South' | '',
    pincode: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch receiver data on component mount
  useEffect(() => {
    const fetchReceiverData = async () => {
      try {
        const receiverDoc = await getDoc(doc(db, 'receivers', receiverId));
        if (receiverDoc.exists()) {
          const data = receiverDoc.data();
          setFormData({
            receiverName: data.receiverName || '',
            receiverDetails: data.receiverDetails || '',
            receiverContact: data.receiverContact || '',
            receiverCity: data.receiverCity || '',
            receiverZone: data.receiverZone || '',
            pincode: data.pincode || '',
          });
        } else {
          toast.error('Receiver not found');
          if (onCancel) onCancel();
        }
      } catch (error) {
        console.error('Error fetching receiver:', error);
        toast.error('Failed to load receiver data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceiverData();
  }, [receiverId, onCancel]);

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
      // Update the receiver in Firestore
      const receiverRef = doc(db, 'receivers', receiverId);
      await updateDoc(receiverRef, {
        receiverName: formData.receiverName,
        receiverDetails: formData.receiverDetails,
        receiverContact: formData.receiverContact,
        receiverCity: formData.receiverCity,
        receiverZone: formData.receiverZone,
        pincode: formData.pincode,
        updated_at: new Date(),
      });

      toast.success('Receiver updated successfully!');

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating receiver:', error);
      toast.error('Failed to update receiver', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center">Loading receiver data...</div>;
  }

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="receiverCity">City</Label>
            <Input
              id="receiverCity"
              placeholder="Enter city"
              value={formData.receiverCity}
              onChange={(e) => handleInputChange('receiverCity', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiverZone">Zone</Label>
            <Select
              value={formData.receiverZone}
              onValueChange={(value) => handleInputChange('receiverZone', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="East">East</SelectItem>
                <SelectItem value="West">West</SelectItem>
                <SelectItem value="North">North</SelectItem>
                <SelectItem value="South">South</SelectItem>
              </SelectContent>
            </Select>
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

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating Receiver...' : 'Update Receiver'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default UpdateReceiverForm;
