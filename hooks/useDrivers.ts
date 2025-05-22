'use client';

import { useState, useEffect } from 'react';
import { Driver } from '@/types';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/database';

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const driversRef = collection(db, 'drivers');
      const unsubscribe = onSnapshot(
        driversRef,
        (snapshot) => {
          const driversData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Driver[];
          setDrivers(driversData);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching drivers:', err);
          setError(err as Error);
          setIsLoading(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up drivers listener:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  return { drivers, isLoading, error };
}

export default useDrivers;
