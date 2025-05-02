import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/database';

// Order type definition
export interface Order {
  orderId: string;
  docket_id?: string;
  charge_basis: string;
  client_details: string;
  created_at: Date;
  current_location: string;
  dimensions: string;
  eway_bill_no: string;
  invoice: string;
  lr_no: string;
  packing_type: string;
  price: number;
  receiver_details: string;
  shipper_details: string;
  status: string;
  tat: Date;
  total_boxes_count: number;
  total_order_weight: number;
  updated_at: Date;
  pickup_location: string;
  delivery_location: string;
  customer_name: string;
}

export default function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);

    try {
      // Set up real-time listener for orders collection
      const ordersRef = collection(db, 'orders');
      const unsubscribe = onSnapshot(
        ordersRef,
        (snapshot) => {
          const fetchedOrders = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              orderId: doc.id,
              docket_id: data.docket_id,
              customer_name: data.customer_name,
              status: data.status || 'unassigned',
              pickup_location: data.pickup_location,
              delivery_location: data.delivery_location,
              created_at: data.created_at?.toDate() || new Date(),
              // Map other fields as needed
              ...data,
            } as Order;
          });

          setOrders(fetchedOrders);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching orders:', err);
          setError(err as Error);
          setIsLoading(false);
        },
      );

      // Clean up listener on unmount
      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up orders listener:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  return {
    orders,
    isLoading,
    error,
  };
}
