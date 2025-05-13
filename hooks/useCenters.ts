import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Center } from '@/types';

export function useCenters() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);

    try {
      // Set up real-time listener for centers collection
      const centersRef = collection(db, 'centers');
      const unsubscribe = onSnapshot(
        centersRef,
        (snapshot) => {
          const fetchedCenters = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || '',
              location: data.location || '',
              pincode: data.pincode || '',
            } as Center;
          });

          setCenters(fetchedCenters);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching centers:', err);
          setError(err as Error);
          setIsLoading(false);
        },
      );

      // Clean up listener on unmount
      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up centers listener:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  return {
    centers,
    isLoading,
    error,
  };
}

export default useCenters;
