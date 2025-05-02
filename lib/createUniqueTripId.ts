/**
 * Generates a unique 6-digit trip ID with an optional prefix
 * @param prefix Optional prefix for the trip ID (e.g., "TR" for Trip)
 * @returns A unique trip ID string
 */
export function createUniqueTripId(prefix: string = 'TR'): string {
  // Get current timestamp
  const timestamp = Date.now();
  
  // Generate a random 3-digit number
  const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
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
 * Checks if a trip ID already exists in the database
 * @param db Firestore database instance
 * @param tripId Trip ID to check
 * @returns Promise that resolves to true if the ID exists, false otherwise
 */
export async function doesTripIdExist(db: any, tripId: string): Promise<boolean> {
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  
  try {
    const tripsRef = collection(db, 'trips');
    const q = query(tripsRef, where('tripId', '==', tripId));
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if trip ID exists:', error);
    return false;
  }
}

/**
 * Generates a guaranteed unique trip ID by checking against existing IDs
 * @param db Firestore database instance
 * @param prefix Optional prefix for the trip ID
 * @returns Promise that resolves to a unique trip ID
 */
export async function getUniqueVerifiedTripId(db: any, prefix: string = 'TR'): Promise<string> {
  let tripId = createUniqueTripId(prefix);
  let exists = await doesTripIdExist(db, tripId);
  
  // If the ID already exists, generate a new one until we find a unique ID
  while (exists) {
    tripId = createUniqueTripId(prefix);
    exists = await doesTripIdExist(db, tripId);
  }
  
  return tripId;
}