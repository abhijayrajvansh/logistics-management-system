import { createAdminClient } from '@/appwrite/appwrite.config';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 });
    }

    const { users } = await createAdminClient();

    await users.delete(userId);

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
