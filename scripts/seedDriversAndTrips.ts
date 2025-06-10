// Script to add sample drivers and trips for testing
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/database';

const sampleDrivers = [
  {
    id: 'test-driver-1',
    driverId: 'DRV001',
    driverName: 'Rajesh Kumar',
    status: 'Active',
    phoneNumber: '+91-9876543210',
    languages: ['Hindi', 'English'],
    leaveBalance: {
      currentMonthLeaves: 2,
      transferredLeaves: 1,
      cycleMonth: 1,
    },
    wheelsCapability: ['4', '6'],
    assignedTruckId: 'truck-001',
    date_of_joining: Timestamp.now(),
  },
  {
    id: 'test-driver-2',
    driverId: 'DRV002',
    driverName: 'Suresh Patel',
    status: 'OnTrip',
    phoneNumber: '+91-9876543211',
    languages: ['Hindi', 'Gujarati'],
    leaveBalance: {
      currentMonthLeaves: 3,
      transferredLeaves: 0,
      cycleMonth: 1,
    },
    wheelsCapability: ['6', '8'],
    assignedTruckId: 'truck-002',
    date_of_joining: Timestamp.now(),
  },
  {
    id: 'test-driver-3',
    driverId: 'DRV003',
    driverName: 'Mohammad Ali',
    status: 'Active',
    phoneNumber: '+91-9876543212',
    languages: ['Hindi', 'Urdu'],
    leaveBalance: {
      currentMonthLeaves: 4,
      transferredLeaves: 0,
      cycleMonth: 2,
    },
    wheelsCapability: ['4', '6', '8'],
    assignedTruckId: 'truck-003',
    date_of_joining: Timestamp.now(),
  },
  {
    id: 'test-driver-4',
    driverId: 'DRV004',
    driverName: 'Vikram Singh',
    status: 'OnLeave',
    phoneNumber: '+91-9876543213',
    languages: ['Hindi', 'Punjabi'],
    leaveBalance: {
      currentMonthLeaves: 1,
      transferredLeaves: 2,
      cycleMonth: 1,
    },
    wheelsCapability: ['6', '8', '10'],
    assignedTruckId: 'truck-004',
    date_of_joining: Timestamp.now(),
  },
  {
    id: 'test-driver-5',
    driverId: 'DRV005',
    driverName: 'Arjun Reddy',
    status: 'Active',
    phoneNumber: '+91-9876543214',
    languages: ['Hindi', 'Telugu'],
    leaveBalance: {
      currentMonthLeaves: 3,
      transferredLeaves: 1,
      cycleMonth: 1,
    },
    wheelsCapability: ['4', '6'],
    assignedTruckId: 'truck-005',
    date_of_joining: Timestamp.now(),
  },
];

const sampleTrips = [
  {
    id: 'test-trip-1',
    tripId: 'TRP001',
    currentLocation: 'Mumbai',
    startingPoint: 'Mumbai',
    destination: 'Delhi',
    driver: 'test-driver-1',
    numberOfStops: 3,
    startDate: Timestamp.now(),
    truck: 'truck-001',
    type: 'active',
    currentStatus: 'Delivering',
    odometerReading: 'NA',
    voucher: 'NA',
  },
  {
    id: 'test-trip-2',
    tripId: 'TRP002',
    currentLocation: 'Chennai',
    startingPoint: 'Chennai',
    destination: 'Bangalore',
    driver: 'test-driver-2',
    numberOfStops: 2,
    startDate: Timestamp.now(),
    truck: 'truck-002',
    type: 'active',
    currentStatus: 'Delivering',
    odometerReading: 'NA',
    voucher: 'NA',
  },
  {
    id: 'test-trip-3',
    tripId: 'TRP003',
    currentLocation: 'Pune',
    startingPoint: 'Pune',
    destination: 'Hyderabad',
    driver: 'test-driver-3',
    numberOfStops: 4,
    startDate: Timestamp.now(),
    truck: 'truck-003',
    type: 'active',
    currentStatus: 'Delivering',
    odometerReading: 'NA',
    voucher: 'NA',
  },
  {
    id: 'test-trip-4',
    tripId: 'TRP004',
    currentLocation: 'Kolkata',
    startingPoint: 'Kolkata',
    destination: 'Guwahati',
    driver: 'test-driver-4',
    numberOfStops: 5,
    startDate: Timestamp.fromDate(new Date(Date.now() - 86400000)),
    truck: 'truck-004',
    type: 'past',
    currentStatus: 'NA',
    odometerReading: 'NA',
    voucher: 'NA',
  },
  {
    id: 'test-trip-5',
    tripId: 'TRP005',
    currentLocation: 'Jaipur',
    startingPoint: 'Jaipur',
    destination: 'Ahmedabad',
    driver: 'test-driver-5',
    numberOfStops: 2,
    startDate: Timestamp.now(),
    truck: 'truck-005',
    type: 'active',
    currentStatus: 'Delivering',
    odometerReading: 'NA',
    voucher: 'NA',
  },
];

async function seedDriversAndTrips() {
  try {
    // Add drivers
    const driversCollection = collection(db, 'drivers');
    for (const driver of sampleDrivers) {
      const docRef = await addDoc(driversCollection, driver);
      console.log('Added driver with ID:', docRef.id);
    }

    // Add trips
    const tripsCollection = collection(db, 'trips');
    for (const trip of sampleTrips) {
      const docRef = await addDoc(tripsCollection, trip);
      console.log('Added trip with ID:', docRef.id);
    }

    console.log('Successfully seeded drivers and trips!');
  } catch (error) {
    console.error('Error seeding drivers and trips:', error);
  }
}

// Run the seeding function
seedDriversAndTrips();
