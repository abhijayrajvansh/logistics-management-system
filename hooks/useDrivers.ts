import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Driver } from '@/types';

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const driversCollection = collection(db, 'drivers');
        const snapshot = await getDocs(driversCollection);

        const fetchedDrivers = snapshot.docs.map((doc) => ({
          id: doc.id,
          driverId: doc.data().driverId || '',
          driverName: doc.data().driverName || '',
          driverTruckNo: doc.data().driverTruckNo || '',
          phoneNumber: doc.data().phoneNumber || '',
          licenseNumber: doc.data().licenseNumber || '',
          status: doc.data().status || 'active',
        }));

        setDrivers(fetchedDrivers);
      } catch (err) {
        console.error('Error fetching drivers:', err);
        setError('Failed to load drivers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  return { drivers, isLoading, error };
}

export default useDrivers;
