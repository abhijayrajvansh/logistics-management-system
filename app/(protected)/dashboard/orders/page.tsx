import { columns } from './columns';
import { DataTable } from './data-table';
import { SiteHeader } from '@/components/site-header';
import { db } from '@/firebase/database';
import { collection, getDocs } from 'firebase/firestore';
import { Order } from '@/types';
import { serializeData } from '@/lib/serializeData';

async function getData(): Promise<Order[]> {
  try {
    const ordersCollection = collection(db, 'orders');
    const snapshot = await getDocs(ordersCollection);

    const orders = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Serialize the Firestore data
      const serializedData = serializeData(data);

      return {
        id: doc.id,
        ...serializedData,
        // Ensure new fields are properly included in returned data
        price: serializedData.price || '',
        invoice: serializedData.invoice || '',
        status: serializedData.status || 'pending',
      } as Order;
    });

    return orders;
  } catch (error) {
    console.error('Error fetching orders: ', error);
    return [];
  }
}

export default async function AdminDashboard() {
  const data = await getData();
  return (
    <>
      <SiteHeader title="Orders" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1"></div>
            </div>
            <DataTable columns={columns} data={data} />
          </div>
        </div>
      </div>
    </>
  );
}
