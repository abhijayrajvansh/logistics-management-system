'use client'

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Trip } from '@/types';
import { serializeData } from '@/lib/serializeData';

export function useTrips() {
  const [unassignedTrips, setUnassignedTrips] = useState<Trip[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [pastTrips, setPastTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);

    try {
      // Set up real-time listener for trips collection
      const tripsRef = collection(db, 'trips');
      const unsubscribe = onSnapshot(
        tripsRef,
        (snapshot) => {
          const unassigned: Trip[] = [];
          const active: Trip[] = [];
          const past: Trip[] = [];

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const serializedData = serializeData(data);

            const trip: Trip = {
              id: doc.id,
              tripId: serializedData.tripId,
              startingPoint: serializedData.startingPoint,
              destination: serializedData.destination,
              driver: serializedData.driver,
              numberOfStops: serializedData.numberOfStops,
              startDate: serializedData.startDate,
              truck: serializedData.truck,
              type: serializedData.type || 'unassigned',
              currentStatus: serializedData.currentStatus || undefined,
            };

            // Categorize trips based on type
            switch (trip.type) {
              case 'unassigned':
                unassigned.push(trip);
                break;
              case 'active':
                active.push(trip);
                break;
              case 'past':
                past.push(trip);
                break;
              default:
                unassigned.push(trip);
            }
          });

          setUnassignedTrips(unassigned);
          setActiveTrips(active);
          setPastTrips(past);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching trips:', err);
          setError(err as Error);
          setIsLoading(false);
        },
      );

      // Clean up listener on unmount
      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up trips listener:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  return {
    unassignedTrips,
    activeTrips,
    pastTrips,
    isLoading,
    error,
  };
}

export default useTrips;
