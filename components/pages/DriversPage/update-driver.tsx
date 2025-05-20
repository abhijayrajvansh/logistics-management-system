'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Driver, DriverDocuments, EmergencyContact, ReferredBy, User } from '@/types';
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
import { uploadDriverDocument } from '@/lib/uploadDriverDocument';
import useTrucks from '@/hooks/useTrucks';
import { Badge } from '@/components/ui/badge';
import { ReferralBySelector } from './ReferralBySelector';

interface UpdateDriverFormProps {
  driverId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Update type guard helpers
function isDriverDocuments(docs: Driver['driverDocuments']): docs is DriverDocuments {
  return docs !== 'NA';
}

function isEmergencyContact(contact: Driver['emergencyContact']): contact is EmergencyContact {
  return contact !== 'NA';
}

function isReferredBy(referral: Driver['referredBy']): referral is ReferredBy {
  return referral !== 'NA';
}

export function UpdateDriverForm({ driverId, onSuccess, onCancel }: UpdateDriverFormProps) {
  const { trucks } = useTrucks();
  const [formData, setFormData] = useState<Omit<Driver, 'id' | 'driverId' | 'leaveBalance'>>({
    driverName: '',
    phoneNumber: '',
    languages: [] as string[],
    wheelsCapability: 'NA',
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
            wheelsCapability: data.wheelsCapability || 'NA',
            assignedTruckId: data.assignedTruckId || 'NA',
            status: data.status || 'Inactive',
            emergencyContact: data.emergencyContact || 'NA',
            referredBy: data.referredBy || 'NA',
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

  // Update the handleInputChange function to properly handle wheelsCapability
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

  const handleDocumentUpdate = async () => {
    let updatedDocuments = isDriverDocuments(formData.driverDocuments)
      ? { ...formData.driverDocuments }
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
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await handleDocumentUpdate();
    } catch (error) {
      console.error('Error updating driver:', error);
      toast.error('Failed to update driver', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDocumentExists = (field: keyof DriverDocuments): boolean => {
    if (!formData?.driverDocuments || formData.driverDocuments === 'NA') return false;
    const value = formData.driverDocuments[field];
    return Boolean(value) && typeof value === 'string' && value !== '';
  };

  // Update helper function to handle possible undefined case
  const getDocumentFieldValue = (field: keyof DriverDocuments): string => {
    if (!formData?.driverDocuments || !isDriverDocuments(formData.driverDocuments)) return '';
    const value = formData.driverDocuments[field];
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return value || '';
  };

  // Update helper function to handle possible undefined case
  const hasDocument = (field: keyof DriverDocuments): boolean => {
    if (!formData?.driverDocuments || !isDriverDocuments(formData.driverDocuments)) return false;
    const value = formData.driverDocuments[field];
    return Boolean(value) && value !== '';
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="grid gap-6 py-4">
        {/* Basic Information Section */}
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

        {/* Additional Information Section */}
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

          {/* Wheels Capability */}
          <div className="space-y-2">
            <Label htmlFor="wheelsCapability">Wheels Capability</Label>
            <Select
              value={
                !formData.wheelsCapability || formData.wheelsCapability === 'NA'
                  ? 'NA'
                  : formData.wheelsCapability[0]
              }
              onValueChange={(value) => {
                if (value === 'NA') {
                  setFormData((prev) => ({ ...prev, wheelsCapability: 'NA' }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    wheelsCapability:
                      !prev.wheelsCapability || prev.wheelsCapability === 'NA'
                        ? [value]
                        : Array.isArray(prev.wheelsCapability) &&
                            prev.wheelsCapability.includes(value)
                          ? prev.wheelsCapability.filter((w) => w !== value)
                          : Array.isArray(prev.wheelsCapability)
                            ? [...prev.wheelsCapability, value]
                            : [value],
                  }));
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select wheels capability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NA">Not Specified</SelectItem>
                {['3', '4', '6', '8', '10', '12', '14', '16', '18', '20'].map((wheels) => (
                  <SelectItem key={wheels} value={wheels}>
                    {wheels} Wheeler
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.wheelsCapability && formData.wheelsCapability !== 'NA' && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.wheelsCapability.map((wheel, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {wheel} Wheeler
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          wheelsCapability:
                            !prev.wheelsCapability || prev.wheelsCapability === 'NA'
                              ? ['3']
                              : Array.isArray(prev.wheelsCapability)
                                ? prev.wheelsCapability.filter((_, i) => i !== index)
                                : ['3'],
                        }));
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
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
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="On Trip">On Trip</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Documents Section */}
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
              {hasDocument('aadhar_front') && (
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
              {hasDocument('aadhar_back') && (
                <div className="text-sm text-muted-foreground">Current file uploaded</div>
              )}
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
              {hasDocument('license') && (
                <div className="text-sm text-muted-foreground">Current file uploaded</div>
              )}
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
              {hasDocument('medicalCertificate') && (
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
                value={getDocumentFieldValue('dob')}
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
              {hasDocument('dob_certificate') && (
                <div className="text-sm text-muted-foreground">Current file uploaded</div>
              )}
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

        {/* Truck Assignment Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Truck Assignment</h3>
          <div className="grid grid-cols-1 gap-4">
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
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Emergency Contact (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          residencyAddress:
                            prev.emergencyContact !== 'NA'
                              ? (prev.emergencyContact as EmergencyContact).residencyAddress
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
                            residencyAddress: '',
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
            <div className="space-y-2 col-span-2">
              <Label htmlFor="emergency_address">Residency Address</Label>
              <Input
                id="emergency_address"
                placeholder="Enter complete residency address"
                onChange={(e) => {
                  const residencyAddress = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    emergencyContact:
                      prev.emergencyContact !== 'NA'
                        ? {
                            ...(prev.emergencyContact as EmergencyContact),
                            residencyAddress,
                          }
                        : {
                            name: '',
                            number: '',
                            residencyAddress,
                            residencyProof: '',
                          },
                  }));
                }}
                value={
                  formData.emergencyContact !== 'NA'
                    ? (formData.emergencyContact as EmergencyContact).residencyAddress
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
                  }
                }}
              />
              {formData.emergencyContact !== 'NA' &&
                (formData.emergencyContact as EmergencyContact).residencyProof && (
                  <div className="text-sm text-muted-foreground">Current file uploaded</div>
                )}
            </div>
          </div>
        </div>

        {/* Referral Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Referral Information (Optional)</h3>
          <ReferralBySelector
            value={formData.referredBy || 'NA'}
            onChange={(value) => setFormData((prev) => ({ ...prev, referredBy: value }))}
          />
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
