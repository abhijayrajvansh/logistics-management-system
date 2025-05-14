'use client';

import { columns } from './columns';
import { DataTable } from './data-table';
import { SiteHeader } from '@/components/site-header';
import useOrders from '@/hooks/useOrders';

export default function OrdersPage() {
  const { orders, isLoading, error } = useOrders('<manager-current-location>');

  const formattedOrders = orders.map((order) => ({
    id: order.order_id,
    ...order,
  }));

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <>
      <SiteHeader title="Orders" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            <DataTable columns={columns} data={formattedOrders} />
          </div>
        </div>
      </div>
    </>
  );
}
