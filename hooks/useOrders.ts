import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Order } from '@/types';

export function useOrders(locationFilter?: string) {
  const [readyAndAssignedOrders, setReadyAndAssignedOrders] = useState<Order[]>([]);
  const [inTransitOrders, setInTransitOrders] = useState<Order[]>([]);
  const [transferredOrders, setTransferredOrders] = useState<Order[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
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
          const readyAndAssigned: Order[] = [];
          const inTransit: Order[] = [];
          const transferred: Order[] = [];
          const delivered: Order[] = [];

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const order: Order = {
              order_id: doc.id,
              ...data,
            } as Order;

            // Categorize orders based on status
            switch (order.status) {
              case 'Ready To Transport':
              case 'Assigned':
                readyAndAssigned.push(order);
                break;
              case 'In Transit':
                inTransit.push(order);
                break;
              case 'Transferred':
                transferred.push(order);
                break;
              case 'Delivered':
                delivered.push(order);
                break;
            }
          });

          setReadyAndAssignedOrders(readyAndAssigned);
          setInTransitOrders(inTransit);
          setTransferredOrders(transferred);
          setDeliveredOrders(delivered);
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
    readyAndAssignedOrders,
    inTransitOrders,
    transferredOrders,
    deliveredOrders,
    isLoading,
    error,
  };
}

export default useOrders;
