'use client';

import { columns } from './columns';
import { DataTable } from '../OrdersPage/data-table';
import { SiteHeader } from '@/components/site-header';
import useTrucks from '@/hooks/useTrucks';

export default function TrucksPage() {
  const { trucks, isLoading, error } = useTrucks();

  const formattedTrucks = trucks.map((truck) => ({
    ...truck,
  }));

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <>
      <SiteHeader title="Trucks" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            <DataTable columns={columns} data={formattedTrucks} />
          </div>
        </div>
      </div>
    </>
  );
}
