import React from 'react';
import { redirect } from 'next/navigation';
import { AuthProvider } from '@/app/context/AuthContext';
// import { getCurrentUser } from '@/firebase/firebase.auth';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // const user = await getCurrentUser();
  // if (user) redirect('/dashboard');

  return (
    // <AuthProvider user={user}>
    { children }
    // </AuthProvider>
  );
}
