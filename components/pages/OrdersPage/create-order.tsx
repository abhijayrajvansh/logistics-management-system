'use client';

import { useAuth } from '@/app/context/AuthContext';
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
import { db } from '@/firebase/database';
import useClients from '@/hooks/useClients';
import useReceivers from '@/hooks/useReceivers';
import useReceiversCities from '@/hooks/useReceiversCities';
import useTATs from '@/hooks/useTATs';
import { getUniqueVerifiedDocketId } from '@/lib/createUniqueDocketId';
import { addDoc, collection } from 'firebase/firestore';
import { ReceiverDetails } from '@/types';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import useUsers from '@/hooks/useUsers';
import useCenters from '@/hooks/useCenters';

interface CreateOrderFormProps {
  onSuccess?: () => void;
}

// Hardcoded price per volume (price per cubic cm)
const PRICE_PER_VOLUME = 0.01;

export function CreateOrderForm({ onSuccess }: CreateOrderFormProps) {
  const { clients, isLoading: isLoadingClients } = useClients();
  const { cities, isLoading: isLoadingCities } = useReceiversCities();
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [isManualCityEntry, setIsManualCityEntry] = useState(false);
  const { receivers, isLoading: isLoadingReceivers } = useReceivers({
    city: selectedCity,
  });
  const { tats } = useTATs();

  const { user } = useAuth();
  const { users: currentUser } = useUsers(user?.uid);
  const { centers, isLoading: isLoadingCenters } = useCenters();
  const userLocation = currentUser?.[0]?.location;

  const [isManualClientEntry, setIsManualClientEntry] = useState(false);
  const [isManualReceiverEntry, setIsManualReceiverEntry] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedReceiver, setSelectedReceiver] = useState<string>('');
  const [selectedClientPincode, setSelectedClientPincode] = useState<string>('');
  const [selectedReceiverPincode, setSelectedReceiverPincode] = useState<string>('');

  // Add state for pricing method selection
  const [pricingMethod, setPricingMethod] = useState<'clientPreference' | 'volumetric'>(
    'clientPreference',
  );

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
    current_location: userLocation,
    client_details: '',
    docket_price: '',
    calculated_price: '',
    total_price: '',
    invoice: '',
    GST: 'Included' as 'Included' | 'Excluded',
    GST_amount: 'NA' as number | 'NA',
    status: 'Ready To Transport',
    to_be_transferred: false,
    transfer_center_location: 'NA',
    previous_center_location: 'NA',
    receiver_city: '',
    receiver_zone: '' as ReceiverDetails['receiverZone'],
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

  // Add effect to auto-populate TAT when all pincodes are available
  useEffect(() => {
    if (userLocation && selectedClientPincode && selectedReceiverPincode) {
      // Find matching TAT record
      const matchingTat = tats.find(
        (tat) =>
          tat.center_pincode === userLocation &&
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
  }, [userLocation, selectedClientPincode, selectedReceiverPincode, tats]);

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
      const client = clients.find((c) => c.id === value);
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
        tat: parseInt(formData.tat), // Parse TAT as integer (hours)
        deadline: new Date(Date.now() + parseInt(formData.tat) * 60 * 60 * 1000), // Calculate deadline from TAT hours
        proof_of_delivery: 'NA',
        proof_of_payment: 'NA',
        payment_mode: '-', // Set default payment mode
        status: formData.status || 'Ready To Transport', // Set default status if not provided
        created_at: new Date(),
        updated_at: new Date(),
        to_be_transferred: formData.to_be_transferred,
        transfer_center_location: formData.to_be_transferred
          ? formData.transfer_center_location
          : 'NA',
        previous_center_location: 'NA', // Initially NA since it's a new order
        current_location: userLocation, // Set current location to user's center
      };

      // Add the order to Firestore
      const orderRef = await addDoc(collection(db, 'orders'), validatedData);

      toast.success('Order created successfully!', {
        description: `Docket ID: ${formData.docket_id}`,
      });

      // Reset form after successful submission
      setFormData({
        receiver_city: '',
        receiver_zone: '' as ReceiverDetails['receiverZone'],
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
        GST: 'Excluded' as 'Included' | 'Excluded', // Reset GST field to default value
        GST_amount: 'NA' as number | 'NA',
        status: '',
        to_be_transferred: false,
        transfer_center_location: 'NA',
        previous_center_location: 'NA',
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Add small delay before refreshing to allow toast to be visible

      // setTimeout(() => {
      //   window.location.reload();
      // }, 1000);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGSTAmountChange = (value: string) => {
    const amount = value === '' ? 0 : parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      GST_amount: amount,
    }));
  };

  // Add this useEffect after other useEffect hooks
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

        if (minPriceWeight > 0 && calculatedPrice < minPriceWeight) {
          calculatedPrice = minPriceWeight;
        }
      }
    }
    // Volumetric pricing
    else if (pricingMethod === 'volumetric' && formData.dimensions && formData.total_boxes_count) {
      try {
        const dimensionValues = formData.dimensions
          .split(/[xX×\s]+/)
          .filter(Boolean)
          .map((dim) => parseFloat(dim));

        if (dimensionValues.length >= 3) {
          const [length, width, height] = dimensionValues;
          if (!isNaN(length) && !isNaN(width) && !isNaN(height)) {
            const volumePerBox = length * width * height;
            const totalVolume = volumePerBox * parseInt(formData.total_boxes_count);
            calculatedPrice = totalVolume * PRICE_PER_VOLUME;
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
                  <SelectTrigger className="w-full" autoFocus>
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
              placeholder="Enter unit count"
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
              onChange={(e) => {
                handleInputChange('tat', e.target.value);
              }}
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
          <div className="space-y-4">
            <Label className="font-semibold">Pricing Method</Label>
            <RadioGroup
              value={pricingMethod}
              onValueChange={(value: 'clientPreference' | 'volumetric') => {
                // Set the new pricing method
                setPricingMethod(value);

                // Calculate prices using the new pricing method directly (not relying on state update)
                if (value === 'clientPreference' && selectedClient) {
                  const client = clients.find((c) => c.id === selectedClient);

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

        {/* GST Radio Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gst" className="font-bold">
              GST
            </Label>
            <RadioGroup
              defaultValue="Excluded"
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

                // Update form data state
                setFormData((prev) => ({
                  ...prev,
                  docket_price: newDocketPrice,
                }));

                // Calculate prices using the new docket price directly
                const docketPrice = parseFloat(newDocketPrice || '0');
                let calculatedPrice = parseFloat(formData.calculated_price || '0');
                const totalPrice = docketPrice + calculatedPrice;

                // Update total price immediately
                setFormData((prev) => ({
                  ...prev,
                  docket_price: newDocketPrice,
                  total_price: totalPrice.toFixed(2),
                }));
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
          {/* Add transfer options */}
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
                receiver_city: '',
                receiver_zone: '' as ReceiverDetails['receiverZone'],
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
                GST: 'Excluded' as 'Included' | 'Excluded', // Reset GST field to default value
                GST_amount: 'NA' as number | 'NA',
                status: '',
                to_be_transferred: false,
                transfer_center_location: 'NA',
                previous_center_location: 'NA',
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
