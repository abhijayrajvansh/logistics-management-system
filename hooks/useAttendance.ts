import { useState, useEffect } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { DriversAttendance, DailyAttendacne, Driver } from '@/types';

export function useAttendance() {
  const [attendance, setAttendance] = useState<DriversAttendance[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        // Fetch drivers directly from Firestore
        const driversRef = collection(db, 'drivers');
        const driversSnapshot = await getDocs(driversRef);
        const driversData = driversSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Driver,
        );
        setDrivers(driversData);

        // Fetch attendance data from Firestore
        const attendanceRef = collection(db, 'attendance');
        const attendanceSnapshot = await getDocs(attendanceRef);
        const attendanceData = attendanceSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as DriversAttendance,
        );
        setAttendance(attendanceData);

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process attendance data to include more details
  const processedAttendance = attendance.map((record) => {
    // Find the corresponding driver
    // Create a lookup map for drivers by id and driverId
    const driverMap = new Map();
    drivers.forEach((driver) => {
      if (driver.id) driverMap.set(driver.id, driver);
      if (driver.driverId) driverMap.set(driver.driverId, driver);
    });

    // Try to find driver by driverId from the record
    let driver = record.driverId ? driverMap.get(record.driverId) : null;

    // If not found, try to find by id as a fallback
    if (!driver && record.id) {
      driver = driverMap.get(record.id);
    }

    // Calculate attendance stats
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthAttendance = record.attendance
      ? record.attendance.filter((day) => {
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
        })
      : [];

    const totalPresent = currentMonthAttendance.filter((day) => day.status === 'Present').length;
    const totalAbsent = currentMonthAttendance.filter((day) => day.status === 'Absent').length;
    const totalDays = currentMonthAttendance.length;
    const attendancePercentage = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;
    const driverName = driver.driverName;

    return {
      ...record,
      driverName,
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
