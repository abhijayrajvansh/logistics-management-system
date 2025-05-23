'use client';

import React from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { SiteHeader } from '@/components/site-header';
import useAttendance from '@/hooks/useAttendance';

const AttendancePage = () => {
  const { attendance, isLoading, error } = useAttendance();

  const formattedAttendance = attendance.map((record) => ({
    // id: record.id,
    ...record,
  }));

  if (isLoading) {
    return (
      <>
        <SiteHeader title="Attendance" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="text-lg">Loading attendance data...</div>
            <div className="mt-2 text-sm text-muted-foreground">Please wait</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SiteHeader title="Attendance" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-red-500">
            <div className="text-lg">Error loading attendance data</div>
            <div className="mt-2 text-sm">{error.message}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader title="Attendance" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            <DataTable columns={columns} data={formattedAttendance} />
          </div>
        </div>
      </div>
    </>
  );
};

export default AttendancePage;
