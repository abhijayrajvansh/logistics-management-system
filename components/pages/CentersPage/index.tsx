'use client';

import React from 'react';
import { DataTable } from './data-table';
import { columns } from './columns';
import useCenters from '@/hooks/useCenters';
import { SiteHeader } from '@/components/site-header';

const CentersPage = () => {
  const { centers, isLoading, error } = useCenters();

  if (isLoading) {
    return <div className="p-4">Loading centers...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading centers: {error.message}</div>;
  }

  return (
    <>
      <SiteHeader title="Orders" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            <DataTable columns={columns} data={centers} />
          </div>
        </div>
      </div>
    </>
  );
};

export default CentersPage;
