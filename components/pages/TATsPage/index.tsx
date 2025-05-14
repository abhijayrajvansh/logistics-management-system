'use client';

import React from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { columns } from './columns';
import { DataTable } from './data-table';
import { SiteHeader } from '@/components/site-header';
import useTATs from '@/hooks/useTATs';
import useUsers from '@/hooks/useUsers';
import useCenters from '@/hooks/useCenters';

export default function TATsPage() {
  const { userData, loading: authLoading } = useAuth();
  const { centers } = useCenters();

  // Get the user's center pincode if they are a manager
  const userCenterPincode = userData?.location;

  const { tats, isLoading: isLoadingTATs, error: errorTATs } = useTATs(userCenterPincode);

  console.log({tats})

  const isLoading = authLoading || (userCenterPincode && isLoadingTATs);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (errorTATs) {
    return <div>Error loading TAT mappings: {errorTATs.message}</div>;
  }

  return (
    <>
      <SiteHeader title="TAT Mappings" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            <DataTable columns={columns} data={tats} />
          </div>
        </div>
      </div>
    </>
  );
}
