import axiosInstance from '@/lib/axiosInstance';
import auth from '@/auth';
import { hasPermission } from '@/appwrite/appwrite.permission';

export default async function Page() {
  let orders;

  try {
    const response = await axiosInstance({
      api: 'orders',
      method: 'get',
    });

    orders = response.data.orders;
  } catch (error) {
    console.error('Error', error);
  }

  const user = await auth.getUser();
  const collectionID = process.env.NEXT_PUBLIC_COLLECTION_FLEET as string;

  const canReadOrders = await hasPermission(user.$id, collectionID, 'read')
  const canCreateOrders = await hasPermission(user.$id, collectionID, 'create')
  const canUpdateOrders = await hasPermission(user.$id, collectionID, 'update')
  const canDeleteOrders = await hasPermission(user.$id, collectionID, 'delete')

  const permissions = {
    canReadOrders,
    canCreateOrders,
    canUpdateOrders,
    canDeleteOrders
  }

  console.log({permissions})

  
  return (
    <main className="container mx-auto max-w-[800px]">
      dashboard page
    </main>
  );
}
