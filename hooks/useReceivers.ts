import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/firebase/database';
import { ReceiverDetails } from '@/types';

export default function useReceivers() {
  const [receivers, setReceivers] = useState<ReceiverDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'receivers'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const receiversData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ReceiverDetails[];
        setReceivers(receiversData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching receivers:', error);
        setError(error as Error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { receivers, isLoading, error };
}
