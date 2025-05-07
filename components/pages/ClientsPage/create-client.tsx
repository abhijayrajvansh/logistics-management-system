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
import { ClientRateCard } from '@/types';

interface CreateClientFormProps {
  onSuccess?: () => void;
}

export function CreateClientForm({ onSuccess }: CreateClientFormProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientDetails: '',
    current_tat: '',
    rateCard: {
      preferance: '',
      pricePerPref: '',
      minPriceWeight: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('rateCard.')) {
      const rateCardField = field.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        rateCard: {
          ...prev.rateCard,
          [rateCardField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse and validate form data
      const rateCard: ClientRateCard = {
        preferance: formData.rateCard.preferance as 'By Weight' | 'Per Boxes',
        pricePerPref: parseFloat(formData.rateCard.pricePerPref),
        minPriceWeight: formData.rateCard.preferance === 'By Weight'
          ? parseFloat(formData.rateCard.minPriceWeight) || 0 // Convert to number or use 0 if empty
          : 'NA'
      };

      // Validate required fields for By Weight option
      if (formData.rateCard.preferance === 'By Weight' && !formData.rateCard.minPriceWeight) {
        toast.error('Please enter minimum price weight');
        setIsSubmitting(false);
        return;
      }

      // Generate a unique client ID (you might want to implement a more sophisticated method)
      const clientId = `CLT${Date.now().toString(36).toUpperCase()}`;

      // Add the client to Firestore
      const clientRef = await addDoc(collection(db, 'clients'), {
        clientId,
        clientName: formData.clientName,
        clientDetails: formData.clientDetails,
        current_tat: new Date(formData.current_tat),
        rateCard,
        created_at: new Date(),
      });

      toast.success('Client created successfully!', {
        description: `Client ID: ${clientId}`,
      });

      // Reset form after successful submission
      setFormData({
        clientName: '',
        clientDetails: '',
        current_tat: '',
        rateCard: {
          preferance: '',
          pricePerPref: '',
          minPriceWeight: '',
        },
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client', {
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
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              placeholder="Enter client name"
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientDetails">Client Details</Label>
            <Input
              id="clientDetails"
              placeholder="Enter client details"
              value={formData.clientDetails}
              onChange={(e) => handleInputChange('clientDetails', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="current_tat">Current TAT</Label>
            <Input
              id="current_tat"
              type="date"
              placeholder="Select TAT date"
              value={formData.current_tat}
              onChange={(e) => handleInputChange('current_tat', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rateCard.preferance">Rate Preference</Label>
            <Select
              value={formData.rateCard.preferance}
              onValueChange={(value) => handleInputChange('rateCard.preferance', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select rate preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="By Weight">By Weight</SelectItem>
                <SelectItem value="Per Boxes">Per Boxes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rateCard.pricePerPref">Price {formData.rateCard.preferance}</Label>
            <Input
              id="rateCard.pricePerPref"
              type="number"
              placeholder={`Enter price ${formData.rateCard.preferance.toLowerCase() || 'preference'}`}
              value={formData.rateCard.pricePerPref}
              onChange={(e) => handleInputChange('rateCard.pricePerPref', e.target.value)}
              required
            />
          </div>
          {formData.rateCard.preferance === 'By Weight' && (
            <div className="space-y-2">
              <Label htmlFor="rateCard.minPriceWeight">Minimum Price By Weight</Label>
              <Input
                id="rateCard.minPriceWeight"
                type="number"
                placeholder="Enter minimum weight for pricing"
                value={formData.rateCard.minPriceWeight}
                onChange={(e) => handleInputChange('rateCard.minPriceWeight', e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                clientName: '',
                clientDetails: '',
                current_tat: '',
                rateCard: {
                  preferance: '',
                  pricePerPref: '',
                  minPriceWeight: '',
                },
              });
            }}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Client...' : 'Create Client'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CreateClientForm;
