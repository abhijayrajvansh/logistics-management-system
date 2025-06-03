import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Wallet } from '@/types';

export function useWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);

    try {
      // Set up real-time listener for wallets collection
      const walletsRef = collection(db, 'wallets');
      const walletsQuery = query(walletsRef);
      const unsubscribe = onSnapshot(
        walletsQuery,
        (snapshot) => {
          const fetchedWallets = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId || '',
              available_balance: data.available_balance || 0,
              transactions: data.transactions || [],
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            } as Wallet;
          });

          setWallets(fetchedWallets);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching wallets:', err);
          setError(err as Error);
          setIsLoading(false);
        },
      );

      // Clean up listener on unmount
      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up wallets listener:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  return {
    wallets,
    isLoading,
    error,
  };
}
