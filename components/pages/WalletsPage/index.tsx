'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from './data-table';
import { columns } from './columns';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Wallet } from '@/types';
import { SiteHeader } from '@/components/site-header';

const WalletsPage = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const walletsRef = collection(db, 'wallets');
    const walletsQuery = query(walletsRef);

    const unsubscribe = onSnapshot(
      walletsQuery,
      (snapshot) => {
        const walletsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Wallet[];
        setWallets(walletsData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching wallets:', error);
        setError(error as Error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <div className="p-4">Loading wallets...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading wallets: {error.message}</div>;
  }

  return (
    <>
      <SiteHeader title="Wallets" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            <DataTable columns={columns} data={wallets} />
          </div>
        </div>
      </div>
    </>
  );
};

export default WalletsPage;