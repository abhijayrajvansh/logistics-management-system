import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/appwrite/appwrite.config';
import env from '@/constants';

export async function POST(request: NextRequest) {
  const { notificationID } = await request.json();

  if (!notificationID) {
    return new Response('notificationID is required', { status: 400 });
  }

  try {
    const { databases } = await createAdminClient();

    await databases.updateDocument(env.DATABASE_ID, env.COLLECTION_NOTIFICATIONS, notificationID, {
      is_read: true,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
