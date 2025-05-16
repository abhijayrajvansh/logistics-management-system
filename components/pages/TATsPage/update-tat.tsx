'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import useClients from '@/hooks/useClients';
import useReceivers from '@/hooks/useReceivers';
import useCenters from '@/hooks/useCenters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UpdateTATFormProps {
  tatId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UpdateTATForm({ tatId, onSuccess, onCancel }: UpdateTATFormProps) {
  const { clients, isLoading: isLoadingClients } = useClients();
  const { receivers, isLoading: isLoadingReceivers } = useReceivers();
  const { centers, isLoading: isLoadingCenters } = useCenters();

  const [formData, setFormData] = useState({
    center_id: '',
    client_id: '',
    receiver_id: '',
    tat_value: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTATData = async () => {
      try {
        const tatDoc = await getDoc(doc(db, 'tats', tatId));
        if (tatDoc.exists()) {
          const data = tatDoc.data();

          // Find the entities by pincode
          const matchedCenter = centers.find((c) => c.pincode === data.center_pincode);
          const matchedClient = clients.find((c) => c.pincode === data.client_pincode);
          const matchedReceiver = receivers.find((r) => r.pincode === data.receiver_pincode);

          setFormData({
            center_id: matchedCenter?.id || '',
            client_id: matchedClient?.id || '',
            receiver_id: matchedReceiver?.id || '',
            tat_value: data.tat_value?.toString() || '',
          });
        } else {
          toast.error('TAT mapping not found');
          if (onCancel) onCancel();
        }
      } catch (error) {
        console.error('Error fetching TAT data:', error);
        toast.error('Failed to load TAT data');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isLoadingCenters && !isLoadingClients && !isLoadingReceivers) {
      fetchTATData();
    }
  }, [
    tatId,
    onCancel,
    centers,
    clients,
    receivers,
    isLoadingCenters,
    isLoadingClients,
    isLoadingReceivers,
  ]);

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
      // Find the selected entities to get their pincodes
      const selectedCenter = centers.find((c) => c.id === formData.center_id);
      const selectedClient = clients.find((c) => c.id === formData.client_id);
      const selectedReceiver = receivers.find((r) => r.id === formData.receiver_id);

      if (!selectedCenter || !selectedClient || !selectedReceiver) {
        throw new Error('Please select all required fields');
      }

      // Check for existing mapping, excluding current TAT
      const tatsRef = collection(db, 'tats');
      const duplicateQuery = query(
        tatsRef,
        where('center_pincode', '==', selectedCenter.pincode),
        where('client_pincode', '==', selectedClient.pincode),
        where('receiver_pincode', '==', selectedReceiver.pincode),
      );

      const duplicateSnapshot = await getDocs(duplicateQuery);
      const hasDuplicate = duplicateSnapshot.docs.some((doc) => doc.id !== tatId);
      if (hasDuplicate) {
        throw new Error(
          'A TAT mapping already exists for this combination of center, client, and receiver',
        );
      }

      // Validate and parse form data with pincodes
      const validatedData = {
        center_pincode: selectedCenter.pincode,
        client_pincode: selectedClient.pincode,
        receiver_pincode: selectedReceiver.pincode,
        tat_value: parseInt(formData.tat_value),
        updated_at: new Date(),
      };

      // Update the TAT mapping in Firestore
      const tatRef = doc(db, 'tats', tatId);
      await updateDoc(tatRef, validatedData);

      toast.success('TAT mapping updated successfully!');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating TAT mapping:', error);
      toast.error('Failed to update TAT mapping', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isLoadingCenters || isLoadingClients || isLoadingReceivers) {
    return <div className="py-8 text-center">Loading TAT data...</div>;
  }

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="center">Center</Label>
            <Select
              value={formData.center_id}
              onValueChange={(value) => handleInputChange('center_id', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={isLoadingCenters ? 'Loading centers...' : 'Select a center'}
                />
              </SelectTrigger>
              <SelectContent>
                {centers.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => handleInputChange('client_id', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={isLoadingClients ? 'Loading clients...' : 'Select a client'}
                />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.clientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="receiver">Receiver</Label>
            <Select
              value={formData.receiver_id}
              onValueChange={(value) => handleInputChange('receiver_id', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={isLoadingReceivers ? 'Loading receivers...' : 'Select a receiver'}
                />
              </SelectTrigger>
              <SelectContent>
                {receivers.map((receiver) => (
                  <SelectItem key={receiver.id} value={receiver.id}>
                    {receiver.receiverName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tat_value">TAT (Hours)</Label>
            <Input
              id="tat_value"
              type="number"
              placeholder="Enter TAT in hours"
              value={formData.tat_value}
              onChange={(e) => handleInputChange('tat_value', e.target.value)}
              required
              min="1"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating TAT Mapping...' : 'Update TAT Mapping'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default UpdateTATForm;
