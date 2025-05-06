import { db } from '@/firebase/database';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Generates a unique 6-digit numeric driver ID
 * @returns A unique 6-digit numeric ID string
 */
export function createDriverId(): string {
  // Get current timestamp
  const timestamp = Date.now();

  // Generate a random 3-digit number
  const randomPart = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  // Take the last 3 digits of the timestamp
  const timestampPart = (timestamp % 1000).toString().padStart(3, '0');

  // Combine to create a 6-digit unique ID
  const driverId = timestampPart + randomPart;

  // Ensure it's exactly 6 digits
  return driverId.slice(0, 6);
}

/**
 * Checks if a driver ID already exists in the database
 * @param db Firestore database instance
 * @param driverId Driver ID to check
 * @returns Promise that resolves to true if the ID exists, false otherwise
 */
export async function doesDriverIdExist(db: any, driverId: string): Promise<boolean> {
  try {
    const driversRef = collection(db, 'drivers');
    const q = query(driversRef, where('driverId', '==', driverId));
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if driver ID exists:', error);
    return false;
  }
}

/**
 * Generates a guaranteed unique driver ID by checking against existing IDs
 * @param db Firestore database instance
 * @returns Promise that resolves to a unique 6-digit numeric driver ID
 */
export async function getUniqueVerifiedDriverId(db: any): Promise<string> {
  let driverId = createDriverId();
  let exists = await doesDriverIdExist(db, driverId);

  // If the ID already exists, generate a new one until we find a unique ID
  while (exists) {
    driverId = createDriverId();
    exists = await doesDriverIdExist(db, driverId);
  }

  return driverId;
}
