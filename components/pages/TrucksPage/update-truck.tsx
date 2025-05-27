'use client';

import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, collection } from 'firebase/firestore';
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
import { uploadTruckDocument } from '@/lib/uploadTruckDocument';
import { Truck, TruckDocuments } from '@/types';

interface UpdateTruckFormProps {
  truckId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UpdateTruckForm({ truckId, onSuccess, onCancel }: UpdateTruckFormProps) {
  const [documentFiles, setDocumentFiles] = useState<{ [key: string]: File | File[] }>({});
  const [currentDocuments, setCurrentDocuments] = useState<TruckDocuments | 'NA'>('NA');
  // Track existing permits that should be kept
  const [existingPermits, setExistingPermits] = useState<string[]>([]);
  // Track existing toolkit photos that should be kept
  const [existingToolkitPhotos, setExistingToolkitPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    regNumber: '',
    axleConfig: '',
    ownership: '',
    emiAmount: '',
    insuranceExpiry: '',
    permitExpiry: '',
    odoCurrent: '',
    odoAtLastService: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch truck data on component mount
  useEffect(() => {
    const fetchTruckData = async () => {
      try {
        const truckDoc = await getDoc(doc(db, 'trucks', truckId));
        if (truckDoc.exists()) {
          const data = truckDoc.data() as Truck;

          // Format dates for input fields
          let formattedInsuranceExpiry = '';
          if (data.insuranceExpiry) {
            if (
              'toDate' in data.insuranceExpiry &&
              typeof data.insuranceExpiry.toDate === 'function'
            ) {
              formattedInsuranceExpiry = data.insuranceExpiry.toDate().toISOString().split('T')[0];
            } else if (data.insuranceExpiry instanceof Date) {
              formattedInsuranceExpiry = data.insuranceExpiry.toISOString().split('T')[0];
            } else if (typeof data.insuranceExpiry === 'string') {
              formattedInsuranceExpiry = data.insuranceExpiry;
            }
          }

          let formattedPermitExpiry = '';
          if (data.permitExpiry) {
            if ('toDate' in data.permitExpiry && typeof data.permitExpiry.toDate === 'function') {
              formattedPermitExpiry = data.permitExpiry.toDate().toISOString().split('T')[0];
            } else if (data.permitExpiry instanceof Date) {
              formattedPermitExpiry = data.permitExpiry.toISOString().split('T')[0];
            } else if (typeof data.permitExpiry === 'string') {
              formattedPermitExpiry = data.permitExpiry;
            }
          }

          setFormData({
            regNumber: data.regNumber || '',
            axleConfig: data.axleConfig || '',
            ownership: data.ownership || 'Owned',
            emiAmount: data.emiAmount?.toString() || '',
            insuranceExpiry: formattedInsuranceExpiry,
            permitExpiry: formattedPermitExpiry,
            odoCurrent: data.odoCurrent?.toString() || '',
            odoAtLastService: data.odoAtLastService?.toString() || '',
          });

          // Set current documents
          setCurrentDocuments(data.truckDocuments || 'NA');

          // Set existing permits
          if (
            typeof data.truckDocuments === 'object' &&
            Array.isArray(data.truckDocuments.multiple_state_permits)
          ) {
            setExistingPermits(data.truckDocuments.multiple_state_permits);
          }

          // Set existing toolkit photos
          if (Array.isArray(data.toolkitCount)) {
            setExistingToolkitPhotos(data.toolkitCount);
          }
        } else {
          toast.error('Truck not found');
          if (onCancel) onCancel();
        }
      } catch (error) {
        console.error('Error fetching truck:', error);
        toast.error('Failed to load truck data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTruckData();
  }, [truckId, onCancel]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (field: string, file: File | null, index?: number) => {
    if (!file) {
      // For adding a new empty permit/photo input
      setDocumentFiles((prev) => {
        if (field === 'multiple_state_permits') {
          const permits = Array.isArray(prev.multiple_state_permits)
            ? [...(prev.multiple_state_permits as File[])]
            : [];
          permits.push(null as any); // Add empty slot for new permit
          return {
            ...prev,
            multiple_state_permits: permits,
          };
        } else if (field === 'toolkit_photos') {
          const photos = Array.isArray(prev.toolkit_photos)
            ? [...(prev.toolkit_photos as File[])]
            : [];
          photos.push(null as any); // Add empty slot for new photo
          return {
            ...prev,
            toolkit_photos: photos,
          };
        }
        return prev;
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    if (field === 'multiple_state_permits') {
      setDocumentFiles((prev) => {
        const permits = Array.isArray(prev.multiple_state_permits)
          ? [...(prev.multiple_state_permits as File[])]
          : [];
        if (typeof index === 'number') {
          permits[index] = file;
        } else {
          permits.push(file);
        }
        return {
          ...prev,
          multiple_state_permits: permits,
        };
      });
    } else if (field === 'toolkit_photos') {
      setDocumentFiles((prev) => {
        const photos = Array.isArray(prev.toolkit_photos)
          ? [...(prev.toolkit_photos as File[])]
          : [];
        if (typeof index === 'number') {
          photos[index] = file;
        } else {
          photos.push(file);
        }
        return {
          ...prev,
          toolkit_photos: photos,
        };
      });
    } else {
      // For other document types
      setDocumentFiles((prev) => ({
        ...prev,
        [field]: file,
      }));
    }
  };

  const addNewPermitInput = () => {
    handleFileChange('multiple_state_permits', null);
  };

  const addNewToolkitPhotoInput = () => {
    handleFileChange('toolkit_photos', null);
  };

  const removeExistingPermit = (index: number) => {
    setExistingPermits((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingToolkitPhoto = (index: number) => {
    setExistingToolkitPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewPermit = (index: number) => {
    setDocumentFiles((prev) => {
      if (Array.isArray(prev.multiple_state_permits)) {
        const updatedPermits = [...prev.multiple_state_permits];
        updatedPermits.splice(index, 1);
        return {
          ...prev,
          multiple_state_permits: updatedPermits,
        };
      }
      return prev;
    });
  };

  const removeNewToolkitPhoto = (index: number) => {
    setDocumentFiles((prev) => {
      if (Array.isArray(prev.toolkit_photos)) {
        const updatedPhotos = [...prev.toolkit_photos];
        updatedPhotos.splice(index, 1);
        return {
          ...prev,
          toolkit_photos: updatedPhotos,
        };
      }
      return prev;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validatedData = {
        ...formData,
        emiAmount: parseFloat(formData.emiAmount || '0'),
        odoCurrent: parseInt(formData.odoCurrent),
        odoAtLastService: parseInt(formData.odoAtLastService),
        insuranceExpiry: new Date(formData.insuranceExpiry),
        permitExpiry: new Date(formData.permitExpiry),
        updated_at: new Date(),
      };

      // Upload new documents if any
      const documentUploadPromises = [];
      let updatedDocuments: TruckDocuments =
        typeof currentDocuments === 'object'
          ? { ...currentDocuments }
          : {
              reg_certificate: '',
              five_year_permit: '',
              multiple_state_permits: [],
              pollution_control_certificate: '',
              fitness_certificate: '',
            };

      // Handle regular documents
      for (const [docType, file] of Object.entries(documentFiles)) {
        if (docType === 'multiple_state_permits' || docType === 'toolkit_photos') continue;
        if (file && file instanceof File) {
          documentUploadPromises.push(
            uploadTruckDocument(file, truckId, docType).then((url) => {
              if (docType !== 'multiple_state_permits' && url) {
                (updatedDocuments as any)[docType] = url;
              }
            }),
          );
        }
      }

      // Set the existing permits that should be kept
      updatedDocuments.multiple_state_permits = [...existingPermits];

      // Handle new permit uploads
      const newPermits = documentFiles.multiple_state_permits;
      if (Array.isArray(newPermits)) {
        for (const permitFile of newPermits) {
          if (permitFile instanceof File) {
            // Use timestamp to ensure unique filenames
            documentUploadPromises.push(
              uploadTruckDocument(
                permitFile,
                truckId,
                `multiple_state_permits_${Date.now()}_${permitFile.name}`,
              ).then((url) => {
                if (url) {
                  updatedDocuments.multiple_state_permits.push(url);
                }
              }),
            );
          }
        }
      }

      // Set existing toolkit photos
      const updatedToolkitPhotos = [...existingToolkitPhotos];

      // Handle new toolkit photo uploads
      const newPhotos = documentFiles.toolkit_photos;
      if (Array.isArray(newPhotos)) {
        for (const photoFile of newPhotos) {
          if (photoFile instanceof File) {
            // Use timestamp to ensure unique filenames
            documentUploadPromises.push(
              uploadTruckDocument(
                photoFile,
                truckId,
                `toolkit_photo_${Date.now()}_${photoFile.name}`,
              ).then((url) => {
                if (url) {
                  updatedToolkitPhotos.push(url);
                }
              }),
            );
          }
        }
      }

      await Promise.all(documentUploadPromises);

      // Update truck document in Firestore
      const trucksCollectionRef = collection(db, 'trucks');
      const truckRef = doc(trucksCollectionRef, truckId);

      await updateDoc(truckRef, {
        ...validatedData,
        truckDocuments: Object.values(updatedDocuments).some(
          (v) => v !== '' && (!Array.isArray(v) || v.length > 0),
        )
          ? updatedDocuments
          : 'NA',
        toolkitCount: updatedToolkitPhotos.length > 0 ? updatedToolkitPhotos : 'NA',
      });

      toast.success('Truck updated successfully!');
      setDocumentFiles({});

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating truck:', error);
      toast.error('Failed to update truck', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center">Loading truck data...</div>;
  }

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
            <Label htmlFor="permitExpiry">Permit Expiry Date</Label>
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

        {/* Document Upload Section */}
        <div className="space-y-4">
          <h3 className="font-medium">Update Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Regular document fields */}
            <div className="space-y-2">
              <Label htmlFor="reg_certificate">Registration Certificate</Label>
              {typeof currentDocuments === 'object' && currentDocuments.reg_certificate && (
                <div className="text-sm text-muted-foreground mb-2">Current document uploaded</div>
              )}
              <Input
                id="reg_certificate"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('reg_certificate', e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="five_year_permit">Five Year Permit</Label>
              {typeof currentDocuments === 'object' && currentDocuments.five_year_permit && (
                <div className="text-sm text-muted-foreground mb-2">Current document uploaded</div>
              )}
              <Input
                id="five_year_permit"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('five_year_permit', e.target.files?.[0] || null)}
              />
            </div>

            {/* Multiple State Permits Section */}
            <div className="space-y-2 col-span-2">
              <div className="flex justify-between items-center">
                <Label>Multiple State Permits</Label>
                <Button type="button" variant="outline" size="sm" onClick={addNewPermitInput}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add New Permit
                </Button>
              </div>

              {/* Helper text */}
              <div className="text-sm text-muted-foreground mb-4">
                You can upload multiple state permits. Each permit must be a PDF, JPG, JPEG, or PNG
                file under 5MB.
              </div>

              {/* Existing Permits */}
              {existingPermits.length > 0 && (
                <div className="space-y-2 mb-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Existing Permits
                  </div>
                  {existingPermits.map((permitUrl, index) => (
                    <div key={`existing-${index}`} className="flex items-center gap-2">
                      <div className="flex-1 truncate text-sm border rounded-md p-2">
                        Permit {index + 1}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExistingPermit(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* New Permit Inputs */}
              {Array.isArray(documentFiles.multiple_state_permits) &&
                documentFiles.multiple_state_permits.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      New Permits
                    </div>
                    {documentFiles.multiple_state_permits.map((_, index) => (
                      <div key={`new-${index}`} className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) =>
                            handleFileChange(
                              'multiple_state_permits',
                              e.target.files?.[0] || null,
                              index,
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNewPermit(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pollution_control_certificate">Pollution Control Certificate</Label>
              {typeof currentDocuments === 'object' &&
                currentDocuments.pollution_control_certificate && (
                  <div className="text-sm text-muted-foreground mb-2">
                    Current document uploaded
                  </div>
                )}
              <Input
                id="pollution_control_certificate"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange('pollution_control_certificate', e.target.files?.[0] || null)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fitness_certificate">Fitness Certificate</Label>
              {typeof currentDocuments === 'object' && currentDocuments.fitness_certificate && (
                <div className="text-sm text-muted-foreground mb-2">Current document uploaded</div>
              )}
              <Input
                id="fitness_certificate"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange('fitness_certificate', e.target.files?.[0] || null)
                }
              />
            </div>

            {/* Toolkit Photos Section */}
            <div className="space-y-2 col-span-2">
              <div className="flex justify-between items-center">
                <Label>Toolkit Photos</Label>
                <Button type="button" variant="outline" size="sm" onClick={addNewToolkitPhotoInput}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add New Photo
                </Button>
              </div>

              {/* Helper text */}
              <div className="text-sm text-muted-foreground mb-4">
                You can upload multiple toolkit photos. Each photo must be a JPG, JPEG, or PNG
                file under 5MB.
              </div>

              {/* Existing Photos */}
              {existingToolkitPhotos.length > 0 && (
                <div className="space-y-2 mb-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Existing Photos
                  </div>
                  {existingToolkitPhotos.map((photoUrl, index) => (
                    <div key={`existing-photo-${index}`} className="flex items-center gap-2">
                      <div className="flex-1 truncate text-sm border rounded-md p-2">
                        Photo {index + 1}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExistingToolkitPhoto(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* New Photo Inputs */}
              {Array.isArray(documentFiles.toolkit_photos) &&
                documentFiles.toolkit_photos.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      New Photos
                    </div>
                    {documentFiles.toolkit_photos.map((_, index) => (
                      <div key={`new-photo-${index}`} className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) =>
                            handleFileChange(
                              'toolkit_photos',
                              e.target.files?.[0] || null,
                              index,
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNewToolkitPhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating Truck...' : 'Update Truck'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default UpdateTruckForm;
