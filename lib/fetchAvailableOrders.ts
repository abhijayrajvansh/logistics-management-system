import { db } from "@/firebase/database";
import { Order } from "@/types";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function fetchAvailableOrders(): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('status', '==', 'Ready To Transport'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          order_id: doc.id,
          ...doc.data(),
        }) as Order,
    );
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}
