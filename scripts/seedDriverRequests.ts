// Script to add sample driver requests for testing
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/database';

const sampleRequests = [
  {
    driverId: 'zly3XKWGt5VsvPSvPMCohxhIRws2',
    tripId: 'TRIP-2025-001',
    type: 'Leave',
    reason: 'Medical appointment',
    startDate: Timestamp.now(),
    endDate: Timestamp.fromDate(new Date(Date.now() + 86400000)), // 1 day later
    status: 'pending',
    createdAt: Timestamp.now(),
    proofImageUrl: '',
  },
  {
    driverId: 'zly3XKWGt5VsvPSvPMCohxhIRws2',
    tripId: 'TRIP-2025-002',
    type: 'Maintenance',
    reason: 'Brake system inspection and repair',
    startDate: Timestamp.now(),
    endDate: Timestamp.fromDate(new Date(Date.now() + 43200000)), // 12 hours later
    status: 'pending',
    createdAt: Timestamp.now(),
    proofImageUrl: '',
  },
  {
    driverId: 'zly3XKWGt5VsvPSvPMCohxhIRws2',
    tripId: 'TRIP-2025-003',
    type: 'Money',
    reason: 'Fuel advance for long-haul trip',
    startDate: Timestamp.now(),
    endDate: Timestamp.fromDate(new Date(Date.now() + 259200000)), // 3 days later
    status: 'pending',
    createdAt: Timestamp.now(),
    proofImageUrl: '',
  },
  {
    driverId: 'zly3XKWGt5VsvPSvPMCohxhIRws2',
    tripId: 'TRIP-2025-004',
    type: 'Food',
    reason: 'Per diem for interstate route',
    startDate: Timestamp.now(),
    endDate: Timestamp.fromDate(new Date(Date.now() + 172800000)), // 2 days later
    status: 'pending',
    createdAt: Timestamp.now(),
    proofImageUrl: '',
  },
  {
    driverId: 'zly3XKWGt5VsvPSvPMCohxhIRws2',
    tripId: 'TRIP-2025-005',
    type: 'Toll',
    reason: 'Highway toll expenses for route Mumbai-Delhi',
    startDate: Timestamp.now(),
    endDate: Timestamp.fromDate(new Date(Date.now() + 86400000)), // 1 day later
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
seedDriverRequests()
  .catch((error) => {
    console.error('Seeding failed:', error);
  })
  .finally(() => {
    process.exit(0);
  });
