'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { FaRegEye } from 'react-icons/fa';
import { Timestamp } from 'firebase/firestore';

// Component for viewing attendance details
const AttendanceDetailsCell = ({ row }: { row: any }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const record = row.original;

  return (
    <div className="text-center">
      <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
        <FaRegEye className="mr-1" size={14} /> View
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Attendance History - {record.driverName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium">Attendance Summary</h3>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-semibold">Total Present:</span> {record.totalPresent} days
                  </p>
                  <p>
                    <span className="font-semibold">Total Absent:</span> {record.totalAbsent} days
                  </p>
                  <p>
                    <span className="font-semibold">Attendance Rate:</span>{' '}
                    {record.attendancePercentage}%
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Daily Records</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {record.currentMonthAttendance.map((day: any, index: number) => {
                  const date = day.date.toDate ? day.date.toDate() : new Date(day.date);
                  const formattedDate = date.toLocaleDateString();

                  return (
                    <div key={index} className="border rounded-md p-3">
                      <p className="font-medium">{formattedDate}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={day.status === 'Present' ? 'default' : 'destructive'}>
                          {day.status}
                        </Badge>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {day.driverPhoto !== 'NA' && (
                          <div>
                            <p className="text-xs mb-1">Driver Photo:</p>
                            <div className="relative h-20 w-full rounded-md overflow-hidden">
                              <Image
                                src={day.driverPhoto}
                                alt="Driver Photo"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {day.truckPhoto !== 'NA' && (
                          <div>
                            <p className="text-xs mb-1">Truck Photo:</p>
                            <div className="relative h-20 w-full rounded-md overflow-hidden">
                              <Image
                                src={day.truckPhoto}
                                alt="Truck Photo"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Type for the extended attendance record with calculated fields
type ExtendedAttendanceRecord = {
  id: string;
  driverId: string;
  driverName: string;
  attendance: any[];
  currentMonthAttendance: any[];
  totalPresent: number;
  totalAbsent: number;
  totalDays: number;
  attendancePercentage: number;
};

export const columns: ColumnDef<ExtendedAttendanceRecord>[] = [
  {
    accessorKey: 'driverName',
    header: 'Driver Name',
  },
  {
    accessorKey: 'totalPresent',
    header: 'Present Days',
    cell: ({ row }) => {
      const count: number = row.getValue('totalPresent');
      return <div className="text-left font-medium">{count}</div>;
    },
  },
  {
    accessorKey: 'totalAbsent',
    header: 'Absent Days',
    cell: ({ row }) => {
      const count: number = row.getValue('totalAbsent');
      return <div className="text-left font-medium">{count}</div>;
    },
  },
  {
    accessorKey: 'totalDays',
    header: 'Total Days',
    cell: ({ row }) => {
      const count: number = row.getValue('totalDays');
      return <div className="text-left font-medium">{count}</div>;
    },
  },
  {
    accessorKey: 'attendancePercentage',
    header: 'Attendance %',
    cell: ({ row }) => {
      const percentage: number = row.getValue('attendancePercentage');

      // Color coding based on attendance percentage
      let colorClass = 'text-amber-500';
      if (percentage >= 90) {
        colorClass = 'text-green-600';
      } else if (percentage < 70) {
        colorClass = 'text-red-600';
      }

      return <div className={`text-left font-medium ${colorClass}`}>{percentage}%</div>;
    },
  },
  {
    accessorKey: 'details',
    header: () => <div className="text-center">Attendance Details</div>,
    id: 'details',
    cell: AttendanceDetailsCell,
  },
];
