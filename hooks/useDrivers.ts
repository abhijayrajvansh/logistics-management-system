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
              driverTruckId: data.driverTruckId || '',
              driverDocuments: data.driverDocuments || {
                aadhar: '',
                dob: new Date(),
                license: '',
                insurance: '',
                medicalCertificate: '',
                panCard: '',
              },
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
