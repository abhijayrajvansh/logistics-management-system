'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getUniqueVerifiedDocketId } from '@/lib/createUniqueDocketId';
import useClients from '@/hooks/useClients';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateOrderFormProps {
  onSuccess?: () => void;
}

export function CreateOrderForm({ onSuccess }: CreateOrderFormProps) {
  const { clients, isLoading } = useClients();
  const [formData, setFormData] = useState({
    shipper_details: '',
    receiver_details: '',
    total_boxes_count: '',
    dimensions: '',
    total_order_weight: '',
    lr_no: '',
    tat: '',
    charge_basis: '',
    docket_id: '',
    current_location: '<manager-current-location>',
    client_details: '',
    price: '',
    invoice: '',
    status: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(true);

  // Generate a unique docket ID when the component mounts
  useEffect(() => {
    const generateUniqueId = async () => {
      try {
        setIsGeneratingId(true);
        const uniqueDocketId = await getUniqueVerifiedDocketId(db);
        setFormData((prev) => ({ ...prev, docket_id: uniqueDocketId }));
      } catch (error) {
        console.error('Error generating unique docket ID:', error);
      } finally {
        setIsGeneratingId(false);
      }
    };

    generateUniqueId();
  }, []);

  const handleClientChange = (clientId: string) => {
    const selectedClient = clients.find((client) => client.id === clientId);
    if (selectedClient) {
      // Handle Firestore timestamp format
      const tatValue = selectedClient.current_tat;
      let tatDate = '';
      
      try {
        if (tatValue) {
          // Handle Firestore Timestamp
          if (typeof tatValue === 'object' && tatValue !== null && 'seconds' in tatValue) {
            const timestamp = tatValue as { seconds: number };
            tatDate = new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
          }
          // Handle regular Date object
          else if (tatValue instanceof Date) {
            tatDate = tatValue.toISOString().split('T')[0];
          }
        }
      } catch (error) {
        console.error('Error formatting TAT date:', error);
      }
      
      setFormData(prev => ({
        ...prev,
        client_details: selectedClient.clientName,
        shipper_details: `${selectedClient.clientName}\n${selectedClient.clientDetails}`,
        tat: tatDate,
      }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse and validate form data
      const validatedData = {
        ...formData,
        total_boxes_count: parseInt(formData.total_boxes_count),
        total_order_weight: parseInt(formData.total_order_weight),
        price: formData.price ? parseFloat(formData.price) : 0,
        tat: new Date(formData.tat),
      };

      // Add the order to Firestore
      const orderRef = await addDoc(collection(db, 'orders'), {
        ...validatedData,
        created_at: new Date(),
      });

      toast.success('Order created successfully!', {
        description: `Docket ID: ${formData.docket_id}`,
      });

      // Reset form after successful submission
      setFormData({
        shipper_details: '',
        receiver_details: '',
        total_boxes_count: '',

        dimensions: '',
        total_order_weight: '',
        lr_no: '',

        tat: '',
        charge_basis: '',
        docket_id: '',
        current_location: '',
        client_details: '',
        price: '',
        invoice: '', // Default value for the invoice enum
        status: '',
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Add small delay before refreshing to allow toast to be visible

      // setTimeout(() => {
      //   window.location.reload();
      // }, 1000);

      // ps: just add toast, no need to refresh - using real time api
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="docket_id">Docket ID</Label>
            <Input
              id="docket_id"
              placeholder="Enter docket ID"
              value={formData.docket_id}
              onChange={(e) => handleInputChange('docket_id', e.target.value)}
              required
              disabled={true}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select disabled={isLoading} onValueChange={handleClientChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoading ? 'Loading clients...' : 'Select a client'} />
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

          <div className="space-y-2">
            <Label htmlFor="shipper_details">Shipper Details</Label>
            <Input
              id="shipper_details"
              placeholder="Shipper details will auto-populate from client selection"
              value={formData.shipper_details}
              onChange={(e) => handleInputChange('shipper_details', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiver_details">Receiver Details</Label>
            <Input
              id="receiver_details"
              placeholder="Enter receiver details"
              value={formData.receiver_details}
              onChange={(e) => handleInputChange('receiver_details', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="total_boxes_count">Total Boxes</Label>
            <Input
              id="total_boxes_count"
              type="number"
              placeholder="Enter box count"
              value={formData.total_boxes_count}
              onChange={(e) => handleInputChange('total_boxes_count', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dimensions">Dimensions</Label>
            <Input
              id="dimensions"
              placeholder="LxWxH in cm"
              value={formData.dimensions}
              onChange={(e) => handleInputChange('dimensions', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="total_order_weight">Total Weight (kg)</Label>
            <Input
              id="total_order_weight"
              type="number"
              placeholder="Enter total weight"
              value={formData.total_order_weight}
              onChange={(e) => handleInputChange('total_order_weight', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="charge_basis">Charge Basis</Label>
            <Select
              value={formData.charge_basis}
              onValueChange={(value) => handleInputChange('charge_basis', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select charge basis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="By Weight">By Weight</SelectItem>
                <SelectItem value="Per Boxes">Per Boxes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lr_no">LR Number</Label>
            <Input
              id="lr_no"
              placeholder="Enter LR number"
              value={formData.lr_no}
              onChange={(e) => handleInputChange('lr_no', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tat">TAT (Turn Around Time)</Label>
            <Input
              id="tat"
              type="date"
              value={formData.tat}
              onChange={(e) => handleInputChange('tat', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              placeholder="Enter price"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice">Invoice</Label>
            <Select
              value={formData.invoice}
              onValueChange={(value) => handleInputChange('invoice', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select invoice type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">paid</SelectItem>
                <SelectItem value="to pay">to pay</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Order Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select order status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ready To Transport">Ready To Transport</SelectItem>
                <SelectItem value="Assigned">Assigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                shipper_details: '',
                receiver_details: '',
                total_boxes_count: '',

                dimensions: '',
                total_order_weight: '',
                lr_no: '',

                tat: '',
                charge_basis: '',
                docket_id: '',
                current_location: '',
                client_details: '',
                price: '',
                invoice: '',
                status: '',
              });

              // Generate a new unique docket ID after reset
              const generateNewId = async () => {
                try {
                  setIsGeneratingId(true);
                  const uniqueDocketId = await getUniqueVerifiedDocketId(db);
                  setFormData((prev) => ({ ...prev, docket_id: uniqueDocketId }));
                } catch (error) {
                  console.error('Error generating unique docket ID:', error);
                } finally {
                  setIsGeneratingId(false);
                }
              };

              generateNewId();
            }}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting || isGeneratingId}>
            {isSubmitting ? 'Creating Order...' : 'Create Order'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CreateOrderForm;
