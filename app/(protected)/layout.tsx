import React from 'react';
import { redirect } from 'next/navigation';
import { AuthProvider } from '@/app/context/AuthContext';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
// import { getCurrentUser } from '@/firebase/firebase.auth';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // const user = await getCurrentUser();
  // if (!user) redirect('/login');

  return (
    // <AuthProvider user={user}>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    // </AuthProvider>
  );
}
