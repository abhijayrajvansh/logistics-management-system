'use client';

import { SiteHeader } from '@/components/site-header';
import useTrips from '@/hooks/useTrips';
import { columns } from './columns';
import { DataTable } from './data-tabel';

export default function TripsPage() {
  const { unassignedTrips, activeTrips, pastTrips, isLoading, error } = useTrips();
  console.log({unassignedTrips})
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  return (
    <>
      <SiteHeader title="Trips" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1"></div>
            </div>
            <DataTable
              columns={columns}
              data={unassignedTrips}
              activeTripData={activeTrips}
              pastTripData={pastTrips}
            />
          </div>
        </div>
      </div>
    </>
  );
}
