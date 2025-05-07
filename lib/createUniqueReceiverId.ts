import { db } from '@/firebase/database';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Generates a unique 6-digit receiver ID with an optional prefix
 * @param prefix Optional prefix for the receiver ID (e.g., "RCV" for Receiver)
 * @returns A unique receiver ID string
 */
export function createUniqueReceiverId(prefix: string = 'RCV'): string {
  // Get current timestamp
  const timestamp = Date.now();

  // Generate a random 3-digit number
  const randomPart = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  // Take the last 3 digits of the timestamp
  const timestampPart = (timestamp % 1000).toString().padStart(3, '0');

  // Combine to create a 6-digit unique ID
  const sixDigitId = timestampPart + randomPart;

  // Format the ID to ensure it's exactly 6 digits
  const formattedId = sixDigitId.slice(0, 6);

  // Return the ID with optional prefix
  return `${prefix}${formattedId}`;
}

/**
 * Checks if a receiver ID already exists in the database
 * @param db Firestore database instance
 * @param receiverId Receiver ID to check
 * @returns Promise that resolves to true if the ID exists, false otherwise
 */
export async function doesReceiverIdExist(db: any, receiverId: string): Promise<boolean> {
  try {
    const receiversRef = collection(db, 'receivers');
    const q = query(receiversRef, where('receiverId', '==', receiverId));
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if receiver ID exists:', error);
    return false;
  }
}

/**
 * Generates a guaranteed unique receiver ID by checking against existing IDs
 * @param db Firestore database instance
 * @param prefix Optional prefix for the receiver ID
 * @returns Promise that resolves to a unique receiver ID
 */
export async function getUniqueVerifiedReceiverId(
  db: any,
  prefix: string = 'RCV',
): Promise<string> {
  let receiverId = createUniqueReceiverId(prefix);
  let exists = await doesReceiverIdExist(db, receiverId);

  // If the ID already exists, generate a new one until we find a unique ID
  while (exists) {
    receiverId = createUniqueReceiverId(prefix);
    exists = await doesReceiverIdExist(db, receiverId);
  }

  return receiverId;
}
