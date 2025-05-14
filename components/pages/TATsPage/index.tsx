'use client';

import { SiteHeader } from '@/components/site-header';
import useTATs from '@/hooks/useTATs';
import { columns } from './columns';
import { DataTable } from './data-table';

export default function TATsPage() {
  const { tats, isLoading: isLoadingTATs, error: errorTATs } = useTATs();

  console.log({ tats });

  if (isLoadingTATs) {
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
