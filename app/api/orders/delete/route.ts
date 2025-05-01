import { createSessionClient } from '@/appwrite/appwrite.config';
import { cookies } from 'next/headers';

export async function DELETE(request: Request) {
  const sessionCookie = (await cookies()).get('session');

  try {
    const { databases } = await createSessionClient(sessionCookie?.value);

    // Get the document ID from the URL
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return Response.json('Document ID is required', {
        status: 400,
      });
    }

    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_COLLECTION_FLEET as string,
      documentId,
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('ERROR', error);

    return Response.json('Access DENIED!', {
      status: 403,
    });
  }
}
