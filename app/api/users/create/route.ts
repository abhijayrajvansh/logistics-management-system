import { createAdminClient } from '@/appwrite/appwrite.config';
import { NextRequest, NextResponse } from 'next/server';
import env from '@/constants';
import { ID } from 'node-appwrite';

export async function POST(request: NextRequest) {
  try {
    const { userId, username, password, roles } = await request.json();

    // Validate required fields
    if (!userId || !username || !password || !roles) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, username, password, or roles' },
        { status: 400 },
      );
    }

    // Validate types
    if (
      typeof userId !== 'number' ||
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !Array.isArray(roles)
    ) {
      return NextResponse.json({ error: 'Invalid data types for fields' }, { status: 400 });
    }

    // Validate userId has at least 6 digits
    if (userId < 100000) {
      return NextResponse.json(
        { error: 'User ID must be at least 6 digits long' },
        { status: 400 },
      );
    }

    const { users } = await createAdminClient();

    const newUser = await users.create(
      ID.unique(),
      userId.toString() + env.USERID_EMAIL,
      undefined,
      password,
      username,
    );

    users.updateLabels(newUser.$id, roles);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
