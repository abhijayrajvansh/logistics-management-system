import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Truck } from '@/types';

export function useTrucks() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);

    try {
      // Set up real-time listener for trucks collection
      const trucksRef = collection(db, 'trucks');
      const unsubscribe = onSnapshot(
        trucksRef,
        (snapshot) => {
          const fetchedTrucks = snapshot.docs.map((doc) => {
            const data = doc.data();

            const truckResponse = {
              id: doc.id,
              ...data,
            } as Truck;

            return truckResponse;
          });

          setTrucks(fetchedTrucks);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching trucks:', err);
          setError(err as Error);
          setIsLoading(false);
        },
      );

      // Clean up listener on unmount
      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up trucks listener:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  return {
    trucks,
    isLoading,
    error,
  };
}

export default useTrucks;
