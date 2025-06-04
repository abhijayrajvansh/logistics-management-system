'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { uploadProofOfDeliveryPhoto } from '@/lib/uploadProofOfDelivery';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { ProofOfDelivery } from '@/types';
import { Plus, X, Upload } from 'lucide-react';

interface UploadProofOfDeliveryProps {
  orderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UploadProofOfDelivery({ orderId, onSuccess, onCancel }: UploadProofOfDeliveryProps) {
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoInputs, setPhotoInputs] = useState<number[]>([0]); // Start with one input
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (file: File | null, index: number) => {
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, and PNG files are allowed');
      return;
    }

    setPhotoFiles((prev) => {
      const updatedFiles = [...prev];
      updatedFiles[index] = file;
      return updatedFiles;
    });
  };

  const addPhotoInput = () => {
    setPhotoInputs((prev) => [...prev, prev.length]);
  };

  const removePhotoInput = (indexToRemove: number) => {
    if (photoInputs.length === 1) return; // Don't remove the last input

    setPhotoInputs((prev) => prev.filter((_, index) => index !== indexToRemove));
    setPhotoFiles((prev) => {
      const updatedFiles = [...prev];
      updatedFiles.splice(indexToRemove, 1);
      return updatedFiles;
    });
  };

  const handleUpload = async () => {
    const validFiles = photoFiles.filter((file) => file instanceof File);
    
    if (validFiles.length === 0) {
      toast.error('Please select at least one photo to upload');
      return;
    }

    setIsUploading(true);

    try {
      // Upload all photos
      const uploadPromises = validFiles.map((file, index) =>
        uploadProofOfDeliveryPhoto(file, orderId, index)
      );

      const photoUrls = await Promise.all(uploadPromises);
      
      // Filter out any failed uploads
      const successfulUploads = photoUrls.filter((url) => url !== '');

      if (successfulUploads.length === 0) {
        throw new Error('All photo uploads failed');
      }

      // Create proof of delivery object
      const proofOfDelivery: ProofOfDelivery = {
        photo: successfulUploads,
      };

      // Update the order document in Firestore
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        proof_of_delivery: proofOfDelivery,
        updated_at: new Date(),
      });

      toast.success(`Successfully uploaded ${successfulUploads.length} proof of delivery photo(s)!`);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error uploading proof of delivery photos:', error);
      toast.error('Failed to upload proof of delivery photos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-base font-medium">Upload Proof of Delivery Photos</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPhotoInput}
            disabled={isUploading}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Photo
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          Upload photos as proof of delivery. Each photo must be a JPG, JPEG, or PNG file under 5MB.
        </div>

        <div className="space-y-3">
          {photoInputs.map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, index)}
                  disabled={isUploading}
                />
              </div>
              {photoInputs.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePhotoInput(index)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={isUploading || photoFiles.filter(f => f instanceof File).length === 0}
        >
          {isUploading ? (
            'Uploading...'
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Photos
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
