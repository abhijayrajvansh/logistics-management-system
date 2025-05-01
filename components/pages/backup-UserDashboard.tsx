'use client';

import { Button } from '@/components/ui/button';
import { useLogout } from '@/hooks/useAuth';
import React from 'react';
import { useAuth } from '@/app/context/AuthContext';

const Dashboard = () => {
  const logout = useLogout();
  const { user } = useAuth();

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 justify-center">
        <div className="flex flex-col items-start">
          <p className='text-2xl font-medium mb-2'>User deatils</p>
          <p>userID: {user?.$id}</p>
          <p>name: {user?.name}</p>
          <p>email: {user?.email}</p>
          <p>roles: {user?.labels}</p>
        </div>
        <Button disabled={logout.isPending}
          onClick={() => logout.mutate()}
          variant={'destructive'}
          className="cursor-pointer hover:bg-red-500 mt-3"
        >
          logout
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
