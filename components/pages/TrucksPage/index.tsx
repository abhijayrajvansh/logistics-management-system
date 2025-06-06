'use client';

import { columns } from './columns';
import { DataTable } from '../TrucksPage/data-table';
import { SiteHeader } from '@/components/site-header';
import useTrucks from '@/hooks/useTrucks';
import { PermissionGate } from '@/components/PermissionGate';

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
    <PermissionGate
      feature="FEATURE_TRUCKS_VIEW"
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-600 mt-2">You don't have permission to view trucks.</p>
          </div>
        </div>
      }
    >
      <SiteHeader title="Trucks" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            <DataTable columns={columns} data={formattedTrucks} />
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
