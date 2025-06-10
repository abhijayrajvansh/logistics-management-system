import { useState, useEffect, useCallback } from 'react';
import { DriversRequest, Driver, Trip } from '@/types';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/database';

export const useRequests = () => {
  const [requests, setRequests] = useState<DriversRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [requestsWithDetails, setRequestsWithDetails] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const DRIVER_REQUEST_COLLECTION = 'driver_requests';
  const DRIVERS_COLLECTION = 'drivers';
  const TRIPS_COLLECTION = 'trips';

  // Fetch additional details for each request
  const fetchRequestDetails = useCallback(async (requestsData: DriversRequest[]) => {
    try {
      const requestsWithDetailsPromises = requestsData.map(async (request) => {
        // Fetch driver details
        let driverDetails = null;
        if (request.driverId) {
          try {
            const driverDoc = await getDoc(doc(db, DRIVERS_COLLECTION, request.driverId));
            if (driverDoc.exists()) {
              driverDetails = driverDoc.data() as Driver;
            }
          } catch (err) {
            console.warn(`Failed to fetch driver details for ${request.driverId}:`, err);
          }
        }

        // Fetch trip details
        let tripDetails = null;
        if (request.tripId) {
          try {
            const tripDoc = await getDoc(doc(db, TRIPS_COLLECTION, request.tripId));
            if (tripDoc.exists()) {
              tripDetails = tripDoc.data() as Trip;
            }
          } catch (err) {
            console.warn(`Failed to fetch trip details for ${request.tripId}:`, err);
          }
        }

        return {
          ...request,
          driverDetails,
          tripDetails,
        };
      });

      const enrichedRequests = await Promise.all(requestsWithDetailsPromises);
      setRequestsWithDetails(enrichedRequests);
    } catch (err) {
      console.error('Error fetching request details:', err);
    }
  }, []);

  useEffect(() => {
    try {
      const requestsRef = collection(db, DRIVER_REQUEST_COLLECTION);
      const requestsQuery = query(requestsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        requestsQuery,
        async (snapshot) => {
          const requestsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            proofImageUrl: doc.data().proofImageUrl || '',
            // Handle backward compatibility
            type: doc.data().type || doc.data().requestType,
            status: doc.data().status === 'declined' ? 'rejected' : doc.data().status,
          })) as DriversRequest[];

          setRequests(requestsData);

          // Count pending requests
          const pending = requestsData.filter((req) => req.status === 'pending').length;
          setPendingCount(pending);

          // Fetch additional details
          await fetchRequestDetails(requestsData);

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
  }, [fetchRequestDetails]);

  const approveRequest = useCallback(async (requestId: string) => {
    try {
      const requestRef = doc(db, DRIVER_REQUEST_COLLECTION, requestId);
      await updateDoc(requestRef, {
        status: 'approved',
        updatedAt: new Date(),
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
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error rejecting request:', error);
      return false;
    }
  }, []);

  // Filter functions for different request statuses
  const getPendingRequests = useCallback(() => {
    return requestsWithDetails.filter((req) => req.status === 'pending');
  }, [requestsWithDetails]);

  const getApprovedRequests = useCallback(() => {
    return requestsWithDetails.filter((req) => req.status === 'approved');
  }, [requestsWithDetails]);

  const getRejectedRequests = useCallback(() => {
    return requestsWithDetails.filter((req) => req.status === 'rejected');
  }, [requestsWithDetails]);

  // Filter by request type
  const getRequestsByType = useCallback(
    (type: DriversRequest['type']) => {
      return requestsWithDetails.filter((req) => req.type === type);
    },
    [requestsWithDetails],
  );

  // Filter by driver
  const getRequestsByDriver = useCallback(
    (driverId: string) => {
      return requestsWithDetails.filter((req) => req.driverId === driverId);
    },
    [requestsWithDetails],
  );

  // Filter by trip
  const getRequestsByTrip = useCallback(
    (tripId: string) => {
      return requestsWithDetails.filter((req) => req.tripId === tripId);
    },
    [requestsWithDetails],
  );

  // Get recent requests (last 30 days)
  const getRecentRequests = useCallback(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return requestsWithDetails.filter((req) => {
      const createdAt = req.createdAt?.toDate ? req.createdAt.toDate() : new Date(req.createdAt);
      return createdAt >= thirtyDaysAgo;
    });
  }, [requestsWithDetails]);

  return {
    // Raw data
    requests,
    requestsWithDetails,

    // Loading states
    isLoading,
    error,

    // Counts
    pendingCount,
    totalCount: requests.length,

    // Actions
    approveRequest,
    rejectRequest,

    // Filters
    getPendingRequests,
    getApprovedRequests,
    getRejectedRequests,
    getRequestsByType,
    getRequestsByDriver,
    getRequestsByTrip,
    getRecentRequests,
  };
};
