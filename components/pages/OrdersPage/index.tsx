'use client';

import { useAuth } from '@/app/context/AuthContext';
import { columns } from './columns';
import { DataTable } from './data-table';
import { SiteHeader } from '@/components/site-header';
import useOrders from '@/hooks/useOrders';
import useUsers from '@/hooks/useUsers';

export default function OrdersPage() {
  const { user, loading } = useAuth();
  
  const {users: currentUser, isLoading: isLoadingUsers, error: errorUsers} = useUsers(user?.uid);

  console.log({currentUser})
  
  const { orders, isLoading, error } = useOrders(currentUser[0]?.location);

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
