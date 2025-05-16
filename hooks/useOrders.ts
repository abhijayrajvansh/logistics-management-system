import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, onSnapshot, or } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Order } from '@/types';

export function useOrders(locationFilter?: string) {
  const [readyAndAssignedOrders, setReadyAndAssignedOrders] = useState<Order[]>([]);
  const [inTransitOrders, setInTransitOrders] = useState<Order[]>([]);
  const [transferredOrders, setTransferredOrders] = useState<Order[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [upcomingTransfers, setUpcomingTransfers] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!locationFilter) return;

    setIsLoading(true);

    try {
      const ordersRef = collection(db, 'orders');

      // Create a query that matches:
      // 1. Orders where current_location matches locationFilter
      // 2. Orders that are to be transferred to this location
      const ordersQuery = query(
        ordersRef,
        or(
          where('current_location', '==', locationFilter),
          where('transfer_center_location', '==', locationFilter),
        ),
      );

      const unsubscribe = onSnapshot(
        ordersQuery,
        (snapshot) => {
          const readyAndAssigned: Order[] = [];
          const inTransit: Order[] = [];
          const transferred: Order[] = [];
          const delivered: Order[] = [];
          const upcoming: Order[] = [];

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const order: Order = {
              order_id: doc.id,
              ...data,
            } as Order;

            // If this is an incoming transfer and status is "In Transit"
            if (
              order.transfer_center_location === locationFilter &&
              order.status === 'In Transit'
            ) {
              upcoming.push(order);
              return;
            }

            // For orders at current location or transferred from here
            if (order.current_location === locationFilter) {
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
            }
          });

          setReadyAndAssignedOrders(readyAndAssigned);
          setInTransitOrders(inTransit);
          setTransferredOrders(transferred);
          setDeliveredOrders(delivered);
          setUpcomingTransfers(upcoming);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching orders:', err);
          setError(err as Error);
          setIsLoading(false);
        },
      );

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
    upcomingTransfers,
    isLoading,
    error,
  };
}

export default useOrders;
