import { createSessionClient } from '@/appwrite/appwrite.config';
import { cookies } from 'next/headers';

export async function POST() {
  const sessionCookie = (await cookies()).get('session');

  try {
    if (sessionCookie) {
      const { account } = await createSessionClient(sessionCookie.value);
      await account.deleteSession('current');
    }

    (await cookies()).delete('session');
    return Response.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
