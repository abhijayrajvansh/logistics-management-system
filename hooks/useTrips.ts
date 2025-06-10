'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, or } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Trip } from '@/types';
import { serializeData } from '@/lib/serializeData';

export function useTrips(locationFilter?: string) {
  const [readyToShipTrips, setReadyToShipTrips] = useState<Trip[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [pastTrips, setPastTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!locationFilter) return;

    setIsLoading(true);

    try {
      const tripsRef = collection(db, 'trips');

      // Create query based on locationFilter
      const tripsQuery =
        locationFilter === 'NA'
          ? query(tripsRef) // No location filter when "NA"
          : query(
              tripsRef,
              or(
                where('currentLocation', '==', locationFilter),
                where('startingPoint', '==', locationFilter),
                where('destination', '==', locationFilter),
              ),
            );

      const unsubscribe = onSnapshot(
        tripsQuery,
        (snapshot) => {
          const readyToShip: Trip[] = [];
          const active: Trip[] = [];
          const past: Trip[] = [];

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const serializedData = serializeData(data);

            const trip = {
              id: doc.id,
              ...data,
            } as Trip;

            // Categorize trips based on type
            switch (trip.type) {
              case 'ready to ship':
                readyToShip.push(trip);
                break;
              case 'active':
                active.push(trip);
                break;
              case 'past':
                past.push(trip);
                break;
              default:
                readyToShip.push(trip);
            }
          });

          setReadyToShipTrips(readyToShip);
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
  }, [locationFilter]);

  return {
    readyToShipTrips,
    activeTrips,
    pastTrips,
    isLoading,
    error,
  };
}

export default useTrips;
