'use client';

import React from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequests } from '@/hooks/useRequests';
import { useDrivers } from '@/hooks/useDrivers';
import { toast } from 'sonner';
import { processDriverRequest } from '@/lib/manageDriverRequest';
import { PermissionGate } from '@/components/PermissionGate';

const RequestsPage = () => {
  const { requests, approveRequest, rejectRequest } = useRequests();
  const { drivers } = useDrivers();

  const pendingRequests = requests.filter((req) => req.status === 'pending');
  const approvedRequests = requests.filter((req) => req.status === 'approved');
  const rejectedRequests = requests.filter((req) => req.status === 'rejected');

  const handleApprove = async (id: string) => {
    try {
      // Find the request to be approved
      const request = requests.find((req) => req.id === id);
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
    try {
      await rejectRequest(id);
      toast.success('Request rejected successfully');
    } catch (error) {
      toast.error('Failed to reject request');
      console.error('Error rejecting request:', error);
    }
  };

  const columnConfig = React.useMemo(
    () => columns({ onApprove: handleApprove, onReject: handleReject, drivers }),
    [handleApprove, handleReject, drivers],
  );

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
          <h1 className="text-3xl font-semibold">Monitor Driver's Requests</h1>
          <p className="text-[14px] text-black/70 mt-1">
            Monitor and manage your drivers' requests records
          </p>
        </div>
      </div>

      {/* Pending Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columnConfig} data={pendingRequests} searchKey="title" />
        </CardContent>
      </Card>

      {/* Approved Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columnConfig} data={approvedRequests} searchKey="title" />
        </CardContent>
      </Card>

      {/* Rejected Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rejected Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columnConfig} data={rejectedRequests} searchKey="title" />
        </CardContent>
      </Card>
    </div>
    </PermissionGate>
  );
};

export default RequestsPage;
