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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface CreateOrderFormProps {
  onSuccess?: () => void;
}

// Hardcoded price per volume (price per cubic cm)
const PRICE_PER_VOLUME = 0.01;

export function CreateOrderForm({ onSuccess }: CreateOrderFormProps) {
  const { clients, isLoading: isLoadingClients } = useClients();
  const { receivers, isLoading: isLoadingReceivers } = useReceivers();

  const [isManualClientEntry, setIsManualClientEntry] = useState(false);
  const [isManualReceiverEntry, setIsManualReceiverEntry] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedReceiver, setSelectedReceiver] = useState<string>('');
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
    current_location: '<manager-current-location>',
    client_details: '',
    docket_price: '',
    calculated_price: '',
    total_price: '',
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

  const calculatePrice = (
    client: any,
    boxesCount: string,
    weight: string,
    dimensions: string = formData.dimensions,
  ) => {
    // console.log('---- Debugging Price Calculation ----');
    // console.log('Pricing Method:', pricingMethod);
    // console.log('Dimensions:', dimensions);
    // console.log('Box Count:', boxesCount);
    // console.log('Weight:', weight);
    // console.log('Docket Price:', formData.docket_price);

    let calculatedPrice = 0;
    // Use the parameter value directly instead of accessing formData to ensure we have the latest value
    const docketPrice = parseFloat(formData.docket_price || '0');

    // Client preference pricing
    if (pricingMethod === 'clientPreference' && client?.rateCard) {
      const chargeBasis = client.rateCard.preferance;
      // console.log('Client Rate Card Preference:', chargeBasis);

      if (chargeBasis === 'Per Boxes' && boxesCount) {
        // Calculate price based on boxes
        const pricePerBox = parseFloat(client.rateCard.pricePerPref?.toString() || '0');
        calculatedPrice = parseInt(boxesCount) * pricePerBox;
        // console.log(
        //   'Per Box Calculation:',
        //   `${boxesCount} boxes × ₹${pricePerBox} = ₹${calculatedPrice}`,
        // );
      } else if (chargeBasis === 'By Weight' && weight) {
        // Calculate price based on weight
        const pricePerKg = parseFloat(client.rateCard.pricePerPref?.toString() || '0');
        const minPriceWeight =
          client.rateCard.minPriceWeight !== 'NA'
            ? parseFloat(client.rateCard.minPriceWeight?.toString() || '0')
            : 0;

        calculatedPrice = parseInt(weight) * pricePerKg;
        // console.log(
        //   'By Weight Calculation:',
        //   `${weight} kg × ₹${pricePerKg} = ₹${calculatedPrice}`,
        // );

        // If calculated price is less than minimum price weight, use minimum price weight
        if (minPriceWeight > 0 && calculatedPrice < minPriceWeight) {
          // console.log(
          //   'Using minimum price:',
          //   `₹${minPriceWeight} (min) instead of ₹${calculatedPrice}`,
          // );
          calculatedPrice = minPriceWeight;
        }
      }
    }
    // Volumetric pricing - fix the implementation
    else if (pricingMethod === 'volumetric') {
      // console.log('Using volumetric pricing');
      if (dimensions && boxesCount) {
        try {
          // Parse dimensions (format: LxWxH in cm)
          // Handle different possible formats (L x W x H or LxWxH)
          const dimensionValues = dimensions
            .split(/[xX×\s]+/)
            .filter(Boolean)
            .map((dim) => parseFloat(dim));
          // console.log('Parsed dimensions:', dimensionValues);

          // Make sure we got 3 dimensions
          if (dimensionValues.length >= 3) {
            const [length, width, height] = dimensionValues;

            if (!isNaN(length) && !isNaN(width) && !isNaN(height)) {
              // Calculate volume in cubic cm
              const volumePerBox = length * width * height;
              const totalVolume = volumePerBox * parseInt(boxesCount || '0');

              // Calculate price based on volume
              calculatedPrice = totalVolume * PRICE_PER_VOLUME;
              // console.log('Volumetric Calculation:');
              // console.log(
              //   `- Box dimensions: ${length}cm × ${width}cm × ${height}cm = ${volumePerBox}cm³`,
              // );
              // console.log(
              //   `- Total volume: ${volumePerBox}cm³ × ${boxesCount} boxes = ${totalVolume}cm³`,
              // );
              // console.log(
              //   `- Price: ${totalVolume}cm³ × ₹${PRICE_PER_VOLUME}/cm³ = ₹${calculatedPrice}`,
              // );

              // Round to 2 decimal places for better display
              calculatedPrice = Math.round(calculatedPrice * 100) / 100;
            } else {
              console.error('Found NaN in dimensions:', length, width, height);
            }
          } else {
            console.error('Invalid dimensions format. Expected LxWxH. Got:', dimensionValues);
          }
        } catch (error) {
          console.error('Error calculating volumetric price:', error);
        }
      } else {
        console.error('Missing required data for volumetric pricing:');
        console.error('- Dimensions:', dimensions);
        console.error('- Box count:', boxesCount);
      }
    }

    // Calculate total price as sum of docket price and calculated price
    const totalPrice = docketPrice + calculatedPrice;
    // console.log('Final calculated price:', calculatedPrice);
    // console.log('Final docket price:', docketPrice);
    // console.log('Total price (docket + calculated):', totalPrice);

    setFormData((prev) => ({
      ...prev,
      calculated_price: calculatedPrice > 0 ? calculatedPrice.toFixed(2) : '0',
      total_price: totalPrice > 0 ? totalPrice.toFixed(2) : '0',
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

    // Recalculate price when boxes count, weight, or dimensions change
    if (field === 'total_boxes_count' || field === 'total_order_weight' || field === 'dimensions') {
      // For client preference pricing
      if (pricingMethod === 'clientPreference' && selectedClient) {
        const client = clients.find((c) => c.id === selectedClient);
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
        docket_price: parseFloat(formData.docket_price || '0'),
        calculated_price: parseFloat(formData.calculated_price || '0'),
        total_price: parseFloat(formData.total_price || '0'),
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
        docket_price: '',
        calculated_price: '',
        total_price: '',
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

                    if (chargeBasis === 'Per Boxes' && boxesCount) {
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
                docket_price: '',
                calculated_price: '',
                total_price: '',
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
