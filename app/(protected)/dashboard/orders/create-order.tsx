'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseApp } from '@/firebase/firebase.config';
import { shippers, ShipperData } from '@/lib/mock-data';

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

// Initialize Firestore
const db = getFirestore(firebaseApp);

interface CreateOrderFormProps {
  onSuccess?: () => void;
}

export function CreateOrderForm({ onSuccess }: CreateOrderFormProps) {
  const [formData, setFormData] = useState({
    shipper_details: '',
    receiver_details: '',
    total_boxes_count: '',
    packing_type: '',
    dimensions: '',
    total_order_weight: '',
    lr_no: '',
    eway_bill_no: '',
    tat: '',
    charge_basis: '',
    docket_id: '100026',
    current_location: 'current_location:user',
    client_details: '',
    price: '',
    invoice: '', // Default value for the invoice enum
    status: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedShipper, setSelectedShipper] = useState<ShipperData | null>(null);

  // Effect to populate form fields when shipper is selected
  useEffect(() => {
    if (selectedShipper) {
      setFormData((prevData) => ({
        ...prevData,
        shipper_details: selectedShipper.name,
        receiver_details: selectedShipper.defaultReceiverDetails,
        tat: selectedShipper.defaultTAT,
        charge_basis: selectedShipper.defaultChargeBasis,
        client_details: selectedShipper.clientDetails,
      }));
    }
  }, [selectedShipper]);

  const handleShipperChange = (shipperId: string) => {
    const shipper = shippers.find((s) => s.id === shipperId);
    if (shipper) {
      setSelectedShipper(shipper);
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
        description: `Order ID: ${orderRef.id}`,
      });

      // Reset form after successful submission
      setFormData({
        shipper_details: '',
        receiver_details: '',
        total_boxes_count: '',
        packing_type: '',
        dimensions: '',
        total_order_weight: '',
        lr_no: '',
        eway_bill_no: '',
        tat: '',
        charge_basis: '',
        docket_id: '',
        current_location: '',
        client_details: '',
        price: '',
        invoice: '', // Default value for the invoice enum
        status: '',
      });
      setSelectedShipper(null);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Add small delay before refreshing to allow toast to be visible
      setTimeout(() => {
        window.location.reload();
      }, 1000);
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipper_details">Shipper Details</Label>
            <Select value={selectedShipper?.id || ''} onValueChange={handleShipperChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a shipper" />
              </SelectTrigger>
              <SelectContent>
                {shippers.map((shipper) => (
                  <SelectItem key={shipper.id} value={shipper.id}>
                    {shipper.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="client_details">Client Details</Label>
            <Input
              id="client_details"
              placeholder="Enter client details"
              value={formData.client_details}
              onChange={(e) => handleInputChange('client_details', e.target.value)}
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
            <Label htmlFor="packing_type">Packing Type</Label>
            <Input
              id="packing_type"
              placeholder="Enter packing type"
              value={formData.packing_type}
              onChange={(e) => handleInputChange('packing_type', e.target.value)}
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Label htmlFor="eway_bill_no">E-way Bill Number</Label>
            <Input
              id="eway_bill_no"
              placeholder="Enter e-way bill number"
              value={formData.eway_bill_no}
              onChange={(e) => handleInputChange('eway_bill_no', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="space-y-2">
            <Label htmlFor="charge_basis">Charge Basis</Label>
            <Select
              value={formData.charge_basis}
              onValueChange={(value) => handleInputChange('charge_basis', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select charge basis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="By Weight">By Weight</SelectItem>
                <SelectItem value="Per Boxes">Per Boxes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Order Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select order status" />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="Ready To Transport">Ready To Transport</SelectItem>
              <SelectItem value="Assigned">Assigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <SelectTrigger>
                <SelectValue placeholder="Select invoice type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">paid</SelectItem>
                <SelectItem value="to pay">to pay</SelectItem>
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
                packing_type: '',
                dimensions: '',
                total_order_weight: '',
                lr_no: '',
                eway_bill_no: '',
                tat: '',
                charge_basis: '',
                docket_id: '',
                current_location: '',
                client_details: '',
                price: '',
                invoice: '', // Default value for the invoice enum
                status: '',
              });
              setSelectedShipper(null);
            }}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Order...' : 'Create Order'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CreateOrderForm;
