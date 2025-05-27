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
import { uploadTruckDocument } from '@/lib/uploadTruckDocument';
import { Truck, TruckDocuments } from '@/types';

interface UpdateTruckFormProps {
  truckId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UpdateTruckForm({ truckId, onSuccess, onCancel }: UpdateTruckFormProps) {
  const [documentFiles, setDocumentFiles] = useState<{ [key: string]: File }>({});
  const [currentDocuments, setCurrentDocuments] = useState<TruckDocuments | 'NA'>('NA');
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

  const handleDocumentChange = (key: string, file: File) => {
    setDocumentFiles((prev) => ({
      ...prev,
      [key]: file,
    }));
  };

  // Add file change handler
  const handleFileChange = (field: string, file: File | null) => {
    if (file) {
      setDocumentFiles((prev) => ({
        ...prev,
        [field]: file,
      }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse and validate form data
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
        if (docType === 'multiple_state_permits') continue;
        if (file && docType in updatedDocuments) {
          documentUploadPromises.push(
            uploadTruckDocument(file, truckId, docType).then((url: string) => {
              if (docType !== 'multiple_state_permits') {
                (updatedDocuments as any)[docType] = url;
              }
            }),
          );
        }
      }

      // Handle multiple state permits
      if (documentFiles.multiple_state_permits) {
        documentUploadPromises.push(
          uploadTruckDocument(
            documentFiles.multiple_state_permits,
            truckId,
            'multiple_state_permits',
          ).then((url: string) => {
            updatedDocuments.multiple_state_permits = [
              ...(updatedDocuments.multiple_state_permits || []),
              url,
            ];
          }),
        );
      }

      // Wait for all document uploads
      await Promise.all(documentUploadPromises);

      // Update truck data with new document URLs
      const truckRef = doc(db, 'trucks', truckId);
      await updateDoc(truckRef, {
        ...validatedData,
        truckDocuments: Object.values(updatedDocuments).some((v) => v !== '')
          ? updatedDocuments
          : 'NA',
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
            {/* Regular Document Fields */}
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
            <div className="space-y-2">
              <Label htmlFor="multiple_state_permits">Multiple State Permits</Label>
              {typeof currentDocuments === 'object' &&
                currentDocuments.multiple_state_permits &&
                currentDocuments.multiple_state_permits.length > 0 && (
                  <div className="text-sm text-muted-foreground mb-2">
                    {currentDocuments.multiple_state_permits.length} permit(s) uploaded
                  </div>
                )}
              <Input
                id="multiple_state_permits"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  handleFileChange('multiple_state_permits', e.target.files?.[0] || null)
                }
              />
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
