import { db } from '@/firebase/database';
import { Driver } from '@/types';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function fetchActiveDrivers(): Promise<Driver[]> {
  try {
    const ordersRef = collection(db, 'drivers');
    const q = query(ordersRef, where('status', '==', 'Active'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          driverId: doc.id,
          ...doc.data(),
        }) as Driver,
    );
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}