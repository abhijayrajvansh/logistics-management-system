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
import useReceivers from '@/hooks/useReceivers';
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
  const { clients, isLoading: isLoadingClients } = useClients();
  const { receivers, isLoading: isLoadingReceivers } = useReceivers();

  const [isManualClientEntry, setIsManualClientEntry] = useState(false);
  const [isManualReceiverEntry, setIsManualReceiverEntry] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedReceiver, setSelectedReceiver] = useState<string>('');

  const [formData, setFormData] = useState({
    receiver_name: '',
    receiver_details: '',
    receiver_contact: '',
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

  const handleClientChange = (value: string) => {
    if (value === 'add_new') {
      setIsManualClientEntry(true);
      setSelectedClient('');
      setFormData((prev) => ({
        ...prev,
        client_details: '',
      }));
    } else {
      setIsManualClientEntry(false);
      setSelectedClient(value);
      const client = clients.find((c) => c.id === value);
      if (client) {
        let tatDate = '';
        try {
          if (client.current_tat) {
            // Handle Firestore Timestamp
            if (
              typeof client.current_tat === 'object' &&
              client.current_tat !== null &&
              'seconds' in client.current_tat
            ) {
              const timestamp = client.current_tat as { seconds: number };
              tatDate = new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
            }
            // Handle regular Date object
            else if (client.current_tat instanceof Date) {
              tatDate = client.current_tat.toISOString().split('T')[0];
            }
          }
        } catch (error) {
          console.error('Error formatting TAT date:', error);
        }

        setFormData((prev) => ({
          ...prev,
          client_details: client.clientName,
          tat: tatDate,
          charge_basis: client.rateCard.preferance,
        }));
      }
    }
  };

  const calculatePrice = (client: any, boxesCount: string, weight: string) => {
    if (!client?.rateCard) {
      return;
    }

    const chargeBasis = client.rateCard.preferance;
    let calculatedPrice = 0;

    if (chargeBasis === 'Per Boxes' && boxesCount) {
      // Calculate price based on boxes
      const pricePerBox = parseFloat(client.rateCard.pricePerPref?.toString() || '0');
      calculatedPrice = parseInt(boxesCount) * pricePerBox;
    } else if (chargeBasis === 'By Weight' && weight) {
      // Calculate price based on weight
      const pricePerKg = parseFloat(client.rateCard.pricePerPref?.toString() || '0');
      const minPriceWeight = parseFloat(client.rateCard.minPriceWeight?.toString() || '0');

      calculatedPrice = parseInt(weight) * pricePerKg;

      // If calculated price is less than minimum price weight, use minimum price weight
      if (calculatedPrice < minPriceWeight) {
        calculatedPrice = minPriceWeight;
      }
    }

    setFormData((prev) => ({
      ...prev,
      price: calculatedPrice > 0 ? calculatedPrice.toString() : '',
    }));
  };

  const handleReceiverChange = (value: string) => {
    if (value === 'add_new') {
      setIsManualReceiverEntry(true);
      setSelectedReceiver('');
      setFormData((prev) => ({
        ...prev,
        receiver_name: '',
        receiver_details: '',
        receiver_contact: '',
      }));
    } else {
      setIsManualReceiverEntry(false);
      setSelectedReceiver(value);
      const receiver = receivers.find((r) => r.id === value);
      if (receiver) {
        setFormData((prev) => ({
          ...prev,
          receiver_name: receiver.receiverName,
          receiver_details: receiver.receiverDetails,
          receiver_contact: receiver.receiverContact,
        }));
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Recalculate price when boxes count or weight changes
    if ((field === 'total_boxes_count' || field === 'total_order_weight') && selectedClient) {
      const client = clients.find((c) => c.id === selectedClient);
      calculatePrice(
        client,
        field === 'total_boxes_count' ? value : formData.total_boxes_count,
        field === 'total_order_weight' ? value : formData.total_order_weight,
      );
    }
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
        proof_of_delivery: 'NA',
        created_at: new Date(),
      };

      // Add the order to Firestore
      const orderRef = await addDoc(collection(db, 'orders'), validatedData);

      toast.success('Order created successfully!', {
        description: `Docket ID: ${formData.docket_id}`,
      });

      // Reset form after successful submission
      setFormData({
        receiver_name: '',
        receiver_details: '',
        receiver_contact: '',
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
            {!isManualClientEntry ? (
              <div className="flex gap-2">
                <Select
                  disabled={isLoadingClients}
                  onValueChange={handleClientChange}
                  value={selectedClient}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={isLoadingClients ? 'Loading clients...' : 'Select a client'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add_new">+ Add New Client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.clientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter client name"
                  value={formData.client_details}
                  onChange={(e) => handleInputChange('client_details', e.target.value)}
                  required
                />
                <Button
                  type="button"
                  className="bg-red-500 hover:bg-red-400 text-white cursor-pointer"
                  size="icon"
                  onClick={() => {
                    setIsManualClientEntry(false);
                    setSelectedClient('');
                  }}
                >
                  ×
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="receiver">Receiver</Label>
            {!isManualReceiverEntry ? (
              <div className="flex gap-2">
                <Select
                  disabled={isLoadingReceivers}
                  onValueChange={handleReceiverChange}
                  value={selectedReceiver}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isLoadingReceivers ? 'Loading receivers...' : 'Select a receiver'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add_new">+ Add New Receiver</SelectItem>
                    {receivers.map((receiver) => (
                      <SelectItem key={receiver.id} value={receiver.id}>
                        {receiver.receiverName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter receiver name"
                  value={formData.receiver_name}
                  onChange={(e) => handleInputChange('receiver_name', e.target.value)}
                  required
                />
                <Button
                  type="button"
                  className="bg-red-500 hover:bg-red-400 text-white cursor-pointer"
                  size="icon"
                  onClick={() => {
                    setIsManualReceiverEntry(false);
                    setSelectedReceiver('');
                  }}
                >
                  ×
                </Button>
              </div>
            )}
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
          <div className="space-y-2">
            <Label htmlFor="receiver_contact">Receiver Contact</Label>
            <Input
              id="receiver_contact"
              placeholder="Enter receiver contact"
              value={formData.receiver_contact}
              onChange={(e) => handleInputChange('receiver_contact', e.target.value)}
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
              // Reset selected dropdown states
              setSelectedClient('');
              setSelectedReceiver('');

              // Reset form data
              setFormData({
                receiver_name: '',
                receiver_details: '',
                receiver_contact: '',
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
