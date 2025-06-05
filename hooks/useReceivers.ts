import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/firebase/database';
import { ReceiverDetails } from '@/types';

interface UseReceiversProps {
  city?: string;
}

export default function useReceivers({ city }: UseReceiversProps = {}) {
  const [receivers, setReceivers] = useState<ReceiverDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let q = query(collection(db, 'receivers'));

    // If city is provided, add the filter
    if (city) {
      q = query(collection(db, 'receivers'), where('receiverCity', '==', city));
    }

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
  }, [city]);

  return { receivers, isLoading, error };
}
