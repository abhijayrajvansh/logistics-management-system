import { useState, useEffect } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { DriversAttendance, DailyAttendacne } from '@/types';
import useDrivers from './useDrivers';

export function useAttendance() {
  const [attendance, setAttendance] = useState<DriversAttendance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const { drivers } = useDrivers();

  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoading(true);

      try {
        // Fetch attendance data from Firestore
        const attendanceRef = collection(db, 'attendance');
        const snapshot = await getDocs(attendanceRef);

        const attendanceData: DriversAttendance[] = snapshot.docs.map((doc) => {
          return {
            id: doc.id,
            ...doc.data(),
          } as DriversAttendance;
        });

        setAttendance(attendanceData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  // Process attendance data to include more details
  const processedAttendance = attendance.map((record) => {
    // Find the corresponding driver
    const driver = drivers.find((d) => d.driverId === record.driverId);

    // Calculate attendance stats
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthAttendance = record.attendance.filter((day) => {
      // Fix the Timestamp conversion using proper type handling
      let jsDate: Date;

      if (day.date instanceof Timestamp) {
        // Use Timestamp's toDate() method if available
        jsDate = day.date.toDate();
      } else if (typeof day.date === 'object' && day.date !== null && 'seconds' in day.date) {
        // Handle plain timestamp object with seconds property
        const timestamp = day.date as { seconds: number };
        jsDate = new Date(timestamp.seconds * 1000);
      } else {
        // Fallback for string or other formats
        jsDate = new Date(day.date as any);
      }

      return jsDate.getMonth() === currentMonth && jsDate.getFullYear() === currentYear;
    });

    const totalPresent = currentMonthAttendance.filter((day) => day.status === 'Present').length;
    const totalAbsent = currentMonthAttendance.filter((day) => day.status === 'Absent').length;
    const totalDays = currentMonthAttendance.length;
    const attendancePercentage = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;

    return {
      ...record,
      driverName: driver?.driverName || 'Unknown Driver',
      currentMonthAttendance,
      totalPresent,
      totalAbsent,
      totalDays,
      attendancePercentage,
    };
  });

  return {
    attendance: processedAttendance,
    isLoading,
    error,
  };
}

export default useAttendance;
