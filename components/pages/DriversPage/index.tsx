'use client';

import { columns } from './columns';
import { DataTable } from './data-table';
import { SiteHeader } from '@/components/site-header';
import useDrivers from '@/hooks/useDrivers';
import { PermissionGate } from '@/components/PermissionGate';

export default function DriversPage() {
  const { drivers, isLoading, error } = useDrivers();

  // No need to spread the driver object since it already has an id field
  const formattedDrivers = drivers;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <PermissionGate
      feature="FEATURE_DRIVERS_VIEW"
      fallback={<div className="p-8 text-center">You don't have permission to view drivers.</div>}
    >
      <SiteHeader title="Drivers" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 md:gap-6 px-8 py-6">
            <DataTable columns={columns} data={formattedDrivers} />
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
