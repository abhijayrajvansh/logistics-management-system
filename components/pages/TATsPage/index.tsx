'use client';

import { SiteHeader } from '@/components/site-header';
import useTATs from '@/hooks/useTATs';
import { columns } from './columns';
import { DataTable } from './data-table';
import { PermissionGate } from '@/components/PermissionGate';

export default function TATsPage() {
  const { tats, isLoading: isLoadingTATs, error: errorTATs } = useTATs();

  if (isLoadingTATs) {
    return <div>Loading...</div>;
  }

  if (errorTATs) {
    return <div>Error loading TAT mappings: {errorTATs.message}</div>;
  }

  return (
    <PermissionGate
      feature="FEATURE_TATS_VIEW"
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-600 mt-2">You don't have permission to view TATs.</p>
          </div>
        </div>
      }
    >
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
          <DataTable columns={columns} data={tats} />
        </div>
      </div>
    </PermissionGate>
  );
}
