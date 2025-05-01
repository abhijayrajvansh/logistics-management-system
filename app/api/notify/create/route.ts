import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/appwrite/appwrite.config';
import { ID, Permission, Role } from 'node-appwrite';
import env from '@/constants';

const { databases } = await createAdminClient();

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { title, description, userId } = body;
  const action = body.action || null;
  const is_read = body.is_read || false;

  if (typeof title !== 'string') {
    return NextResponse.json({ error: 'Invalid title: must be a string' }, { status: 400 });
  }

  if (typeof description !== 'string') {
    return NextResponse.json({ error: 'Invalid description: must be a string' }, { status: 400 });
  }

  if (typeof userId !== 'string') {
    return NextResponse.json(
      { error: 'Invalid receivers: userId must be a string' },
      { status: 400 },
    );
  }

  try {
    const res = await databases.createDocument(
      env.DATABASE_ID,
      env.COLLECTION_NOTIFICATIONS,
      ID.unique(),
      {
        title,
        description,
        is_read,
        action,
        userId, 
      },
      [Permission.read(Role.user(userId)), Permission.update(Role.user(userId))],
    );

    return NextResponse.json({ success: true, notificationID: res.$id });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
