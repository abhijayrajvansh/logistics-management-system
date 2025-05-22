'use client';

import { SiteHeader } from '@/components/site-header';
import { columns } from './columns';
import { DataTable } from './data-tabel';
import { useTrips } from '@/hooks/useTrips';

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
    <>
      <SiteHeader title="Trips" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="h-full flex-1 flex-col space-y-8 py-8">
            <DataTable
              columns={columns}
              data={readyToShipTrips}
              activeTripData={activeTrips}
              pastTripData={pastTrips}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default TripsPage;
