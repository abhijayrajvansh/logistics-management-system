import { useState, useEffect, useCallback } from 'react';
import { DriversRequest } from '@/types';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/database';

export const useRequests = () => {
  const [requests, setRequests] = useState<DriversRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const DRIVER_REQUEST_COLLECTION = 'driver_requests';

  useEffect(() => {
    try {
      const requestsRef = collection(db, DRIVER_REQUEST_COLLECTION);
      const unsubscribe = onSnapshot(
        requestsRef,
        (snapshot) => {
          const requestsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            proofImageUrl: doc.data().proofImageUrl || '',
            // startDate: doc.data().startDate?.toDate(),
            // endDate: doc.data().endDate?.toDate(),
            // createdAt: doc.data().createdAt?.toDate(),
          })) as DriversRequest[];
          setRequests(requestsData);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching requests:', err);
          setError(err as Error);
          setIsLoading(false);
        },
      );

      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up requests listener:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  const approveRequest = useCallback(async (requestId: string) => {
    try {
      const requestRef = doc(db, DRIVER_REQUEST_COLLECTION, requestId);
      await updateDoc(requestRef, {
        status: 'approved',
      });
      return true;
    } catch (error) {
      console.error('Error approving request:', error);
      return false;
    }
  }, []);

  const rejectRequest = useCallback(async (requestId: string) => {
    try {
      const requestRef = doc(db, DRIVER_REQUEST_COLLECTION, requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
      });
      return true;
    } catch (error) {
      console.error('Error rejecting request:', error);
      return false;
    }
  }, []);

  return {
    requests,
    isLoading,
    error,
    approveRequest,
    rejectRequest,
  };
};
