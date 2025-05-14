'use client';

import React from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { columns } from './columns';
import { DataTable } from './data-table';
import { SiteHeader } from '@/components/site-header';
import useTATs from '@/hooks/useTATs';
import useUsers from '@/hooks/useUsers';

export default function TATsPage() {
  const { user, loading: authLoading } = useAuth();
  const { users: currentUser, isLoading: isLoadingUsers, error: errorUsers } = useUsers(user?.uid);

  // Get the user's center location if they are a manager
  const userLocation = currentUser?.[0]?.location;
  const { tats, isLoading: isLoadingTATs, error: errorTATs } = useTATs('80314');
  
  console.log({tats})

  const isLoading = authLoading || isLoadingUsers || (userLocation && isLoadingTATs);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (errorUsers) {
    return <div>Error loading user info: {errorUsers.message}</div>;
  }

  if (errorTATs) {
    return <div>Error loading TAT mappings: {errorTATs.message}</div>;
  }

  // Pass TATs directly since they already include the id property from Firestore
  const formattedTATs = tats;

  return (
    <>
      <SiteHeader title="TAT Mappings" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            <DataTable columns={columns} data={formattedTATs} />
          </div>
        </div>
      </div>
    </>
  );
}
