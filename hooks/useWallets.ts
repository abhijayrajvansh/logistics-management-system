import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Wallet } from '@/types';

interface UseWalletsProps {
  filterWalletId?: string;
}

export function useWallets({ filterWalletId }: UseWalletsProps = {}) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);

    try {
      let unsubscribe: () => void;

      if (filterWalletId) {
        // Listen to a specific wallet document
        const walletRef = doc(db, 'wallets', filterWalletId);
        unsubscribe = onSnapshot(
          walletRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              const wallet = {
                id: docSnapshot.id,
                userId: data.userId || '',
                available_balance: data.available_balance || 0,
                transactions: data.transactions || [],
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
              } as Wallet;

              setWallets([wallet]);
            } else {
              setWallets([]);
            }
            setIsLoading(false);
          },
          (err) => {
            console.error('Error fetching wallet:', err);
            setError(err as Error);
            setIsLoading(false);
          },
        );
      } else {
        // Set up real-time listener for wallets collection
        const walletsRef = collection(db, 'wallets');
        const walletsQuery = query(walletsRef);
        unsubscribe = onSnapshot(
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
      }

      // Clean up listener on unmount
      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up wallets listener:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, [filterWalletId]);

  return {
    wallets,
    isLoading,
    error,
  };
}
