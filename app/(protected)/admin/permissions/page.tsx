'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useFeatureAccess } from '@/app/context/PermissionsContext';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const PermissionManager = dynamic(() => import('../PermissionManager'), { ssr: false });

export default function AdminPage() {
  const { userData, loading } = useAuth();
  const { can } = useFeatureAccess();

  useEffect(() => {
    if (!loading && userData) {
      // Check if user has admin panel access
      if (!can('FEATURE_ADMIN_PANEL')) {
        redirect('/dashboard');
      }
    }
  }, [userData, loading, can]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!userData || !can('FEATURE_ADMIN_PANEL')) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-background">
      <PermissionManager />
    </main>
  );
}
