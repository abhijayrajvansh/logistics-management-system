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
import { Driver, DriverDocuments } from '@/types';
import { db } from '@/firebase/database';
import { collection, addDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { getUniqueVerifiedDriverId } from '@/lib/createUniqueDriverId';

interface CreateDriverFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateDriverForm({ onSuccess, onCancel }: CreateDriverFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<Driver, 'id' | 'driverId'>>({
    driverName: '',
    phoneNumber: '',
    languages: [] as string[],
    driverTruckId: '',
    status: 'Active' as Driver['status'],
    driverDocuments: {
      aadhar_front: '',
      aadhar_back: '',
      aadhar_number: '',
      dob: new Date(),
      dob_certificate: '',
      license: '',
      license_number: '',
      license_expiry: new Date(),
      medicalCertificate: '',
      status: 'Pending' as DriverDocuments['status'],
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
          } as DriverDocuments,
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
      // Generate a unique numeric driver ID
      const driverId = await getUniqueVerifiedDriverId(db);

      const driverData = {
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
          aadhar_front: '',
          aadhar_back: '',
          aadhar_number: '',
          dob: new Date(),
          dob_certificate: '',
          license: '',
          license_number: '',
          license_expiry: new Date(),
          medicalCertificate: '',
          status: 'Pending',
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="language">Languages</Label>
            <Select onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
                <SelectItem value="Punjabi">Punjabi</SelectItem>
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
                        languages: newLanguages,
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
          <div className="space-y-2 w-full">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || 'Inactive'}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger className="w-full">
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
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Documents</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aadhar_front">Aadhar Card Front</Label>
              <Input
                id="aadhar_front"
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const url = URL.createObjectURL(e.target.files[0]);
                    handleInputChange('driverDocuments.aadhar_front', url);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aadhar_back">Aadhar Card Back</Label>
              <Input
                id="aadhar_back"
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const url = URL.createObjectURL(e.target.files[0]);
                    handleInputChange('driverDocuments.aadhar_back', url);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aadhar_number">Aadhar Number</Label>
              <Input
                id="aadhar_number"
                placeholder="Enter Aadhar number"
                required
                value={formData.driverDocuments?.aadhar_number}
                onChange={(e) => handleInputChange('driverDocuments.aadhar_number', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license">Driving License</Label>
              <Input
                id="license"
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const url = URL.createObjectURL(e.target.files[0]);
                    handleInputChange('driverDocuments.license', url);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                placeholder="Enter license number"
                required
                value={formData.driverDocuments?.license_number}
                onChange={(e) =>
                  handleInputChange('driverDocuments.license_number', e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_expiry">License Expiry Date</Label>
              <Input
                id="license_expiry"
                type="date"
                required
                onChange={(e) =>
                  handleInputChange('driverDocuments.license_expiry', new Date(e.target.value))
                }
                value={
                  formData.driverDocuments?.license_expiry instanceof Date
                    ? formData.driverDocuments.license_expiry.toISOString().split('T')[0]
                    : ''
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalCertificate">Medical Certificate</Label>
              <Input
                id="medicalCertificate"
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const url = URL.createObjectURL(e.target.files[0]);
                    handleInputChange('driverDocuments.medicalCertificate', url);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                required
                onChange={(e) => handleInputChange('driverDocuments.dob', new Date(e.target.value))}
                value={
                  formData.driverDocuments?.dob instanceof Date
                    ? formData.driverDocuments.dob.toISOString().split('T')[0]
                    : ''
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob_certificate">DOB Certificate</Label>
              <Input
                id="dob_certificate"
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const url = URL.createObjectURL(e.target.files[0]);
                    handleInputChange('driverDocuments.dob_certificate', url);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentStatus">Document Status</Label>
              <Select
                value={formData.driverDocuments?.status}
                onValueChange={(value) => handleInputChange('driverDocuments.status', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select document status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                </SelectContent>
              </Select>
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
