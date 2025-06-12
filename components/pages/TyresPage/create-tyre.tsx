'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

interface CreateTyreFormProps {
  onSuccess?: () => void;
}

export function CreateTyreForm({ onSuccess }: CreateTyreFormProps) {
  const [formData, setFormData] = useState({
    company: '',
    size: '',
    status: 'READY_TO_USE',
    purchaseDate: '',
    currentTruckNumber: '',
    currentTruckType: '',
    currentPosition: '',
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
      // Prepare current position data
      let currentPosition: any = 'NA';
      if (formData.status === 'ACTIVE' && formData.currentTruckNumber && formData.currentPosition) {
        currentPosition = {
          truckNumber: formData.currentTruckNumber,
          truckType: formData.currentTruckType || '',
          position: formData.currentPosition,
        };
      }

      // Create tyre data
      const tyreData = {
        company: formData.company,
        size: formData.size,
        purchaseDate: new Date(formData.purchaseDate),
        status: formData.status,
        currentPosition,
        history: 'NA',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add the tyre to Firestore
      await addDoc(collection(db, 'tyres'), tyreData);

      toast.success('Tyre added successfully!', {
        description: `Company: ${formData.company}, Size: ${formData.size}`,
      });

      // Reset form
      setFormData({
        company: '',
        size: '',
        status: 'READY_TO_USE',
        purchaseDate: '',
        currentTruckNumber: '',
        currentTruckType: '',
        currentPosition: '',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating tyre:', error);
      toast.error('Failed to add tyre', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available positions based on selected size
  const getAvailablePositions = (size: string): string[] => {
    const sizeMap: Record<string, string[]> = {
      '10 R 20': [
        'FL',
        'FR',
        'DLO',
        'DLI',
        'DRI',
        'DRO',
        'LL',
        'LR',
        'SLO',
        'SLI',
        'SRI',
        'SRO',
        'SFL',
        'SFR',
        'SRL',
        'SRR',
        'LLO',
        'LLI',
        'LRI',
        'LRO',
      ],
      '9 R 20': [
        'FSLO',
        'FSLI',
        'FSRI',
        'FSRO',
        'RSLO',
        'RSLI',
        'RSRI',
        'RSRO',
        'LLO',
        'LLI',
        'LRI',
        'LRO',
      ],
    };

    return sizeMap[size] || [];
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="e.g. MRF, CEAT, JK Tyre"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Select
              value={formData.size}
              onValueChange={(value) => {
                handleInputChange('size', value);
                // Reset position when size changes
                handleInputChange('currentPosition', '');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select tyre size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10 R 20">10 R 20</SelectItem>
                <SelectItem value="9 R 20">9 R 20</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="RETIRED">Retired</SelectItem>
                <SelectItem value="UNDER_RETRADING">Under Retrading</SelectItem>
                <SelectItem value="READY_TO_USE">Ready to Use</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Current Position Section - Only show if status is ACTIVE */}
        {formData.status === 'ACTIVE' && (
          <>
            <div className="space-y-4">
              <h3 className="font-medium">Current Position (Required for Active Tyres)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentTruckNumber">Truck Number</Label>
                  <Input
                    id="currentTruckNumber"
                    placeholder="e.g. TN-01-AB-1234"
                    value={formData.currentTruckNumber}
                    onChange={(e) => handleInputChange('currentTruckNumber', e.target.value)}
                    required={formData.status === 'ACTIVE'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentTruckType">Truck Type</Label>
                  <Input
                    id="currentTruckType"
                    placeholder="e.g. Heavy, Medium"
                    value={formData.currentTruckType}
                    onChange={(e) => handleInputChange('currentTruckType', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentPosition">Position</Label>
                <Select
                  value={formData.currentPosition}
                  onValueChange={(value) => handleInputChange('currentPosition', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailablePositions(formData.size).map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                company: '',
                size: '',
                status: 'READY_TO_USE',
                purchaseDate: '',
                currentTruckNumber: '',
                currentTruckType: '',
                currentPosition: '',
              });
            }}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding Tyre...' : 'Add Tyre'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CreateTyreForm;
