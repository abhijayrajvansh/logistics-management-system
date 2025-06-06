'use client';

import React from 'react';
import { DataTable } from './data-table';
import { columns } from './columns';
import useCenters from '@/hooks/useCenters';
import { SiteHeader } from '@/components/site-header';
import { PermissionGate } from '@/components/PermissionGate';

const CentersPage = () => {
  const { centers, isLoading, error } = useCenters();

  if (isLoading) {
    return <div className="p-4">Loading centers...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading centers: {error.message}</div>;
  }

  return (
    <PermissionGate 
      feature="FEATURE_CENTERS_VIEW"
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-600 mt-2">You don't have permission to view centers.</p>
          </div>
        </div>
      }
    >
      <SiteHeader title="Centers" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            <DataTable columns={columns} data={centers} />
          </div>
        </div>
      </div>
    </PermissionGate>
  );
};

export default CentersPage;
