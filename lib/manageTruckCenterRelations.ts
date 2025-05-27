import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase/database';

/**
 * Links a truck to a center in a many-to-many relationship
 */
export async function linkTruckToCenter(truckId: string, centerId: string) {
  const joinId = `${truckId}_${centerId}`;
  const joinRef = doc(db, 'truck_centers', joinId);
  const truckRef = doc(db, 'trucks', truckId);
  const centerRef = doc(db, 'centers', centerId);

  await runTransaction(db, async (transaction) => {
    const joinDoc = await transaction.get(joinRef);
    if (joinDoc.exists()) {
      throw new Error('Relationship already exists.');
    }

    // Ensure both truck and center exist
    const truckSnap = await transaction.get(truckRef);
    const centerSnap = await transaction.get(centerRef);
    if (!truckSnap.exists() || !centerSnap.exists()) {
      throw new Error('Truck or Center does not exist.');
    }

    transaction.set(joinRef, {
      id: joinId,
      truckId,
      centerId,
      createdAt: serverTimestamp(),
    });
  });
}

/**
 * Removes the link between a truck and a center
 */
export async function unlinkTruckFromCenter(truckId: string, centerId: string) {
  const joinId = `${truckId}_${centerId}`;
  const joinRef = doc(db, 'truck_centers', joinId);

  await runTransaction(db, async (transaction) => {
    const joinDoc = await transaction.get(joinRef);
    if (!joinDoc.exists()) {
      throw new Error('Relationship does not exist.');
    }

    transaction.delete(joinRef);
  });
}

/**
 * Gets all trucks associated with a specific center
 */
export async function getTrucksForCenter(centerId: string) {
  const q = query(collection(db, 'truck_centers'), where('centerId', '==', centerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data().truckId);
}

/**
 * Gets all centers associated with a specific truck
 */
export async function getCentersForTruck(truckId: string) {
  const q = query(collection(db, 'truck_centers'), where('truckId', '==', truckId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data().centerId);
}
