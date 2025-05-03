'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';
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

interface UpdateOrderFormProps {
  orderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UpdateOrderForm({ orderId, onSuccess, onCancel }: UpdateOrderFormProps) {
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
    docket_id: '',
    current_location: '',
    client_details: '',
    price: '',
    invoice: '',
    status: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedShipper, setSelectedShipper] = useState<ShipperData | null>(null);

  // Fetch order data on component mount
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          const data = orderDoc.data();

          // Format date for input field if it exists
          let formattedTat = '';
          if (data.tat) {
            if (data.tat.toDate) {
              // Handle Firestore timestamp
              formattedTat = data.tat.toDate().toISOString().split('T')[0];
            } else if (data.tat instanceof Date) {
              // Handle regular Date object
              formattedTat = data.tat.toISOString().split('T')[0];
            } else if (typeof data.tat === 'string') {
              // Handle string date
              formattedTat = data.tat;
            }
          }

          setFormData({
            shipper_details: data.shipper_details || '',
            receiver_details: data.receiver_details || '',
            total_boxes_count: data.total_boxes_count?.toString() || '',
            packing_type: data.packing_type || '',
            dimensions: data.dimensions || '',
            total_order_weight: data.total_order_weight?.toString() || '',
            lr_no: data.lr_no || '',
            eway_bill_no: data.eway_bill_no || '',
            tat: formattedTat,
            charge_basis: data.charge_basis || '',
            docket_id: data.docket_id || '',
            current_location: data.current_location || '',
            client_details: data.client_details || '',
            price: data.price?.toString() || '',
            invoice: data.invoice || '', 
            status: data.status || '',
          });

          // Find and set the selected shipper
          const shipper = shippers.find((s) => s.name === data.shipper_details);
          if (shipper) {
            setSelectedShipper(shipper);
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
  }, [orderId, onCancel]);

  const handleShipperChange = (shipperId: string) => {
    const shipper = shippers.find((s) => s.id === shipperId);
    if (shipper) {
      setSelectedShipper(shipper);
      setFormData((prev) => ({
        ...prev,
        shipper_details: shipper.name,
        receiver_details: shipper.defaultReceiverDetails,
        tat: prev.tat || shipper.defaultTAT,
        charge_basis: shipper.defaultChargeBasis,
        client_details: shipper.clientDetails,
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
        updated_at: new Date(),
      };

      // Update the order in Firestore
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, validatedData);

      toast.success('Order updated successfully!');

      // Call onSuccess callback if provided
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
