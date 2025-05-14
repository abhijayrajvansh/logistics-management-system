import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/firebase/database';

export type TAT_Mapping = {
  id: string;
  center_id: string;
  client_id: string;
  receiver_id: string;
  tat_value: number; // in hours
  created_at: Timestamp;
  updated_at: Timestamp;
};

const useTATs = (centerLocation?: string) => {
  const [tats, setTATs] = useState<TAT_Mapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: () => void;

    const fetchTATs = async () => {
      try {
        setIsLoading(true);
        const tatsRef = collection(db, 'tats');

        // Create query based on center location if provided
        const tatsQuery = centerLocation
          ? query(tatsRef, where('center_id', '==', centerLocation))
          : query(tatsRef);

        // Set up real-time listener
        unsubscribe = onSnapshot(
          tatsQuery,
          (snapshot) => {
            const tatsData: TAT_Mapping[] = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as Omit<TAT_Mapping, 'id'>),
            }));
            setTATs(tatsData);
            setIsLoading(false);
          },
          (err) => {
            console.error('Error fetching TATs:', err);
            setError(err as Error);
            setIsLoading(false);
          },
        );
      } catch (err) {
        console.error('Error setting up TATs listener:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchTATs();

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [centerLocation]);

  return { tats, isLoading, error };
};

export default useTATs;
