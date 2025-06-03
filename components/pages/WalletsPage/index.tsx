'use client';

import React from 'react';
import { DataTable } from './data-table';
import { columns } from './columns';
import { SiteHeader } from '@/components/site-header';
import { useWallets } from '@/hooks/useWallets';

const WalletsPage = () => {
  const { wallets, isLoading, error } = useWallets();

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
