'use client';

import { useState, useEffect } from 'react';
import { Driver } from '@/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/database';

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDrivers() {
      try {
        const driversRef = collection(db, 'drivers');
        const driversSnapshot = await getDocs(driversRef);
        const driversData = driversSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Driver[];
        setDrivers(driversData);
        setIsLoading(false);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    }

    fetchDrivers();
  }, []);

  return { drivers, isLoading, error };
}

export default useDrivers;
