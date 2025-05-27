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

interface CreateTruckFormProps {
  onSuccess?: () => void;
}

export function CreateTruckForm({ onSuccess }: CreateTruckFormProps) {
  const [formData, setFormData] = useState({
    regNumber: '',
    axleConfig: '',
    ownership: 'Owned',
    emiAmount: '',
    insuranceExpiry: '',
    permitExpiry: '',
    odoCurrent: '',
    odoAtLastService: '',
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
      // Parse and validate form data
      const validatedData = {
        ...formData,
        emiAmount: parseFloat(formData.emiAmount || '0'),
        odoCurrent: parseInt(formData.odoCurrent || '0'),
        odoAtLastService: parseInt(formData.odoAtLastService || '0'),
        insuranceExpiry: new Date(formData.insuranceExpiry),
        permitExpiry: new Date(formData.permitExpiry),
        created_at: new Date(),
      };

      // Add the truck to Firestore
      const truckRef = await addDoc(collection(db, 'trucks'), validatedData);

      toast.success('Truck added successfully!', {
        description: `Registration: ${formData.regNumber}`,
      });

      // Reset form after successful submission
      setFormData({
        regNumber: '',
        axleConfig: '',
        ownership: 'Owned',
        emiAmount: '',
        insuranceExpiry: '',
        permitExpiry: '',
        odoCurrent: '',
        odoAtLastService: '',
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating truck:', error);
      toast.error('Failed to add truck', {
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
            <Label htmlFor="regNumber">Registration Number</Label>
            <Input
              id="regNumber"
              placeholder="e.g. TN-01-AB-1234"
              value={formData.regNumber}
              onChange={(e) => handleInputChange('regNumber', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="axleConfig">Axle Configuration</Label>
            <Input
              id="axleConfig"
              placeholder="e.g. 6x2, 4x2"
              value={formData.axleConfig}
              onChange={(e) => handleInputChange('axleConfig', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ownership">Ownership</Label>
            <Select
              value={formData.ownership}
              onValueChange={(value) => handleInputChange('ownership', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select ownership type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Owned">Owned</SelectItem>
                <SelectItem value="OnLoan">On Loan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emiAmount">EMI Amount</Label>
            <Input
              id="emiAmount"
              type="number"
              placeholder="Enter EMI amount"
              value={formData.emiAmount}
              onChange={(e) => handleInputChange('emiAmount', e.target.value)}
              required={formData.ownership === 'OnLoan'}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="insuranceExpiry">Insurance Expiry Date</Label>
            <Input
              id="insuranceExpiry"
              type="date"
              value={formData.insuranceExpiry}
              onChange={(e) => handleInputChange('insuranceExpiry', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="permitExpiry">National Permit</Label>
            <Input
              id="permitExpiry"
              type="date"
              value={formData.permitExpiry}
              onChange={(e) => handleInputChange('permitExpiry', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="odoCurrent">Current Odometer Reading (km)</Label>
            <Input
              id="odoCurrent"
              type="number"
              placeholder="Enter current odometer reading"
              value={formData.odoCurrent}
              onChange={(e) => handleInputChange('odoCurrent', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="odoAtLastService">Odometer at Last Service (km)</Label>
            <Input
              id="odoAtLastService"
              type="number"
              placeholder="Enter odometer at last service"
              value={formData.odoAtLastService}
              onChange={(e) => handleInputChange('odoAtLastService', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // Reset form data
              setFormData({
                regNumber: '',
                axleConfig: '',
                ownership: 'Owned',
                emiAmount: '',
                insuranceExpiry: '',
                permitExpiry: '',
                odoCurrent: '',
                odoAtLastService: '',
              });
            }}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding Truck...' : 'Add Truck'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CreateTruckForm;
