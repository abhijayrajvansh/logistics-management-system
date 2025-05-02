// filepath: /Users/abhijayrajvansh/Desktop/tms/lib/createUniqueDocketId.ts
/**
 * Generates a unique numeric docket ID with 6-7 digits
 * @returns A unique numeric docket ID string
 */
export function createUniqueDocketId(): string {
  // Get current timestamp
  const timestamp = Date.now();

  // Generate a random 3-digit number
  const randomPart = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  // Take the last 4 digits of the timestamp
  const timestampPart = (timestamp % 10000).toString().padStart(4, '0');

  // Combine parts - this will create a 7-digit ID (4 from timestamp + 3 random)
  // We can trim it to 6 digits if needed
  const docketId = timestampPart + randomPart;

  // Get a section that is either 6 or 7 digits in length
  const length = Math.random() > 0.5 ? 6 : 7;
  const formattedId = docketId.slice(0, length);

  return formattedId;
}

/**
 * Checks if a docket ID already exists in the database
 * @param db Firestore database instance
 * @param docketId Docket ID to check
 * @returns Promise that resolves to true if the ID exists, false otherwise
 */
export async function doesDocketIdExist(db: any, docketId: string): Promise<boolean> {
  const { collection, query, where, getDocs } = await import('firebase/firestore');

  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('docketId', '==', docketId));
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if docket ID exists:', error);
    return false;
  }
}

/**
 * Generates a guaranteed unique docket ID by checking against existing IDs
 * @param db Firestore database instance
 * @returns Promise that resolves to a unique numeric docket ID
 */
export async function getUniqueVerifiedDocketId(db: any): Promise<string> {
  let docketId = createUniqueDocketId();
  let exists = await doesDocketIdExist(db, docketId);

  // If the ID already exists, generate a new one until we find a unique ID
  while (exists) {
    docketId = createUniqueDocketId();
    exists = await doesDocketIdExist(db, docketId);
  }

  return docketId;
}
