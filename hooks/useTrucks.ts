import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Truck } from '@/types';

export function useTrucks() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const trucksRef = collection(db, 'trucks');
      const unsubscribe = onSnapshot(
        trucksRef,
        (snapshot) => {
          const fetchedTrucks = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              insuranceExpiry: data.insuranceExpiry?.toDate(),
              permitExpiry: data.permitExpiry?.toDate(),
            } as Truck;
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
