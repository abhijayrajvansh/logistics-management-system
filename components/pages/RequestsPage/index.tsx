'use client';

import React from 'react';
import { columns } from './columns';
import { Request } from '@/types';
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequests } from '@/hooks/useRequests';
import { toast } from 'sonner';

const RequestsPage = () => {
  const { requests, approveRequest, rejectRequest } = useRequests();

  const pendingRequests = requests.filter((req) => req.status === 'Pending');
  const approvedRequests = requests.filter((req) => req.status === 'Approve');
  const rejectedRequests = requests.filter((req) => req.status === 'Rejected');

  const handleApprove = async (id: string) => {
    try {
      await approveRequest(id);
      toast.success('Request approved successfully');
    } catch (error) {
      toast.error('Failed to approve request');
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
    () => columns({ onApprove: handleApprove, onReject: handleReject }),
    [handleApprove, handleReject],
  );

  return (
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
  );
};

export default RequestsPage;
