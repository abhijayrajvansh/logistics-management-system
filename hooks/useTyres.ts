import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Tyre } from '@/types';

export function useTyres() {
  const [tyres, setTyres] = useState<Tyre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const tyresRef = collection(db, 'tyres');
      const unsubscribe = onSnapshot(
        tyresRef,
        (snapshot) => {
          const fetchedTyres = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              purchaseDate: data.purchaseDate?.toDate
                ? data.purchaseDate.toDate()
                : data.purchaseDate,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
            } as Tyre;
          });

          setTyres(fetchedTyres);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching tyres:', err);
          setError(err as Error);
          setIsLoading(false);
        },
      );

      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up tyres listener:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  return {
    tyres,
    isLoading,
    error,
  };
}

export default useTyres;
