'use client';

import { Badge } from '@/components/ui/badge';
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
import env from '@/constants';
import { createNewUser, createUserWebhook } from '@/firebase/auth/createUserWebhook';
import { db } from '@/firebase/database';
import { getUniqueVerifiedDriverId } from '@/lib/createUniqueDriverId';
import { uploadDriverDocument } from '@/lib/uploadDriverDocument';
import { Driver, DriverDocuments, EmergencyContact, ReferredBy, User } from '@/types';
import { IconLoader } from '@tabler/icons-react';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { toast } from 'sonner';
import useTrucks from '@/hooks/useTrucks';

interface CreateDriverFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Add this helper at the top of the file
function isDriverDocuments(docs: Driver['driverDocuments']): docs is DriverDocuments {
  return docs !== 'NA';
}

export function CreateDriverForm({ onSuccess, onCancel }: CreateDriverFormProps) {
  const { trucks } = useTrucks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<{ [key: string]: File }>({});
  const [validDocuments, setValidDocuments] = useState<{ [key: string]: boolean }>({
    aadhar_front: false,
    aadhar_back: false,
    license: false,
    medicalCertificate: false,
    dob_certificate: false,
  });
  const [formData, setFormData] = useState<Omit<Driver, 'id' | 'driverId'>>({
    driverName: '',
    phoneNumber: '',
    languages: [] as string[],
    wheelsCapability: 4,
    assignedTruckId: 'NA',
    status: 'Active' as Driver['status'],
    emergencyContact: 'NA',
    referredBy: 'NA',
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

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const handleLanguageChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(value)
        ? prev.languages.filter((lang) => lang !== value)
        : [...prev.languages, value],
    }));
  };

  const handleInputChange = (field: string, value: string | number | Date) => {
    setFormData((prev) => {
      if (field.startsWith('driverDocuments.')) {
        const [_, documentField] = field.split('.');
        const currentDocs = isDriverDocuments(prev.driverDocuments)
          ? prev.driverDocuments
          : {
              aadhar_front: '',
              aadhar_back: '',
              aadhar_number: '',
              dob: new Date(),
              dob_certificate: '',
              license: '',
              license_number: '',
              license_expiry: new Date(),
              medicalCertificate: '',
              status: 'Pending' as const,
            };

        return {
          ...prev,
          driverDocuments: {
            ...currentDocs,
            [documentField]: value,
          },
        };
      }
      return { ...prev, [field]: value };
    });
  };

  // Add these helper functions inside CreateDriverForm component
  const getDocumentFieldValue = (field: keyof DriverDocuments): string => {
    if (!isDriverDocuments(formData.driverDocuments)) return '';
    const value = formData.driverDocuments[field];
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return value || '';
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
    } else {
      // No file selected, clear states
      setDocumentFiles((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
      setValidDocuments((prev) => ({
        ...prev,
        [field]: false,
      }));
    }
  };

  // Check if all required documents are valid
  const areAllDocumentsValid = () => {
    return Object.values(validDocuments).every((isValid) => isValid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required documents are present and valid
    if (!areAllDocumentsValid()) {
      toast.error('All documents are required and must be under 5MB');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate a unique numeric driver ID
      const driverId = await getUniqueVerifiedDriverId(db);

      // Upload all documents and get their download URLs
      const documentUploads = await Promise.all([
        uploadDriverDocument(documentFiles.aadhar_front, driverId, 'aadhar_front'),
        uploadDriverDocument(documentFiles.aadhar_back, driverId, 'aadhar_back'),
        uploadDriverDocument(documentFiles.license, driverId, 'license'),
        uploadDriverDocument(documentFiles.medicalCertificate, driverId, 'medical_certificate'),
        uploadDriverDocument(documentFiles.dob_certificate, driverId, 'dob_certificate'),
      ]);

      // If any document upload failed, stop the submission
      if (documentUploads.some((url) => !url)) {
        throw new Error('Failed to upload one or more documents');
      }

      const [
        aadhar_front_url,
        aadhar_back_url,
        license_url,
        medical_certificate_url,
        dob_certificate_url,
      ] = documentUploads;

      const driverData = {
        driverId,
        ...formData,
        driverDocuments: isDriverDocuments(formData.driverDocuments)
          ? {
              ...formData.driverDocuments,
              aadhar_front: aadhar_front_url || '',
              aadhar_back: aadhar_back_url || '',
              license: license_url || '',
              medicalCertificate: medical_certificate_url || '',
              dob_certificate: dob_certificate_url || '',
            }
          : {
              aadhar_front: aadhar_front_url || '',
              aadhar_back: aadhar_back_url || '',
              aadhar_number: '',
              dob: new Date(),
              dob_certificate: dob_certificate_url || '',
              license: license_url || '',
              license_number: '',
              license_expiry: new Date(),
              medicalCertificate: medical_certificate_url || '',
              status: 'Pending' as const,
            },
      };

      // Generate random 6-digit password
      const randomPassword = Math.floor(100000 + Math.random() * 900000).toString();

      // Create user credentials
      const newUser = await createNewUser({
        email: `${driverId}${env.USERID_EMAIL}`,
        password: randomPassword,
        displayName: formData.driverName,
        role: 'driver',
      });

      await createUserWebhook(newUser);

      // Add the driver to Firestore
      const driverDocRef = doc(db, 'drivers', newUser.uid);

      await setDoc(driverDocRef, {
        ...driverData,
        created_at: new Date(),
      });

      toast.success('Driver Onboarded successfully');
      onSuccess?.();

      // Reset form
      setFormData({
        driverName: '',
        phoneNumber: '',
        languages: [],
        wheelsCapability: 4,
        assignedTruckId: 'NA',
        status: 'Inactive',
        emergencyContact: 'NA',
        referredBy: 'NA',
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
      setDocumentFiles({});
    } catch (error) {
      console.error('Error creating driver:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create driver');
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
            <Label htmlFor="assignedTruckId">Assign Truck</Label>
            <Select
              value={formData.assignedTruckId}
              onValueChange={(value) => handleInputChange('assignedTruckId', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select truck" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NA">Not Assigned</SelectItem>
                {trucks.map((truck) => (
                  <SelectItem key={truck.id} value={truck.id}>
                    {truck.regNumber} ({truck.axleConfig})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="On Trip">On Trip</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Documents</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aadhar_front">
                Aadhar Card Front (Max 5MB)
                {!validDocuments.aadhar_front && (
                  <span className="text-red-500 ml-1 text-xl">*</span>
                )}
              </Label>
              <Input
                id="aadhar_front"
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange('aadhar_front', e.target.files[0]);
                  } else {
                    handleFileChange('aadhar_front', null);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aadhar_back">
                Aadhar Card Back (Max 5MB)
                {!validDocuments.aadhar_back && (
                  <span className="text-red-500 ml-1 text-xl">*</span>
                )}
              </Label>
              <Input
                id="aadhar_back"
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange('aadhar_back', e.target.files[0]);
                  } else {
                    handleFileChange('aadhar_back', null);
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
                value={getDocumentFieldValue('aadhar_number')}
                onChange={(e) => handleInputChange('driverDocuments.aadhar_number', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license">
                Driving License (Max 5MB)
                {!validDocuments.license && <span className="text-red-500 ml-1 text-xl">*</span>}
              </Label>
              <Input
                id="license"
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange('license', e.target.files[0]);
                  } else {
                    handleFileChange('license', null);
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
                value={getDocumentFieldValue('license_number')}
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
                value={getDocumentFieldValue('license_expiry')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalCertificate">
                Medical Certificate (Max 5MB)
                {!validDocuments.medicalCertificate && (
                  <span className="text-red-500 ml-1 text-xl">*</span>
                )}
              </Label>
              <Input
                id="medicalCertificate"
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange('medicalCertificate', e.target.files[0]);
                  } else {
                    handleFileChange('medicalCertificate', null);
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
                value={getDocumentFieldValue('dob')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob_certificate">
                DOB Certificate (Max 5MB)
                {!validDocuments.dob_certificate && (
                  <span className="text-red-500 ml-1 text-xl">*</span>
                )}
              </Label>
              <Input
                id="dob_certificate"
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange('dob_certificate', e.target.files[0]);
                  } else {
                    handleFileChange('dob_certificate', null);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentStatus">Document Status</Label>
              <Select
                value={
                  isDriverDocuments(formData.driverDocuments)
                    ? formData.driverDocuments.status
                    : 'Pending'
                }
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

        {/* New Truck Assignment and Additional Fields Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Truck Assignment and Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wheelsCapability">Wheels Capability</Label>
              <Select
                value={formData.wheelsCapability.toString()}
                onValueChange={(value) => handleInputChange('wheelsCapability', parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select wheels capability" />
                </SelectTrigger>
                <SelectContent>
                  {[4, 6, 8, 12].map((wheels) => (
                    <SelectItem key={wheels} value={wheels.toString()}>
                      {wheels} Wheeler
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTruckId">Assign Truck</Label>
              <Select
                value={formData.assignedTruckId}
                onValueChange={(value) => handleInputChange('assignedTruckId', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select truck" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NA">Not Assigned</SelectItem>
                  {trucks.map((truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.regNumber} ({truck.axleConfig})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="On Trip">On Trip</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Emergency Contact (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_name">Name</Label>
              <Input
                id="emergency_name"
                placeholder="Emergency contact name"
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    emergencyContact: name
                      ? {
                          name,
                          number:
                            prev.emergencyContact !== 'NA'
                              ? (prev.emergencyContact as EmergencyContact).number
                              : '',
                          residencyProof:
                            prev.emergencyContact !== 'NA'
                              ? (prev.emergencyContact as EmergencyContact).residencyProof
                              : '',
                        }
                      : 'NA',
                  }));
                }}
                value={
                  formData.emergencyContact !== 'NA'
                    ? (formData.emergencyContact as EmergencyContact).name
                    : ''
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_number">Phone Number</Label>
              <Input
                id="emergency_number"
                placeholder="Emergency contact number"
                onChange={(e) => {
                  const number = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    emergencyContact:
                      prev.emergencyContact !== 'NA'
                        ? {
                            ...(prev.emergencyContact as EmergencyContact),
                            number,
                          }
                        : {
                            name: '',
                            number,
                            residencyProof: '',
                          },
                  }));
                }}
                value={
                  formData.emergencyContact !== 'NA'
                    ? (formData.emergencyContact as EmergencyContact).number
                    : ''
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="residency_proof">Residency Proof</Label>
              <Input
                id="residency_proof"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const file = e.target.files[0];
                    handleFileChange('residency_proof', file);
                    // We'll upload this file later during form submission
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Referral Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Referral Information (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="referral_type">Referred By</Label>
              <Select
                onValueChange={(value: User['role']) => {
                  setFormData((prev) => ({
                    ...prev,
                    referredBy: value
                      ? {
                          type: value,
                          userId:
                            prev.referredBy !== 'NA' ? (prev.referredBy as ReferredBy).userId : '',
                        }
                      : 'NA',
                  }));
                }}
                value={
                  formData.referredBy !== 'NA'
                    ? (formData.referredBy as ReferredBy).type
                    : undefined
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select referral type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral_id">Referrer ID</Label>
              <Input
                id="referral_id"
                placeholder="Enter referrer's ID"
                onChange={(e) => {
                  const userId = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    referredBy:
                      prev.referredBy !== 'NA'
                        ? {
                            ...(prev.referredBy as ReferredBy),
                            userId,
                          }
                        : {
                            type: 'admin',
                            userId,
                          },
                  }));
                }}
                value={
                  formData.referredBy !== 'NA' ? (formData.referredBy as ReferredBy).userId : ''
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !areAllDocumentsValid()}>
            {isSubmitting ? (
              <>
                <IconLoader className="animate-spin mr-2" />
                Creating...{' '}
              </>
            ) : (
              'Create Driver'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
