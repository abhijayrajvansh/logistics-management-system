'use client';

import React from 'react';
import { DataTable } from './data-table';
import { columns } from './columns';
import { SiteHeader } from '@/components/site-header';
import { useWallets } from '@/hooks/useWallets';
import { PermissionGate } from '@/components/PermissionGate';

const WalletsPage = () => {
  const { wallets, isLoading, error } = useWallets();

  if (isLoading) {
    return <div className="p-4">Loading wallets...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading wallets: {error.message}</div>;
  }

  return (
    <PermissionGate 
      feature="FEATURE_WALLETS_VIEW"
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-600 mt-2">You don't have permission to view wallets.</p>
          </div>
        </div>
      }
    >
      <SiteHeader title="Wallets" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            <DataTable columns={columns} data={wallets} />
          </div>
        </div>
      </div>
    </PermissionGate>
  );
};

export default WalletsPage;
