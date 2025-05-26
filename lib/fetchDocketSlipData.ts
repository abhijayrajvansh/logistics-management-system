import { db } from '@/firebase/database';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Fetches complete order details from the orders collection using docket ID
 * @param docketId - The unique identifier of the order/docket
 * @returns Promise containing the order data with its ID
 */
export const fetchDocketSlipData = async (docketId: string) => {
  try {
    // Get the order document reference
    const orderRef = doc(db, 'orders', docketId);

    // Fetch the order document
    const orderSnapshot = await getDoc(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error(`Order with docket ID ${docketId} not found`);
    }

    // Return the order data with its ID
    return {
      id: orderSnapshot.id,
      ...orderSnapshot.data(),
    };
  } catch (error) {
    console.error('Error fetching docket slip data:', error);
    throw error;
  }
};