'use client';

import { useState } from 'react';
import { toast } from 'sonner';
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
import { Driver } from '@/types';
import { db } from '@/firebase/database';
import { collection, addDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

interface CreateDriverFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateDriverForm({ onSuccess, onCancel }: CreateDriverFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    driverName: '',
    phoneNumber: '',
    languages: [] as string[],
    driverTruckId: '',
    status: 'Inactive' as Driver['status'],
    driverDocuments: {
      aadhar: '',
      dob: new Date(),
      license: '',
      insurance: '',
      medicalCertificate: '',
      panCard: '',
    },
  });

  const handleLanguageChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(value)
        ? prev.languages.filter((lang) => lang !== value)
        : [...prev.languages, value],
    }));
  };

  const handleInputChange = (field: string, value: string | Date) => {
    setFormData((prev) => {
      if (field.startsWith('driverDocuments.')) {
        const [_, documentField] = field.split('.');
        return {
          ...prev,
          driverDocuments: {
            ...prev.driverDocuments,
            [documentField]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate a unique driver ID
      const driverId = 'DRV' + Date.now().toString().slice(-6);

      const driverData: Driver = {
        id: '', // Will be set by Firestore
        driverId,
        ...formData,
      };

      // Add the driver to Firestore
      const driversRef = collection(db, 'drivers');
      await addDoc(driversRef, {
        ...driverData,
        created_at: new Date(),
      });

      toast.success('Driver created successfully');
      onSuccess?.();

      // Reset form
      setFormData({
        driverName: '',
        phoneNumber: '',
        languages: [],
        driverTruckId: '',
        status: 'Inactive',
        driverDocuments: {
          aadhar: '',
          dob: new Date(),
          license: '',
          insurance: '',
          medicalCertificate: '',
          panCard: '',
        },
      });
    } catch (error) {
      console.error('Error creating driver:', error);
      toast.error('Failed to create driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="driverName">Driver Name</Label>
            <Input
              id="driverName"
              placeholder="Enter driver name"
              value={formData.driverName}
              onChange={(e) => handleInputChange('driverName', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              placeholder="+91-0000000000"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="language">Languages</Label>
            <Select onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
                <SelectItem value="Punjabi">Punjabi</SelectItem>
                <SelectItem value="Gujarati">Gujarati</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 mt-2">
              {formData.languages.map((lang, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {lang}
                  <button
                    type="button"
                    onClick={() => {
                      const newLanguages = formData.languages.filter((_, i) => i !== index);
                      setFormData((prev) => ({
                        ...prev,
                        language: newLanguages,
                      }));
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="driverTruckId">Truck ID (Optional)</Label>
            <Input
              id="driverTruckId"
              placeholder="Enter truck ID"
              value={formData.driverTruckId}
              onChange={(e) => handleInputChange('driverTruckId', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status || 'Inactive'}
            onValueChange={(value) => handleInputChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select driver status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="OnLeave">On Leave</SelectItem>
              <SelectItem value="OnTrip">On Trip</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Documents</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aadhar">Aadhar Card</Label>
              <Input
                id="aadhar"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  handleInputChange('driverDocuments.aadhar', e.target.files?.[0]?.name || '');
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license">Driving License</Label>
              <Input
                id="license"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  handleInputChange('driverDocuments.license', e.target.files?.[0]?.name || '');
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance">Insurance</Label>
              <Input
                id="insurance"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  handleInputChange('driverDocuments.insurance', e.target.files?.[0]?.name || '');
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalCertificate">Medical Certificate</Label>
              <Input
                id="medicalCertificate"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  handleInputChange(
                    'driverDocuments.medicalCertificate',
                    e.target.files?.[0]?.name || '',
                  );
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="panCard">PAN Card</Label>
              <Input
                id="panCard"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  handleInputChange('driverDocuments.panCard', e.target.files?.[0]?.name || '');
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                onChange={(e) => handleInputChange('driverDocuments.dob', new Date(e.target.value))}
                value={
                  formData.driverDocuments.dob instanceof Date
                    ? formData.driverDocuments.dob.toISOString().split('T')[0]
                    : ''
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Driver'}
          </Button>
        </div>
      </div>
    </form>
  );
}
