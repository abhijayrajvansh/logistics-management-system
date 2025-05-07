import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Client } from '@/types';

export default function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'clients'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const clientData: Client[] = [];
        snapshot.forEach((doc) => {
          clientData.push({ id: doc.id, ...doc.data() } as Client);
        });
        setClients(clientData);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching clients:', err);
        setError(err as Error);
        setIsLoading(false);
      },
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { clients, isLoading, error };
}
