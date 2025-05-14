import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Order } from '@/types';

export function useOrders(locationFilter?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {

    // not running if location is not available
    // todo: add a check for locationFilter if its equal to "all", i.e. admin wants to see all pincode orders
    if (!locationFilter) return; 

    setIsLoading(true);

    try {
      // Set up real-time listener for orders collection
      const ordersRef = collection(db, 'orders');

      const ordersQuery = locationFilter 
        ? query(ordersRef, where('current_location', '==', locationFilter))
        : ordersRef;

      const unsubscribe = onSnapshot(
        ordersQuery,
        (snapshot) => {
          const fetchedOrders = snapshot.docs.map((doc) => {
            const data = doc.data();
            
            const orderResponse = {
              order_id: doc.id,
              ...data,  
            } as Order;

            console.log({orderResponse})
            
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
  }, [locationFilter]);

  return {
    orders,
    isLoading,
    error,
  };
}


export default useOrders;