// Script to add sample driver requests for testing
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/database';

const sampleRequests = [
  {
    driverId: 'test-driver-1',
    tripId: 'test-trip-1',
    type: 'Leave',
    reason: 'Personal leave for family emergency',
    startDate: Timestamp.now(),
    endDate: Timestamp.fromDate(new Date(Date.now() + 86400000)), // 1 day later
    status: 'pending',
    createdAt: Timestamp.now(),
    proofImageUrl: '',
  },
  {
    driverId: 'test-driver-2',
    tripId: 'test-trip-2',
    type: 'Money',
    reason: 'Advance for fuel and toll expenses',
    startDate: Timestamp.now(),
    endDate: Timestamp.fromDate(new Date(Date.now() + 172800000)), // 2 days later
    status: 'pending',
    createdAt: Timestamp.now(),
    proofImageUrl: '',
  },
  {
    driverId: 'test-driver-3',
    tripId: 'test-trip-3',
    type: 'Maintenance',
    reason: 'Truck tire replacement needed urgently',
    startDate: Timestamp.now(),
    endDate: Timestamp.fromDate(new Date(Date.now() + 86400000)),
    status: 'approved',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)), // 1 day ago
    proofImageUrl: '',
  },
  {
    driverId: 'test-driver-4',
    tripId: 'test-trip-4',
    type: 'Food',
    reason: 'Meal allowance for long distance trip',
    startDate: Timestamp.now(),
    endDate: Timestamp.fromDate(new Date(Date.now() + 259200000)), // 3 days later
    status: 'rejected',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 172800000)), // 2 days ago
    proofImageUrl: '',
  },
  {
    driverId: 'test-driver-5',
    tripId: 'test-trip-5',
    type: 'Toll',
    reason: 'Highway toll charges reimbursement',
    startDate: Timestamp.now(),
    endDate: Timestamp.fromDate(new Date(Date.now() + 86400000)),
    status: 'pending',
    createdAt: Timestamp.now(),
    proofImageUrl: '',
  },
];

async function seedDriverRequests() {
  try {
    const requestsCollection = collection(db, 'driver_requests');

    for (const request of sampleRequests) {
      const docRef = await addDoc(requestsCollection, request);
      console.log('Added request with ID:', docRef.id);
    }

    console.log('Successfully seeded driver requests!');
  } catch (error) {
    console.error('Error seeding driver requests:', error);
  }
}

// Run the seeding function
seedDriverRequests();
