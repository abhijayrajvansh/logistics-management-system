import { useState, useCallback } from 'react';
import { DriversRequest } from '@/types';

// Mock data for initial testing
const initialRequests: DriversRequest[] = [
  {
    id: "1",
    type: "leave",
    status: "Pending",
    title: "Annual Leave Request",
    description: "Need 5 days off for family function",
    createdAt: new Date(),
    driverId: "driver1"
  },
  {
    id: "2",
    type: "money",
    status: "Approve",
    title: "Advance Payment",
    description: "Request for advance salary",
    createdAt: new Date(),
    driverId: "driver2"
  },
];

export const useRequests = () => {
  const [requests, setRequests] = useState<DriversRequest[]>(initialRequests);

  const approveRequest = useCallback(async (requestId: string) => {
    try {
      // Mock API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock database update
      console.log("Updating request status in database...");
      
      setRequests(prev =>
        prev.map(request =>
          request.id === requestId
            ? { ...request, status: "Approve" }
            : request
        )
      );

      return true;
    } catch (error) {
      console.error("Error approving request:", error);
      return false;
    }
  }, []);

  const rejectRequest = useCallback(async (requestId: string) => {
    try {
      // Mock API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock database update
      console.log("Updating request status in database...");
      
      setRequests(prev =>
        prev.map(request =>
          request.id === requestId
            ? { ...request, status: "Rejected" }
            : request
        )
      );

      return true;
    } catch (error) {
      console.error("Error rejecting request:", error);
      return false;
    }
  }, []);

  return {
    requests,
    approveRequest,
    rejectRequest,
  };
};