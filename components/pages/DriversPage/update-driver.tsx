'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Driver, DriverDocuments } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { uploadDriverDocument } from '@/lib/uploadDriverDocument';

interface UpdateDriverFormProps {
  driverId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UpdateDriverForm({ driverId, onSuccess, onCancel }: UpdateDriverFormProps) {
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

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<{ [key: string]: File }>({});
  // Add validation state for required documents
  const [validDocuments, setValidDocuments] = useState<{ [key: string]: boolean }>({
    aadhar_front: false,
    aadhar_back: false,
    license: false,
    medicalCertificate: false,
    dob_certificate: false,
  });
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const driverDoc = await getDoc(doc(db, 'drivers', driverId));
        if (driverDoc.exists()) {
          const data = driverDoc.data();
          setFormData({
            driverName: data.driverName || '',
            phoneNumber: data.phoneNumber || '',
            languages: data.languages || [],
            driverTruckId: data.driverTruckId || '',
            status: data.status || 'Inactive',
            driverDocuments: {
              ...data.driverDocuments,
              dob: data.driverDocuments?.dob?.toDate() || new Date(),
              license_expiry: data.driverDocuments?.license_expiry?.toDate() || new Date(),
            },
          });
        } else {
          toast.error('Driver not found');
          if (onCancel) onCancel();
        }
      } catch (error) {
        console.error('Error fetching driver:', error);
        toast.error('Failed to load driver data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriverData();
  }, [driverId, onCancel]);

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

  const handleFileChange = (field: string, file: File | null) => {
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${field} file size exceeds 5MB limit`);
        // Clear the file from state and mark as invalid
        setDocumentFiles((prev) => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
        setValidDocuments((prev) => ({
          ...prev,
          [field]: false,
        }));
        return;
      }
      // File is valid, update states
      setDocumentFiles((prev) => ({
        ...prev,
        [field]: file,
      }));
      setValidDocuments((prev) => ({
        ...prev,
        [field]: true,
      }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let updatedDocuments = { ...formData.driverDocuments };

      // Upload any new documents that were added
      const documentUploadPromises = [];

      if (documentFiles.aadhar_front) {
        documentUploadPromises.push(
          uploadDriverDocument(documentFiles.aadhar_front, driverId, 'aadhar_front').then((url) => {
            if (url) updatedDocuments.aadhar_front = url;
          }),
        );
      }

      if (documentFiles.aadhar_back) {
        documentUploadPromises.push(
          uploadDriverDocument(documentFiles.aadhar_back, driverId, 'aadhar_back').then((url) => {
            if (url) updatedDocuments.aadhar_back = url;
          }),
        );
      }

      if (documentFiles.license) {
        documentUploadPromises.push(
          uploadDriverDocument(documentFiles.license, driverId, 'license').then((url) => {
            if (url) updatedDocuments.license = url;
          }),
        );
      }

      if (documentFiles.medicalCertificate) {
        documentUploadPromises.push(
          uploadDriverDocument(
            documentFiles.medicalCertificate,
            driverId,
            'medical_certificate',
          ).then((url) => {
            if (url) updatedDocuments.medicalCertificate = url;
          }),
        );
      }

      if (documentFiles.dob_certificate) {
        documentUploadPromises.push(
          uploadDriverDocument(documentFiles.dob_certificate, driverId, 'dob_certificate').then(
            (url) => {
              if (url) updatedDocuments.dob_certificate = url;
            },
          ),
        );
      }

      // Wait for all document uploads to complete
      await Promise.all(documentUploadPromises);

      // Update the driver in Firestore with new document URLs
      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, {
        ...formData,
        driverDocuments: updatedDocuments,
        updated_at: new Date(),
      });

      toast.success('Driver updated successfully!');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating driver:', error);
      toast.error('Failed to update driver', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center">Loading driver data...</div>;
  }

  return (
    <form onSubmit={handleFormSubmit}>
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
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: Driver['status']) => handleInputChange('status', value)}
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
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange('aadhar_front', e.target.files[0]);
                  }
                }}
              />
              {formData.driverDocuments?.aadhar_front && (
                <div className="text-sm text-muted-foreground">Current file uploaded</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="aadhar_back">Aadhar Card Back</Label>
              <Input
                id="aadhar_back"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange('aadhar_back', e.target.files[0]);
                  }
                }}
              />
              {formData.driverDocuments?.aadhar_back && (
                <div className="text-sm text-muted-foreground">Current file uploaded</div>
              )}
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
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange('license', e.target.files[0]);
                  }
                }}
              />
              {formData.driverDocuments?.license && (
                <div className="text-sm text-muted-foreground">Current file uploaded</div>
              )}
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
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange('medicalCertificate', e.target.files[0]);
                  }
                }}
              />
              {formData.driverDocuments?.medicalCertificate && (
                <div className="text-sm text-muted-foreground">Current file uploaded</div>
              )}
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
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange('dob_certificate', e.target.files[0]);
                  }
                }}
              />
              {formData.driverDocuments?.dob_certificate && (
                <div className="text-sm text-muted-foreground">Current file uploaded</div>
              )}
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

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating Driver...' : 'Update Driver'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default UpdateDriverForm;
