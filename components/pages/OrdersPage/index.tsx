'use client';

import { useAuth } from '@/app/context/AuthContext';
import { columns } from './columns';
import { DataTable } from './data-table';
import { SiteHeader } from '@/components/site-header';
import useOrders from '@/hooks/useOrders';
import useUsers from '@/hooks/useUsers';
import { PermissionGate } from '@/components/PermissionGate';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();

  const { users: currentUser, isLoading: isLoadingUsers, error: errorUsers } = useUsers(user?.uid);

  // got the user location from the currentUser
  // this is the location of the user who is logged in, works only for manager. !admin !driver (no accounts yet)
  const userLocation = currentUser?.[0]?.location;
  const {
    readyAndAssignedOrders,
    inTransitOrders,
    transferredOrders,
    deliveredOrders,
    upcomingTransfers, // Add this
    isLoading: isLoadingOrders,
    error: errorOrders,
  } = useOrders(userLocation);

  const isLoading = authLoading || isLoadingUsers || (userLocation && isLoadingOrders);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (errorUsers) {
    return <div>Error loading user info: {errorUsers.message}</div>;
  }

  if (errorOrders) {
    return <div>Error loading orders: {errorOrders.message}</div>;
  }

  // Add id field to each order category
  const formattedReadyAndAssigned = readyAndAssignedOrders.map((order) => ({
    id: order.order_id,
    ...order,
  }));

  const formattedInTransit = inTransitOrders.map((order) => ({
    id: order.order_id,
    ...order,
  }));

  const formattedTransferred = transferredOrders.map((order) => ({
    id: order.order_id,
    ...order,
  }));

  const formattedDelivered = deliveredOrders.map((order) => ({
    id: order.order_id,
    ...order,
  }));

  const formattedUpcomingTransfers = upcomingTransfers.map((order) => ({
    id: order.order_id,
    ...order,
  }));

  return (
    <PermissionGate
      feature="FEATURE_ORDERS_VIEW"
      fallback={<div className="p-8 text-center">You don't have permission to view orders.</div>}
    >
      <SiteHeader title="Orders" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            <DataTable
              columns={columns}
              data={formattedReadyAndAssigned}
              inTransitData={formattedInTransit}
              transferredData={formattedTransferred}
              deliveredData={formattedDelivered}
              upcomingTransfersData={formattedUpcomingTransfers}
            />
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
