import React from 'react';
import { SiteHeader } from '../site-header';
import { DataTable } from '../../app/(protected)/dashboard/orders/data-table';

const Tabels = () => {
  return (
    <>
      <SiteHeader title="Tabels" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* <DataTable data={data} /> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Tabels;
