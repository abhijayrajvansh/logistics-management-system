import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/database';
import { Driver, LeaveBalance } from '../types';

/**
 * Get the total available leaves for a driver by combining currentMonthLeaves and transferredLeaves
 * @param driverId The unique identifier of the driver
 * @returns Total available leaves or null if driver not found
 */
export async function getAvailableLeaves(driverId: string): Promise<{
  totalAvailable: number;
  currentMonthLeaves: 0 | 1 | 2 | 3 | 4;
  transferredLeaves: 0 | 1 | 2 | 3 | 4;
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
      currentMonthLeaves: leaveBalance.currentMonthLeaves,
      transferredLeaves: leaveBalance.transferredLeaves,
    };
  } catch (error) {
    console.error('Error getting available leaves:', error);
    return null;
  }
}

getAvailableLeaves('AKVAHunHuQPyVGS2brCAeLhJ2V92').then((res) => console.log({ res }));
