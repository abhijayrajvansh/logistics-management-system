import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Order } from '@/types';

export function useOrders() {
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
            
            const orderResponse = {
              order_id: doc.id,
              ...data,  
            } as Order;
            
            return orderResponse;
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


export default useOrders;