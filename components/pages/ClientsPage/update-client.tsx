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
import { ClientRateCard } from '@/types';

interface UpdateClientFormProps {
  clientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UpdateClientForm({ clientId, onSuccess, onCancel }: UpdateClientFormProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientDetails: '',
    pincode: '',
    rateCard: {
      preferance: '',
      pricePerPref: '',
      minPriceWeight: '',
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch client data on component mount
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const clientDoc = await getDoc(doc(db, 'clients', clientId));
        if (clientDoc.exists()) {
          const data = clientDoc.data();
          setFormData({
            clientName: data.clientName || '',
            clientDetails: data.clientDetails || '',
            pincode: data.pincode || '',
            rateCard: {
              preferance: data.rateCard.preferance || '',
              pricePerPref: data.rateCard.pricePerPref?.toString() || '',
              minPriceWeight: data.rateCard.minPriceWeight?.toString() || '',
            },
          });
        } else {
          toast.error('Client not found');
          if (onCancel) onCancel();
        }
      } catch (error) {
        console.error('Error fetching client:', error);
        toast.error('Failed to load client data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [clientId, onCancel]);

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
        preferance: formData.rateCard.preferance as 'By Weight' | 'Per Units',
        pricePerPref: parseFloat(formData.rateCard.pricePerPref),
        minPriceWeight:
          formData.rateCard.preferance === 'By Weight'
            ? parseFloat(formData.rateCard.minPriceWeight) || 0
            : 'NA',
      };

      // Validate required fields for By Weight option
      if (formData.rateCard.preferance === 'By Weight' && !formData.rateCard.minPriceWeight) {
        toast.error('Please enter minimum price weight');
        setIsSubmitting(false);
        return;
      }

      // Update the client in Firestore
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        clientName: formData.clientName,
        clientDetails: formData.clientDetails,
        pincode: formData.pincode,
        rateCard,
        updated_at: new Date(),
      });

      toast.success('Client updated successfully!');

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center">Loading client data...</div>;
  }

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
                <SelectItem value="Per Units">Per Units</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rateCard.pricePerPref">Price per {formData.rateCard.preferance}</Label>
            <Input
              id="rateCard.pricePerPref"
              type="number"
              placeholder={`Enter price per ${formData.rateCard.preferance.toLowerCase() || 'preference'}`}
              value={formData.rateCard.pricePerPref}
              onChange={(e) => handleInputChange('rateCard.pricePerPref', e.target.value)}
              required
            />
          </div>
          {formData.rateCard.preferance === 'By Weight' && (
            <div className="space-y-2">
              <Label htmlFor="rateCard.minPriceWeight">Minimum Price Weight (kg)</Label>
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating Client...' : 'Update Client'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default UpdateClientForm;
