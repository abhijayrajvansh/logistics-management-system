import { createAdminClient } from '@/appwrite/appwrite.config';
import { Query } from 'appwrite';
import { NextRequest } from 'next/server';
import env from '@/constants';

const formatEmail = (email: string) => {
  if (email.endsWith(env.USERID_EMAIL)) {
    return email.replace(env.USERID_EMAIL, '');
  }
  return email;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = parseInt(searchParams.get('limit') || '100');

  const { users } = await createAdminClient();

  // First get total count of all users with roles
  const allUsers = await users.list([Query.orderDesc('$createdAt')]);
  const totalFilteredUsers = allUsers.users.filter(
    (user) => user.labels && user.labels.length > 0,
  ).length;

  // Then get paginated results with sorting
  const response = await users.list([
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
    Query.offset(offset),
  ]);

  const simplifiedUsers = response.users
    .filter((user) => user.labels && user.labels.length > 0)
    .map((user) => ({
      id: user.$id,
      name: user.name,
      email: formatEmail(user.email),
      roles: user.labels,
      createdAt: user.$createdAt, // Include creation date in response
    }));

  return Response.json({
    total: totalFilteredUsers,
    users: simplifiedUsers,
    offset,
    limit,
    hasMore: offset + limit < totalFilteredUsers,
  });
}
