'use client';

import { columns } from './columns';
import { DataTable } from './data-tabel';
import { useTrips } from '@/hooks/useTrips';

export function TripsPage() {
  const { unassignedTrips, activeTrips, pastTrips, isLoading, error } = useTrips();

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
    <div className="h-full flex-1 flex-col space-y-8 py-8">
      <DataTable
        columns={columns}
        data={unassignedTrips}
        activeTripData={activeTrips}
        pastTripData={pastTrips}
      />
    </div>
  );
}

export default TripsPage;
