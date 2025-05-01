import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/appwrite/appwrite.config';
import { Query } from 'node-appwrite';
import env from '@/constants';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const { databases } = await createAdminClient();

    const notifications = await databases.listDocuments(
      env.DATABASE_ID,
      env.COLLECTION_NOTIFICATIONS,
      [Query.equal('userId', userId), Query.orderDesc('$createdAt'), Query.limit(50)],
    );

    // Transform the response to include only required fields
    const transformedResponse = {
      total: notifications.total,
      documents: notifications.documents.map((doc) => ({
        id: doc.$id,
        title: doc.title,
        description: doc.description,
        action: doc.action,
        is_read: doc.is_read,
        userId: doc.userId,
        createdAt: doc.$createdAt,
      })),
    };

    return NextResponse.json(transformedResponse);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
