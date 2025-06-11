'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useFeatureAccess } from '@/app/context/PermissionsContext';
import { PermissionGate } from '@/components/PermissionGate';
import { Badge } from '@/components/ui/badge';
import { useRequests } from '@/hooks/useRequests';
import { processDriverRequest } from '@/lib/manageDriverRequest';
import React from 'react';
import { toast } from 'sonner';
import { columns } from './columns';
import { DataTable } from './data-table';

const RequestsPage = () => {
  const { userData } = useAuth();

  // Filter requests by managerId if the current user is a manager
  const managerId = userData?.role === 'manager' ? userData.userId : undefined;

  const {
    requestsWithDetails,
    approveRequest,
    rejectRequest,
    isLoading,
    getPendingRequests,
    getApprovedRequests,
    getRejectedRequests,
    pendingCount,
    totalCount,
  } = useRequests(managerId);
  const { can } = useFeatureAccess();

  const pendingRequests = getPendingRequests();
  const approvedRequests = getApprovedRequests();
  const rejectedRequests = getRejectedRequests();

  const handleApprove = async (id: string) => {
    // Check permission before allowing approval
    if (!can('FEATURE_REQUESTS_APPROVE')) {
      toast.error('You do not have permission to approve requests');
      return;
    }

    try {
      // Find the request to be approved
      const request = requestsWithDetails.find((req) => req.id === id);
      if (!request) {
        throw new Error('Request not found');
      }

      // First process the request (handle leave balances, etc.)
      await processDriverRequest(request);

      // Then update the status to approved
      await approveRequest(id);
      toast.success('Request approved successfully');
    } catch (error) {
      toast.error(`Failed to approve request: ${(error as Error).message}`);
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (id: string) => {
    // Check permission before allowing rejection
    if (!can('FEATURE_REQUESTS_REJECT')) {
      toast.error('You do not have permission to reject requests');
      return;
    }

    try {
      await rejectRequest(id);
      toast.success('Request rejected successfully');
    } catch (error) {
      toast.error('Failed to reject request');
      console.error('Error rejecting request:', error);
    }
  };

  const columnConfig = React.useMemo(
    () => columns({ onApprove: handleApprove, onReject: handleReject }),
    [handleApprove, handleReject],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      feature="FEATURE_REQUESTS_VIEW"
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-600 mt-2">You don't have permission to view requests.</p>
          </div>
        </div>
      }
    >
      <div className="container mx-auto py-10 space-y-8">
        {/* Title and header */}
        <div className="flex justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-semibold">Manage Driver's Requests</h1>
            <p className="text-[14px] text-black/70 mt-1">
              Monitor and manage your drivers' requests records
            </p>
          </div>
        </div>

        {/* Pending Requests Table */}
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              Pending Requests
              <Badge variant="outline" className="ml-2">
                {pendingRequests.length}
              </Badge>
            </h2>
          </div>
          <div>
            <DataTable columns={columnConfig} data={pendingRequests} searchKey="reason" />
          </div>
        </div>

        {/* Approved Requests Table */}
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              Approved Requests
              <Badge variant="default" className="ml-2">
                {approvedRequests.length}
              </Badge>
            </h2>
          </div>
          <div>
            <DataTable columns={columnConfig} data={approvedRequests} searchKey="reason" />
          </div>
        </div>

        {/* Rejected Requests Table */}
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              Rejected Requests
              <Badge variant="destructive" className="ml-2">
                {rejectedRequests.length}
              </Badge>
            </h2>
          </div>
          <div>
            <DataTable columns={columnConfig} data={rejectedRequests} searchKey="reason" />
          </div>
        </div>
      </div>
    </PermissionGate>
  );
};

export default RequestsPage;
