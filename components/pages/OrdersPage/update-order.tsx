'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { shippers, ShipperData } from '@/lib/mock-data';
import useClients from '@/hooks/useClients';
import useReceivers from '@/hooks/useReceivers';
import { Client, ReceiverDetails } from '@/types';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

interface UpdateOrderFormProps {
  orderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Hardcoded price per volume (price per cubic cm)
const PRICE_PER_VOLUME = 0.01;

export function UpdateOrderForm({ orderId, onSuccess, onCancel }: UpdateOrderFormProps) {
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
    current_location: '',
    client_details: '',
    docket_price: '',
    calculated_price: '',
    total_price: '',
    invoice: '',
    status: '',
  });

  // Add state to store the existing proof_of_delivery value
  const [existingProofOfDelivery, setExistingProofOfDelivery] = useState<string>('NA');

  const { clients, isLoading: isLoadingClients } = useClients();
  const { receivers, isLoading: isLoadingReceivers } = useReceivers();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualClientEntry, setIsManualClientEntry] = useState(false);
  const [isManualReceiverEntry, setIsManualReceiverEntry] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedReceiver, setSelectedReceiver] = useState<string>('');

  // Add state for pricing method selection
  const [pricingMethod, setPricingMethod] = useState<'clientPreference' | 'volumetric'>(
    'clientPreference',
  );

  // Fetch order data on component mount
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          const data = orderDoc.data();

          // Store existing proof_of_delivery separately
          setExistingProofOfDelivery(data.proof_of_delivery || 'NA');

          // Format date for input field if it exists
          let formattedTat = '';
          if (data.tat) {
            if (data.tat.toDate) {
              formattedTat = data.tat.toDate().toISOString().split('T')[0];
            } else if (data.tat instanceof Date) {
              formattedTat = data.tat.toISOString().split('T')[0];
            } else if (typeof data.tat === 'string') {
              formattedTat = data.tat;
            }
          }

          setFormData({
            receiver_name: data.receiver_name || '',
            receiver_details: data.receiver_details || '',
            receiver_contact: data.receiver_contact || '',
            total_boxes_count: data.total_boxes_count?.toString() || '',
            dimensions: data.dimensions || '',
            total_order_weight: data.total_order_weight?.toString() || '',
            lr_no: data.lr_no || '',
            tat: formattedTat,
            charge_basis: data.charge_basis || '',
            docket_id: data.docket_id || '',
            current_location: data.current_location || '',
            client_details: data.client_details || '',
            docket_price: data.docket_price?.toString() || '',
            calculated_price: data.calculated_price?.toString() || '',
            total_price: data.total_price?.toString() || '',
            invoice: data.invoice || '',
            status: data.status || '',
          });

          // Set selected client and receiver based on existing data
          const client = clients.find((c: Client) => c.clientName === data.client_details);
          if (client) {
            setSelectedClient(client.id);
          } else {
            setIsManualClientEntry(true);
          }

          const receiver = receivers.find(
            (r: ReceiverDetails) => r.receiverName === data.receiver_name,
          );
          if (receiver) {
            setSelectedReceiver(receiver.id);
          } else {
            setIsManualReceiverEntry(true);
          }
        } else {
          toast.error('Order not found');
          if (onCancel) onCancel();
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, onCancel, clients, receivers]);

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
      const client = clients.find((c: Client) => c.id === value);
      if (client) {
        setFormData((prev) => ({
          ...prev,
          client_details: client.clientName,
          charge_basis: client.rateCard.preferance,
        }));
      }
    }
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
      const receiver = receivers.find((r: ReceiverDetails) => r.id === value);
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

  const calculatePrice = (
    client: any,
    boxesCount: string,
    weight: string,
    dimensions: string = formData.dimensions,
  ) => {
    let calculatedPrice = 0;
    const docketPrice = parseFloat(formData.docket_price || '0');

    // Client preference pricing
    if (pricingMethod === 'clientPreference' && client?.rateCard) {
      const chargeBasis = client.rateCard.preferance;

      if (chargeBasis === 'Per Boxes' && boxesCount) {
        // Calculate price based on boxes
        const pricePerBox = parseFloat(client.rateCard.pricePerPref?.toString() || '0');
        calculatedPrice = parseInt(boxesCount) * pricePerBox;
      } else if (chargeBasis === 'By Weight' && weight) {
        // Calculate price based on weight
        const pricePerKg = parseFloat(client.rateCard.pricePerPref?.toString() || '0');
        const minPriceWeight =
          client.rateCard.minPriceWeight !== 'NA'
            ? parseFloat(client.rateCard.minPriceWeight?.toString() || '0')
            : 0;

        calculatedPrice = parseInt(weight) * pricePerKg;

        // If calculated price is less than minimum price weight, use minimum price weight
        if (minPriceWeight > 0 && calculatedPrice < minPriceWeight) {
          calculatedPrice = minPriceWeight;
        }
      }
    }
    // Volumetric pricing
    else if (pricingMethod === 'volumetric') {
      if (dimensions && boxesCount) {
        try {
          // Parse dimensions (format: LxWxH in cm)
          // Handle different possible formats (L x W x H or LxWxH)
          const dimensionValues = dimensions
            .split(/[xX×\s]+/)
            .filter(Boolean)
            .map((dim) => parseFloat(dim));

          // Make sure we got 3 dimensions
          if (dimensionValues.length >= 3) {
            const [length, width, height] = dimensionValues;

            if (!isNaN(length) && !isNaN(width) && !isNaN(height)) {
              // Calculate volume in cubic cm
              const volumePerBox = length * width * height;
              const totalVolume = volumePerBox * parseInt(boxesCount || '0');

              // Calculate price based on volume
              calculatedPrice = totalVolume * PRICE_PER_VOLUME;

              // Round to 2 decimal places for better display
              calculatedPrice = Math.round(calculatedPrice * 100) / 100;
            }
          }
        } catch (error) {
          console.error('Error calculating volumetric price:', error);
        }
      }
    }

    // Calculate total price as sum of docket price and calculated price
    const totalPrice = docketPrice + calculatedPrice;

    setFormData((prev) => ({
      ...prev,
      calculated_price: calculatedPrice > 0 ? calculatedPrice.toFixed(2) : '0',
      total_price: totalPrice > 0 ? totalPrice.toFixed(2) : '0',
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Recalculate price when boxes count, weight, or dimensions change
    if (field === 'total_boxes_count' || field === 'total_order_weight' || field === 'dimensions') {
      // For client preference pricing
      if (pricingMethod === 'clientPreference' && selectedClient) {
        const client = clients.find((c: Client) => c.id === selectedClient);
        calculatePrice(
          client,
          field === 'total_boxes_count' ? value : formData.total_boxes_count,
          field === 'total_order_weight' ? value : formData.total_order_weight,
          field === 'dimensions' ? value : formData.dimensions,
        );
      }
      // For volumetric pricing - don't need a client
      else if (pricingMethod === 'volumetric') {
        calculatePrice(
          null,
          field === 'total_boxes_count' ? value : formData.total_boxes_count,
          field === 'total_order_weight' ? value : formData.total_order_weight,
          field === 'dimensions' ? value : formData.dimensions,
        );
      }
    }

    // If docket_price changes, recalculate the total price
    if (field === 'docket_price') {
      // For client preference pricing
      if (pricingMethod === 'clientPreference' && selectedClient) {
        const client = clients.find((c: Client) => c.id === selectedClient);
        calculatePrice(client, formData.total_boxes_count, formData.total_order_weight);
      } else if (pricingMethod === 'volumetric') {
        // For volumetric pricing, we don't need a client
        calculatePrice(null, formData.total_boxes_count, formData.total_order_weight);
      }
    }
  };

  const calculateTotalPrice = (docketPrice: string, calculatedPrice: string) => {
    const docketPriceValue = parseFloat(docketPrice || '0');
    const calculatedPriceValue = parseFloat(calculatedPrice || '0');
    const totalPrice = docketPriceValue + calculatedPriceValue;

    setFormData((prev) => ({
      ...prev,
      total_price: totalPrice.toString(),
    }));
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
        docket_price: formData.docket_price ? parseFloat(formData.docket_price) : 0,
        calculated_price: formData.calculated_price ? parseFloat(formData.calculated_price) : 0,
        total_price: formData.total_price ? parseFloat(formData.total_price) : 0,
        tat: new Date(formData.tat),
        updated_at: new Date(),
        proof_of_delivery: existingProofOfDelivery, // Use the stored proof_of_delivery value
      };

      // Update the order in Firestore
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, validatedData);

      toast.success('Order updated successfully!');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center">Loading order data...</div>;
  }

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
                    {clients.map((client: Client) => (
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
                    {receivers.map((receiver: ReceiverDetails) => (
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
              disabled={true}
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

        {/* Pricing Method Selection */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label>Pricing Method</Label>
            <RadioGroup
              value={pricingMethod}
              onValueChange={(value: 'clientPreference' | 'volumetric') => {
                setPricingMethod(value);

                // Recalculate price when pricing method changes
                if (value === 'clientPreference' && selectedClient) {
                  const client = clients.find((c: Client) => c.id === selectedClient);
                  calculatePrice(client, formData.total_boxes_count, formData.total_order_weight);
                } else if (value === 'volumetric') {
                  calculatePrice(null, formData.total_boxes_count, formData.total_order_weight);
                }
              }}
              className="flex flex-row items-center space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="clientPreference" id="clientPreference" />
                <Label htmlFor="clientPreference" className="cursor-pointer">
                  Use Client Rate Card ({formData.charge_basis})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="volumetric" id="volumetric" />
                <Label htmlFor="volumetric" className="cursor-pointer">
                  Use Volumetric Price (₹{PRICE_PER_VOLUME}/cm³)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="docket_price">Docket Price</Label>
            <Input
              id="docket_price"
              type="number"
              placeholder="Enter docket price"
              value={formData.docket_price}
              onChange={(e) => handleInputChange('docket_price', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calculated_price">Calculated Price</Label>
            <Input
              id="calculated_price"
              type="number"
              placeholder="Enter calculated price"
              value={formData.calculated_price}
              onChange={(e) => handleInputChange('calculated_price', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="total_price">Total Price</Label>
            <Input
              id="total_price"
              type="number"
              placeholder="Enter total price"
              value={formData.total_price}
              onChange={(e) => handleInputChange('total_price', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <SelectItem value="received">received</SelectItem>
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

        {/* handling location on backend for specific order update wrt to managers */}
        <div className="grid grid-cols-1 gap-4 hidden">
          <div className="space-y-2">
            <Label htmlFor="current_location">Current Location</Label>
            <Input
              id="current_location"
              placeholder="Enter current location"
              value={formData.current_location}
              onChange={(e) => handleInputChange('current_location', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating Order...' : 'Update Order'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default UpdateOrderForm;
