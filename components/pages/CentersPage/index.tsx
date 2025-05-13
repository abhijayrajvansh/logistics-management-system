'use client';

import React from 'react';
import { DataTable } from './data-table';
import { columns } from './columns';
import useCenters from '@/hooks/useCenters';

const CentersPage = () => {
  const { centers, isLoading, error } = useCenters();

  if (isLoading) {
    return <div className="p-4">Loading centers...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading centers: {error.message}</div>;
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 md:flex">
      <DataTable data={centers} columns={columns} />
    </div>
  );
};

export default CentersPage;
