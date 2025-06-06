'use client';

import { SiteHeader } from '@/components/site-header';
import { columns } from './columns';
import { DataTable } from './data-tabel';
import { useTrips } from '@/hooks/useTrips';
import { PermissionGate } from '@/components/PermissionGate';

export function TripsPage() {
  const { readyToShipTrips, activeTrips, pastTrips, isLoading, error } = useTrips();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading trips...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error.message || 'Error loading trips'}
      </div>
    );
  }

  return (
    <PermissionGate 
      feature="FEATURE_TRIPS_VIEW"
      fallback={<div className="p-8 text-center">You don't have permission to view trips.</div>}
    >
      <SiteHeader title="Trips" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="h-full flex-1 flex-col space-y-8 px-4 py-6">
            <DataTable
              columns={columns}
              data={readyToShipTrips}
                            activeTripData={activeTrips}
              pastTripData={pastTrips}
            />
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}

export default TripsPage;
