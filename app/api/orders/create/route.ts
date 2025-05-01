import { createSessionClient } from '@/appwrite/appwrite.config';
import { cookies } from 'next/headers';
import { ID } from 'node-appwrite';

export async function POST(request: Request) {
  const sessionCookie = (await cookies()).get('session');

  try {
    const { databases } = await createSessionClient(sessionCookie?.value);
    
    // Parse the request body
    const documentData = await request.json();

    const { $id } = await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_COLLECTION_FLEET as string,
      ID.unique(),
      documentData
    );

    return Response.json({ $id });
  } catch (error) {
    console.error('ERROR', error);

    return Response.json('Access DENIED!', {
      status: 403,
    });
  }
}
