'use client';

import { useAuth } from '@/app/context/AuthContext';
import { SiteHeader } from '@/components/site-header';
import { columns } from './columns';
import { DataTable } from './data-tabel';
import { useTrips } from '@/hooks/useTrips';
import useUsers from '@/hooks/useUsers';
import { PermissionGate } from '@/components/PermissionGate';

export function TripsPage() {
  const { user, loading: authLoading } = useAuth();

  const { users: currentUser, isLoading: isLoadingUsers, error: errorUsers } = useUsers(user?.uid);

  // got the user location from the currentUser
  // this is the location of the user who is logged in, works only for manager. !admin !driver (no accounts yet)
  const userLocation = currentUser?.[0]?.location;
  const {
    readyToShipTrips,
    activeTrips,
    pastTrips,
    isLoading: isLoadingTrips,
    error,
  } = useTrips(userLocation);

  const isLoading = authLoading || isLoadingUsers || (userLocation && isLoadingTrips);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading trips...</div>;
  }

  if (error || errorUsers) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error?.message || errorUsers?.message || 'Error loading trips'}
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
