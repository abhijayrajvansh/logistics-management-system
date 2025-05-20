import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/database';
import { Driver, LeaveBalance } from '../types';

/**
 * Get the total available leaves for a driver by combining currentMonthLeaves and transferredLeaves
 * @param driverId The unique identifier of the driver
 * @returns Total available leaves or null if driver not found
 */
export async function getAvailableLeaves(driverId: string): Promise<{
  totalAvailable: number;
} | null> {
  try {
    // Get driver document from Firestore
    const driverRef = doc(db, 'drivers', driverId);
    const driverDoc = await getDoc(driverRef);

    if (!driverDoc.exists()) {
      console.error(`Driver with ID ${driverId} not found`);
      return null;
    }

    const driver = driverDoc.data() as Driver;
    const leaveBalance = driver.leaveBalance;

    return {
      totalAvailable: leaveBalance.currentMonthLeaves + leaveBalance.transferredLeaves,
    };
  } catch (error) {
    console.error('Error getting available leaves:', error);
    return null;
  }
}

/**
 * Updates leave balance for all drivers at the start of a new month
 * - Sets currentMonthLeaves to 4 (fresh allocation)
 * - Transfers unused leaves from previous month to transferredLeaves if cycleMonth is 1
 * @param driverId The unique identifier of the driver
 */
export async function initializeCurrentMonthLeaveBalance(driverId?: string): Promise<void> {
  try {
    const driversToUpdate = [];

    if (driverId) {
      // Update specific driver
      const driverRef = doc(db, 'drivers', driverId);
      const driverDoc = await getDoc(driverRef);

      if (driverDoc.exists()) {
        driversToUpdate.push({ ref: driverRef, data: driverDoc.data() as Driver });
      } else {
        console.error(`Driver with ID ${driverId} not found`);
        return;
      }
    } else {
      // Update all drivers
      console.log('Attempting to update all drivers...');
      const driversRef = collection(db, 'drivers');
      console.log('Retrieved drivers collection reference');
      const driversSnapshot = await getDocs(driversRef);

      // Log the number of drivers and their IDs
      console.log('Number of drivers found:', driversSnapshot.size);
      if (driversSnapshot.size === 0) {
        console.log(
          'No drivers found in the database. Please check your database connection and data.',
        );
        return;
      }
      console.log(
        'Driver IDs:',
        driversSnapshot.docs.map((doc) => doc.id),
      );

      driversSnapshot.forEach((doc) => {
        driversToUpdate.push({ ref: doc.ref, data: doc.data() as Driver });
      });
    }

    // Update each driver's leave balance
    for (const { ref, data: driver } of driversToUpdate) {
      console.log(`Processing driver: ${driver.driverName} (${driver.driverId})`);
      const oldBalance = driver.leaveBalance;
      console.log('Current leave balance:', oldBalance);

      // Calculate new transferredLeaves based on cycleMonth
      const newTransferredLeaves =
        oldBalance.cycleMonth === 1 && oldBalance.currentMonthLeaves > 0
          ? (oldBalance.currentMonthLeaves as 0 | 1 | 2 | 3 | 4)
          : 0;

      const newLeaveBalance: LeaveBalance = {
        currentMonthLeaves: 4, // Fresh allocation of 4 leaves
        transferredLeaves: newTransferredLeaves,
        cycleMonth: oldBalance.cycleMonth,
      };
      console.log('New leave balance to be set:', newLeaveBalance);

      try {
        // Update in Firestore
        await updateDoc(ref, {
          leaveBalance: newLeaveBalance,
        });
        console.log(`Successfully updated leave balance for driver: ${driver.driverName}`);
      } catch (updateError) {
        console.error(`Error updating driver ${driver.driverName}:`, updateError);
      }
    }

    console.log(`Successfully updated leave balance for ${driversToUpdate.length} driver(s)`);
  } catch (error) {
    console.error('Error updating leave balance:', error);
    throw error;
  }
}

/**
 * Updates a driver's leave balance when they request leaves
 * @param driverId The unique identifier of the driver
 * @param numberOfLeavesRequested Number of leaves the driver wants to take
 * @throws Error if requested leaves exceed available leaves
 */
export async function updateDriverLeaveBalance(
  driverId: string,
  numberOfLeavesRequested: number,
): Promise<void> {
  try {
    // Get driver's current leave balance
    const availableLeaves = await getAvailableLeaves(driverId);

    if (!availableLeaves) {
      throw new Error(`Driver with ID ${driverId} not found`);
    }

    // Check if driver has enough leaves
    if (numberOfLeavesRequested > availableLeaves.totalAvailable) {
      throw new Error(
        `Insufficient leave balance. Available: ${availableLeaves.totalAvailable}, Requested: ${numberOfLeavesRequested}`,
      );
    }

    // Get driver's current data
    const driverRef = doc(db, 'drivers', driverId);
    const driverDoc = await getDoc(driverRef);

    if (!driverDoc.exists()) {
      throw new Error(`Driver with ID ${driverId} not found`);
    }

    const driver = driverDoc.data() as Driver;
    const currentBalance = driver.leaveBalance;

    // Calculate new leave balance
    let remainingLeavesNeeded = numberOfLeavesRequested;
    let newCurrentMonthLeaves = currentBalance.currentMonthLeaves;
    let newTransferredLeaves = currentBalance.transferredLeaves;

    // First use current month leaves
    if (remainingLeavesNeeded <= currentBalance.currentMonthLeaves) {
      newCurrentMonthLeaves -= remainingLeavesNeeded;
      remainingLeavesNeeded = 0;
    } else {
      remainingLeavesNeeded -= currentBalance.currentMonthLeaves;
      newCurrentMonthLeaves = 0;
      // Use transferred leaves for the remaining
      newTransferredLeaves -= remainingLeavesNeeded;
    }

    // Update the leave balance in Firestore
    await updateDoc(driverRef, {
      leaveBalance: {
        currentMonthLeaves: newCurrentMonthLeaves,
        transferredLeaves: newTransferredLeaves,
        cycleMonth: currentBalance.cycleMonth,
      },
    });
  } catch (error) {
    console.error('Error updating driver leave balance:', error);
    throw error;
  }
}

// updateDriverLeaveBalance('AKVAHunHuQPyVGS2brCAeLhJ2V92', 5)
//   .then(() => {
//     console.log('Leave balance updated successfully');
//   })
//   .catch((error) => {
//     console.error('Error during leave balance update:', error);
//   })
//   .finally(() => {
//     process.exit(0);
//   })

// runs every month on the first day of the month
// initializeCurrentMonthLeaveBalance()
//   .then(() => {
//     console.log('Leave balance update completed successfully');
//   })
//   .catch((error) => {
//     console.error('Error during leave balance update:', error);
//   })
//   .finally(() => {
//     console.log('Leave balance update process finished');
//     process.exit(0);
//   });
