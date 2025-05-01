import { createAdminClient, createSessionClient } from '@/appwrite/appwrite.config';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    if (!userId || !secret) {
      console.error('Missing userId or secret in OAuth callback');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { account } = await createAdminClient();
    const session = await account.createSession(userId, secret);
    
    const { account: userAccount } = await createSessionClient(session.secret);
    const { labels } = await userAccount.get();
    
    const isAdmin = labels.includes('admin');
    if(!isAdmin) throw new Error ("non admin user tried to login with google")

    const response = NextResponse.redirect(new URL('/dashboard', request.url));

    response.cookies.set('session', session.secret, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: new Date(session.expire),
    });

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL(`/login?error=You are not authorized for admin access.`, request.url));
  }
}
