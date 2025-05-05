import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';

const page = () => {
  redirect('/dashboard');
  
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex items-center justify-center flex-col gap-3">
        <p className="font-medium text-3xl">home</p>
        <div className="flex items-center justify-center gap-3">
          <Link href={'/login'} className="text-blue-600 hover:underline">
            login
          </Link>
          <Link href={'/dashboard'} className="text-blue-600 hover:underline">
            dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default page;
