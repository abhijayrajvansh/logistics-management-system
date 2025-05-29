import { DriversRequest } from '../types';
import { updateDriverLeaveBalance } from './manageDriverLeaveBalance';

/**
 * Processes different types of driver requests
 * @param request The driver's request
 * @throws Error if request is invalid or processing fails
 */
export async function processDriverRequest(request: DriversRequest): Promise<void> {
  try {
    switch (request.type) {
      case 'leave':
        await processLeaveRequest(request);
        break;
      case 'money':
        await processMoneyRequest(request);
        break;
      case 'food':
        await processFoodRequest(request);
        break;
      case 'others':
        await processOtherRequest(request);
        break;
      default:
        throw new Error(`Invalid request type: ${request.type}`);
    }
  } catch (error) {
    throw new Error(`Failed to process ${request.type} request: ${(error as Error).message}`);
  }
}

async function processLeaveRequest(request: DriversRequest): Promise<void> {
  // Convert dates and validate
  const start = request.startDate instanceof Date ? request.startDate : new Date(request.startDate);
  const end = request.endDate instanceof Date ? request.endDate : new Date(request.endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format in request');
  }

  if (end < start) {
    throw new Error('End date cannot be before start date');
  }

  // Calculate number of days (inclusive)
  const differenceInTime = end.getTime() - start.getTime();
  const numberOfDays = Math.floor(differenceInTime / (1000 * 3600 * 24)) + 1;

  await updateDriverLeaveBalance(request.driverId, numberOfDays);
}

// Mock functions for other request types
async function processMoneyRequest(request: DriversRequest): Promise<void> {
  console.log('Processing money request:', {
    driverId: request.driverId,
    reason: request.reason,
    proof: request.proofImageUrl || 'No proof provided'
  });
  // TODO: Implement actual money request processing
}

async function processFoodRequest(request: DriversRequest): Promise<void> {
  console.log('Processing food request:', {
    driverId: request.driverId,
    reason: request.reason,
    dates: {
      start: request.startDate,
      end: request.endDate
    }
  });
  // TODO: Implement actual food request processing
}

async function processOtherRequest(request: DriversRequest): Promise<void> {
  console.log('Processing other request:', {
    driverId: request.driverId,
    reason: request.reason,
    type: request.type
  });
  // TODO: Implement actual processing for other request types
}