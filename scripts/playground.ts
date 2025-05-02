import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/database';

/**
 * Function to add sample drivers to the Firestore database
 */
async function addSampleDrivers() {
  try {
    console.log('Adding sample drivers to the database...');

    const driversCollection = collection(db, 'drivers');

    // Sample driver data
    const sampleDrivers = [
      {
        driverId: 'DRV001',
        driverName: 'John Smith',
        driverTruckNo: 'TRK-1234',
        phoneNumber: '+91 9876543210',
        licenseNumber: 'DL-12345678',
        joinDate: new Date(),
      },
      {
        driverId: 'DRV002',
        driverName: 'David Johnson',
        driverTruckNo: 'TRK-5678',
        phoneNumber: '+91 8765432109',
        licenseNumber: 'DL-87654321',
        joinDate: new Date(),
      },
      {
        driverId: 'DRV003',
        driverName: 'Michael Wilson',
        driverTruckNo: 'TRK-9012',
        phoneNumber: '+91 7654321098',
        licenseNumber: 'DL-43219876',
        joinDate: new Date(),
      },
    ];

    // Check if drivers already exist to avoid duplicates
    const snapshot = await getDocs(driversCollection);
    const existingDriverIds = snapshot.docs.map((doc) => doc.data().driverId);

    for (const driver of sampleDrivers) {
      // Only add the driver if the ID doesn't already exist
      if (!existingDriverIds.includes(driver.driverId)) {
        await addDoc(driversCollection, {
          ...driver,
          createdAt: new Date(),
        });
        console.log(`Added driver: ${driver.driverName} (${driver.driverId})`);
      } else {
        console.log(`Driver ${driver.driverId} already exists, skipping...`);
      }
    }

    console.log('Sample drivers added successfully!');
  } catch (error) {
    console.error('Error adding sample drivers:', error);
  }
}

/**
 * Execute the function
 * Uncomment the line below to run the function when executing this script
 */
addSampleDrivers();

// export { addSampleDrivers };
