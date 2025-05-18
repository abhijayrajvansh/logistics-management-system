import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Driver } from '@/types';

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);

    try {
      // Set up real-time listener for drivers collection
      const driversRef = collection(db, 'drivers');
      const unsubscribe = onSnapshot(
        driversRef,
        (snapshot) => {
          const fetchedDrivers = snapshot.docs.map((doc) => {
            const data = doc.data();

            const driverResponse = {
              id: doc.id,
              driverId: data.driverId || '',
              driverName: data.driverName || '',
              status: data.status || 'Inactive',
              phoneNumber: data.phoneNumber || '',
              languages: Array.isArray(data.languages) ? data.languages : [],
              wheelsCapability: data.wheelsCapability || 0,
              assignedTruckId: data.assignedTruckId || 'NA',
              driverDocuments: data.driverDocuments
                ? {
                    ...data.driverDocuments,
                    dob: data.driverDocuments.dob?.toDate() || new Date(),
                    license_expiry: data.driverDocuments.license_expiry?.toDate() || new Date(),
                  }
                : 'NA',
              emergencyContact: data.emergencyContact || 'NA',
              referredBy: data.referredBy || 'NA',
            } as Driver;

            return driverResponse;
          });

          setDrivers(fetchedDrivers);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching drivers:', err);
          setError(err as Error);
          setIsLoading(false);
        },
      );

      // Clean up listener on unmount
      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up drivers listener:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  return {
    drivers,
    isLoading,
    error,
  };
}

export default useDrivers;
