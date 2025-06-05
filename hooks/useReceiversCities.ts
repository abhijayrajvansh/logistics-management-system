import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/firebase/database';
import { ReceiverDetails } from '@/types';

export default function useReceiversCities() {
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'receivers'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const uniqueCities = [
          ...new Set(
            querySnapshot.docs.map((doc) => {
              const data = doc.data() as ReceiverDetails;
              return data.receiverCity;
            }),
          ),
        ].filter(Boolean); // Remove any undefined or empty values

        setCities(uniqueCities);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching receiver cities:', error);
        setError(error as Error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { cities, isLoading, error };
}
