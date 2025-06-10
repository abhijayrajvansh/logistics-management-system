'use client';

import React from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRequests } from '@/hooks/useRequests';
import { toast } from 'sonner';
import { processDriverRequest } from '@/lib/manageDriverRequest';
import { PermissionGate } from '@/components/PermissionGate';
import { useFeatureAccess } from '@/app/context/PermissionsContext';

const RequestsPage = () => {
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
  } = useRequests();
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4 lg:px-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                  <div className="text-2xl font-bold">{totalCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <div className="text-2xl font-bold text-green-600">{approvedRequests.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <div className="text-2xl font-bold text-red-600">{rejectedRequests.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Pending Requests
              <Badge variant="outline" className="ml-2">
                {pendingRequests.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length > 0 ? (
              <DataTable columns={columnConfig} data={pendingRequests} searchKey="reason" />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No pending requests found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approved Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Approved Requests
              <Badge variant="default" className="ml-2">
                {approvedRequests.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {approvedRequests.length > 0 ? (
              <DataTable columns={columnConfig} data={approvedRequests} searchKey="reason" />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No approved requests found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rejected Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Rejected Requests
              <Badge variant="destructive" className="ml-2">
                {rejectedRequests.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rejectedRequests.length > 0 ? (
              <DataTable columns={columnConfig} data={rejectedRequests} searchKey="reason" />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No rejected requests found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
};

export default RequestsPage;
