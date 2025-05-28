'use client';

import { db } from '@/firebase/database';
import useClients from '@/hooks/useClients';
import useReceivers from '@/hooks/useReceivers';
import useTATs from '@/hooks/useTATs';
import { Client, ReceiverDetails } from '@/types';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';
import useUsers from '@/hooks/useUsers';
import useCenters from '@/hooks/useCenters';
import useReceiversCities from '@/hooks/useReceiversCities';

interface UpdateOrderFormProps {
  orderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Hardcoded price per volume (price per cubic cm)
const PRICE_PER_VOLUME = 0.01;

export function UpdateOrderForm({ orderId, onSuccess, onCancel }: UpdateOrderFormProps) {
  // Add centers hook
  const { centers, isLoading: isLoadingCenters } = useCenters();
  const { cities, isLoading: isLoadingCities } = useReceiversCities();
  const { user } = useAuth();
  const { users: currentUser } = useUsers(user?.uid);
  const userLocation = currentUser?.[0]?.location;
  const [selectedCity, setSelectedCity] = useState<string>('');

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
    GST: 'Excluded' as 'Included' | 'Excluded',
    GST_amount: 'NA' as number | 'NA',
    status: '',
    payment_mode: '-',
    to_be_transferred: false,
    transfer_center_location: 'NA',
    previous_center_location: 'NA',
    receiver_city: '',
    receiver_zone: '' as ReceiverDetails['receiverZone'],
    order_type: 'Direct' as 'Direct' | 'Sublet',
    sublet_details: 'NA' as string | 'NA',
  });

  const handleCityChange = (value: string) => {
    if (value === 'add_new') {
      setIsManualCityEntry(true);
      setSelectedCity('');
      setFormData((prev) => ({
        ...prev,
        receiver_city: '',
        receiver_zone: '' as ReceiverDetails['receiverZone'],
      }));
    } else {
      setIsManualCityEntry(false);
      setSelectedCity(value);
      setFormData((prev) => ({
        ...prev,
        receiver_city: value,
      }));
    }
  };

  // Add state to store the existing proof_of_delivery value
  const [existingProofOfDelivery, setExistingProofOfDelivery] = useState<string>('NA');

  const { clients, isLoading: isLoadingClients } = useClients();
  const { receivers, isLoading: isLoadingReceivers } = useReceivers({
    city: selectedCity,
  });
  const { tats } = useTATs();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualClientEntry, setIsManualClientEntry] = useState(false);
  const [isManualCityEntry, setIsManualCityEntry] = useState(true);
  const [isManualReceiverEntry, setIsManualReceiverEntry] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedReceiver, setSelectedReceiver] = useState<string>('');
  const [selectedClientPincode, setSelectedClientPincode] = useState<string>('');
  const [selectedReceiverPincode, setSelectedReceiverPincode] = useState<string>('');

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

          setFormData({
            receiver_name: data.receiver_name || '',
            receiver_details: data.receiver_details || '',
            receiver_contact: data.receiver_contact || '',
            total_boxes_count: data.total_boxes_count?.toString() || '',
            dimensions: data.dimensions || '',
            total_order_weight: data.total_order_weight?.toString() || '',
            lr_no: data.lr_no || '',
            tat: data.tat?.toString() || '', // TAT is now a number (hours)
            charge_basis: data.charge_basis || '',
            docket_id: data.docket_id || '',
            current_location: data.current_location || '',
            client_details: data.client_details || '',
            docket_price: data.docket_price?.toString() || '',
            calculated_price: data.calculated_price?.toString() || '',
            total_price: data.total_price?.toString() || '',
            invoice: data.invoice || '',
            GST: data.GST || 'Excluded',
            GST_amount: data.GST_amount || 'NA',
            status: data.status || '',
            payment_mode: data.payment_mode || '-',
            to_be_transferred: data.to_be_transferred || false,
            transfer_center_location: data.transfer_center_location || 'NA',
            previous_center_location: data.previous_center_location || 'NA',
            receiver_city: data.receiver_city || '',
            receiver_zone: data.receiver_zone || ('NA' as ReceiverDetails['receiverZone']),
            order_type: data.order_type || 'Direct',
            sublet_details: data.sublet_details || 'NA',
          });

          // Set selected client and receiver based on existing data
          const client = clients.find((c: Client) => c.clientName === data.client_details);
          if (client) {
            setSelectedClient(client.id);
            setSelectedClientPincode(client.pincode || '');
          } else {
            setIsManualClientEntry(true);
          }

          const receiver = receivers.find(
            (r: ReceiverDetails) => r.receiverName === data.receiver_name,
          );
          if (receiver) {
            setSelectedReceiver(receiver.id);
            setSelectedReceiverPincode(receiver.pincode || '');
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

  // Add effect to auto-populate TAT when all pincodes are available
  useEffect(() => {
    if (formData.current_location && selectedClientPincode && selectedReceiverPincode) {
      // Find matching TAT record
      const matchingTat = tats.find(
        (tat) =>
          tat.center_pincode === formData.current_location &&
          tat.client_pincode === selectedClientPincode &&
          tat.receiver_pincode === selectedReceiverPincode,
      );

      if (matchingTat) {
        setFormData((prev) => ({
          ...prev,
          tat: matchingTat.tat_value.toString(),
        }));
      }
    }
  }, [formData.current_location, selectedClientPincode, selectedReceiverPincode, tats]);

  // Add effect for price calculation
  useEffect(() => {
    // Skip calculation if required fields are missing
    if (!formData.total_boxes_count && !formData.total_order_weight && !formData.dimensions) {
      return;
    }

    // Get current client if using client preference
    const client = selectedClient ? clients.find((c) => c.id === selectedClient) : null;

    // Get current values for calculation
    const docketPrice = parseFloat(formData.docket_price || '0');
    let calculatedPrice = 0;

    // Client preference pricing
    if (pricingMethod === 'clientPreference' && client?.rateCard) {
      const chargeBasis = client.rateCard.preferance;

      if (chargeBasis === 'Per Units' && formData.total_boxes_count) {
        const pricePerBox = parseFloat(client.rateCard.pricePerPref?.toString() || '0');
        calculatedPrice = parseInt(formData.total_boxes_count) * pricePerBox;
      } else if (chargeBasis === 'By Weight' && formData.total_order_weight) {
        const pricePerKg = parseFloat(client.rateCard.pricePerPref?.toString() || '0');
        const minPriceWeight =
          client.rateCard.minPriceWeight !== 'NA'
            ? parseFloat(client.rateCard.minPriceWeight?.toString() || '0')
            : 0;

        calculatedPrice = parseInt(formData.total_order_weight) * pricePerKg;

        // If calculated price is less than minimum price weight, use minimum price weight
        if (minPriceWeight > 0 && calculatedPrice < minPriceWeight) {
          calculatedPrice = minPriceWeight;
        }
      }
    }
    // Volumetric pricing
    else if (pricingMethod === 'volumetric' && formData.dimensions && formData.total_boxes_count) {
      try {
        // Parse dimensions (format: LxWxH in cm)
        // Handle different possible formats (L x W x H or LxWxH)
        const dimensionValues = formData.dimensions
          .split(/[xX×\s]+/)
          .filter(Boolean)
          .map((dim) => parseFloat(dim));

        // Make sure we got 3 dimensions
        if (dimensionValues.length >= 3) {
          const [length, width, height] = dimensionValues;

          if (!isNaN(length) && !isNaN(width) && !isNaN(height)) {
            // Calculate volume in cubic cm
            const volumePerBox = length * width * height;
            const totalVolume = volumePerBox * parseInt(formData.total_boxes_count || '0');

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

    // Calculate total price including GST if applicable
    let totalPrice = docketPrice + calculatedPrice;
    if (formData.GST === 'Excluded' && typeof formData.GST_amount === 'number') {
      totalPrice += formData.GST_amount;
    }

    // Update form data with new prices
    setFormData((prev) => ({
      ...prev,
      calculated_price: calculatedPrice > 0 ? calculatedPrice.toFixed(2) : '0',
      total_price: totalPrice > 0 ? totalPrice.toFixed(2) : '0',
    }));
  }, [
    formData.total_boxes_count,
    formData.total_order_weight,
    formData.dimensions,
    formData.docket_price,
    formData.GST,
    formData.GST_amount,
    pricingMethod,
    selectedClient,
    clients,
  ]);

  const handleClientChange = (value: string) => {
    if (value === 'add_new') {
      setIsManualClientEntry(true);
      setSelectedClient('');
      setSelectedClientPincode('');
      setFormData((prev) => ({
        ...prev,
        client_details: '',
      }));
    } else {
      setIsManualClientEntry(false);
      setSelectedClient(value);
      const client = clients.find((c: Client) => c.id === value);
      if (client) {
        setSelectedClientPincode(client.pincode || '');
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
      setSelectedReceiverPincode('');
      setFormData((prev) => ({
        ...prev,
        receiver_name: '',
        receiver_details: '',
        receiver_contact: '',
        receiver_zone: '' as ReceiverDetails['receiverZone'],
      }));
    } else {
      setIsManualReceiverEntry(false);
      setSelectedReceiver(value);
      const receiver = receivers.find((r) => r.id === value);
      if (receiver) {
        setSelectedReceiverPincode(receiver.pincode || '');
        setFormData((prev) => ({
          ...prev,
          receiver_name: receiver.receiverName,
          receiver_details: receiver.receiverDetails,
          receiver_contact: receiver.receiverContact,
          receiver_zone: receiver.receiverZone,
          receiver_city: receiver.receiverCity,
        }));
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      let validatedData = {
        ...formData,
        total_boxes_count: parseInt(formData.total_boxes_count),
        total_order_weight: parseInt(formData.total_order_weight),
        docket_price: formData.docket_price ? parseFloat(formData.docket_price) : 0,
        calculated_price: formData.calculated_price ? parseFloat(formData.calculated_price) : 0,
        total_price: formData.total_price ? parseFloat(formData.total_price) : 0,
        tat: parseInt(formData.tat), // Parse TAT as integer (hours)
        deadline: new Date(Date.now() + parseInt(formData.tat) * 60 * 60 * 1000), // Calculate deadline from TAT hours
        updated_at: new Date(),
        GST: formData.GST, // Include GST in validated data
        proof_of_delivery: existingProofOfDelivery, // Use the stored proof_of_delivery value
      };

      // Handle status changes for transfers
      if (formData.to_be_transferred && formData.status === 'In Transit') {
        // If the order is in transit to be transferred
        validatedData = {
          ...validatedData,
          previous_center_location: userLocation, // Current center becomes previous
        };
      } else if (formData.status === 'Transferred' && formData.to_be_transferred) {
        // When order is marked as transferred, update the current location
        validatedData = {
          ...validatedData,
          current_location: formData.transfer_center_location, // New center becomes current
          to_be_transferred: false, // Reset transfer flag
          transfer_center_location: 'NA', // Reset transfer location
        };
      }

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

  // Add handleGSTAmountChange function to handle GST amount changes when GST is excluded
  const handleGSTAmountChange = (value: string) => {
    const amount = value === '' ? 0 : parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      GST_amount: amount,
    }));
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
            <Label htmlFor="city">City</Label>
            {!isManualCityEntry ? (
              <div className="flex gap-2">
                <Select
                  disabled={isLoadingCities}
                  onValueChange={handleCityChange}
                  value={selectedCity}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={isLoadingCities ? 'Loading cities...' : 'Select a city'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add_new">+ Add New City</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter city name"
                  value={formData.receiver_city}
                  onChange={(e) => handleInputChange('receiver_city', e.target.value)}
                  required
                />
                <Button
                  type="button"
                  className="bg-red-500 hover:bg-red-400 text-white cursor-pointer"
                  size="icon"
                  onClick={() => {
                    setIsManualCityEntry(false);
                    setSelectedCity('');
                  }}
                >
                  ×
                </Button>
              </div>
            )}
          </div>

          {/* Receiver Selection */}
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

          {/* Zone Selection (auto-populated) */}
          <div className="space-y-2">
            <Label htmlFor="receiver_zone">Zone</Label>
            <Input
              id="receiver_zone"
              placeholder="Zone"
              value={formData.receiver_zone}
              onChange={(e) => handleInputChange('receiver_zone', e.target.value)}
              required
              autoFocus={false}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="total_boxes_count">Total Units</Label>
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
                <SelectItem value="Per Units">Per Units</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lr_no">Client Doc Number</Label>
            <Input
              id="lr_no"
              placeholder="Enter Client Doc number"
              value={formData.lr_no}
              onChange={(e) => handleInputChange('lr_no', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tat">TAT (Hours)</Label>
            <Input
              id="tat"
              type="number"
              placeholder="Enter TAT in hours"
              min="1"
              value={formData.tat}
              onChange={(e) => handleInputChange('tat', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Show calculated deadline based on TAT */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={
                formData.tat
                  ? (() => {
                      const offsetInMilliseconds = 5.5 * 60 * 60 * 1000; // indian time offset (UTC+5:30)
                      const now = Date.now() + offsetInMilliseconds;
                      const tatHours = parseInt(formData.tat) * 60 * 60 * 1000;
                      const deadlineDate = new Date(now + tatHours);
                      return deadlineDate.toISOString().slice(0, 16);
                    })()
                  : ''
              }
              disabled
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
                <SelectItem value="received">received</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pricing Method Selection */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label className="font-bold mb-4">Pricing Method</Label>
            <RadioGroup
              value={pricingMethod}
              onValueChange={(value: 'clientPreference' | 'volumetric') => {
                // Set the new pricing method
                setPricingMethod(value);

                // Calculate prices using the new pricing method directly (not relying on state update)
                if (value === 'clientPreference' && selectedClient) {
                  const client = clients.find((c: Client) => c.id === selectedClient);

                  let calculatedPrice = 0;
                  const docketPrice = parseFloat(formData.docket_price || '0');
                  const boxesCount = formData.total_boxes_count;
                  const weight = formData.total_order_weight;

                  // Client preference pricing calculation logic
                  if (client?.rateCard) {
                    const chargeBasis = client.rateCard.preferance;

                    if (chargeBasis === 'Per Units' && boxesCount) {
                      const pricePerBox = parseFloat(
                        client.rateCard.pricePerPref?.toString() || '0',
                      );
                      calculatedPrice = parseInt(boxesCount) * pricePerBox;
                    } else if (chargeBasis === 'By Weight' && weight) {
                      const pricePerKg = parseFloat(
                        client.rateCard.pricePerPref?.toString() || '0',
                      );
                      const minPriceWeight =
                        client.rateCard.minPriceWeight !== 'NA'
                          ? parseFloat(client.rateCard.minPriceWeight?.toString() || '0')
                          : 0;

                      calculatedPrice = parseInt(weight) * pricePerKg;

                      if (minPriceWeight > 0 && calculatedPrice < minPriceWeight) {
                        calculatedPrice = minPriceWeight;
                      }
                    }
                  }

                  // Update form data with the new calculated price
                  const totalPrice = docketPrice + calculatedPrice;
                  console.log('Client preference calculation with new pricing method:');
                  console.log('- Docket price:', docketPrice);
                  console.log('- Calculated price:', calculatedPrice);
                  console.log('- Total price:', totalPrice);

                  setFormData((prev) => ({
                    ...prev,
                    calculated_price: calculatedPrice > 0 ? calculatedPrice.toFixed(2) : '0',
                    total_price: totalPrice > 0 ? totalPrice.toFixed(2) : '0',
                  }));
                } else if (value === 'volumetric') {
                  // Volumetric pricing calculation
                  let calculatedPrice = 0;
                  const docketPrice = parseFloat(formData.docket_price || '0');
                  const dimensions = formData.dimensions;
                  const boxesCount = formData.total_boxes_count;

                  if (dimensions && boxesCount) {
                    try {
                      // Parse dimensions (format: LxWxH in cm)
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
                          calculatedPrice = Math.round(calculatedPrice * 100) / 100;
                        }
                      }
                    } catch (error) {
                      console.error('Error calculating volumetric price:', error);
                    }
                  }

                  // Update form data with the new calculated price
                  const totalPrice = docketPrice + calculatedPrice;
                  console.log('Volumetric calculation with new pricing method:');
                  console.log('- Docket price:', docketPrice);
                  console.log('- Calculated price:', calculatedPrice);
                  console.log('- Total price:', totalPrice);

                  setFormData((prev) => ({
                    ...prev,
                    calculated_price: calculatedPrice > 0 ? calculatedPrice.toFixed(2) : '0',
                    total_price: totalPrice > 0 ? totalPrice.toFixed(2) : '0',
                  }));
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

        {/* GST Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-4">
              <Label className="font-semibold">Order Type</Label>
              <RadioGroup
                value={formData.order_type}
                onValueChange={(value: 'Direct' | 'Sublet') => {
                  handleInputChange('order_type', value);

                  // Reset sublet details if switching to direct order
                  if (value === 'Direct') {
                    handleInputChange('sublet_details', 'NA');
                  }
                }}
                className="flex flex-row items-center space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Direct" id="orderTypeDirect" />
                  <Label htmlFor="orderTypeDirect" className="cursor-pointer">
                    Direct
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Sublet" id="orderTypeSublet" />
                  <Label htmlFor="orderTypeSublet" className="cursor-pointer">
                    Sublet
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {formData.order_type === 'Sublet' && (
            <div className="space-y-2">
              <Label htmlFor="sublet_details">Sublet Company Name</Label>
              <Input
                id="sublet_details"
                placeholder="Enter sublet company name"
                value={formData.sublet_details === 'NA' ? '' : formData.sublet_details}
                onChange={(e) => handleInputChange('sublet_details', e.target.value)}
                required
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gst" className="font-bold">
              GST
            </Label>
            <RadioGroup
              value={formData.GST}
              onValueChange={(value) => handleInputChange('GST', value)}
              className="flex space-x-4 py-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Included" id="gst-included" />
                <Label htmlFor="gst-included">Included</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Excluded" id="gst-excluded" />
                <Label htmlFor="gst-excluded">Excluded</Label>
              </div>
            </RadioGroup>
          </div>
          {formData.GST === 'Excluded' && (
            <div className="">
              <Label className="mb-1">GST Amount</Label>
              <Input
                type="number"
                value={formData.GST_amount === 'NA' ? '' : formData.GST_amount.toString()}
                onChange={(e) => handleGSTAmountChange(e.target.value)}
                placeholder="Enter GST amount"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="docket_price">Docket Price</Label>
            <Input
              id="docket_price"
              type="number"
              placeholder="Enter docket price"
              value={formData.docket_price}
              onChange={(e) => {
                const newDocketPrice = e.target.value;

                // Update form data state with the new docket price
                setFormData((prev) => ({
                  ...prev,
                  docket_price: newDocketPrice,
                }));

                // Calculate total price using the new docket price directly
                const docketPrice = parseFloat(newDocketPrice || '0');
                const calculatedPrice = parseFloat(formData.calculated_price || '0');
                const totalPrice = docketPrice + calculatedPrice;

                // Update total price immediately with the new values
                setFormData((prev) => ({
                  ...prev,
                  docket_price: newDocketPrice,
                  total_price: totalPrice.toFixed(2),
                }));

                // console.log('Direct calculation with new docket price:');
                // console.log('- New docket price:', docketPrice);
                // console.log('- Calculated price:', calculatedPrice);
                // console.log('- Total price:', totalPrice);
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calculated_price">Calculated Price</Label>
            <Input
              id="calculated_price"
              type="number"
              placeholder="Auto-calculated"
              value={formData.calculated_price}
              onChange={(e) => handleInputChange('calculated_price', e.target.value)}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="total_price">Total Price</Label>
            <Input
              id="total_price"
              type="number"
              placeholder="Docket + Calculated Price"
              value={formData.total_price}
              onChange={(e) => handleInputChange('total_price', e.target.value)}
              disabled
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* changing order status to assigned whithout trips while creating new orders doesnt make sense*/}
          {/* <div className="space-y-2">
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
                <SelectItem value="In Transit">In Transit</SelectItem>
                <SelectItem value="Transferred">Transferred</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
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

        {/* Add transfer fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="to_be_transferred">Transfer to Another Center?</Label>
            <Select
              value={formData.to_be_transferred.toString()}
              onValueChange={(value) => {
                const isTransfer = value === 'true';
                setFormData((prev) => ({
                  ...prev,
                  to_be_transferred: isTransfer,
                  transfer_center_location: isTransfer ? prev.transfer_center_location : 'NA',
                }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select transfer option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.to_be_transferred && (
            <div className="space-y-2">
              <Label htmlFor="transfer_center_location">Transfer to Center</Label>
              <Select
                disabled={isLoadingCenters}
                value={formData.transfer_center_location}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    transfer_center_location: value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingCenters ? 'Loading centers...' : 'Select destination center'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {centers
                    .filter((center) => center.pincode !== userLocation)
                    .map((center) => (
                      <SelectItem key={center.id} value={center.pincode}>
                        {center.name} ({center.pincode})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Add status selection */}
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
              <SelectItem value="In Transit">In Transit</SelectItem>
              {formData.to_be_transferred && (
                <SelectItem value="Transferred">Transferred</SelectItem>
              )}
              <SelectItem value="Delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
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
