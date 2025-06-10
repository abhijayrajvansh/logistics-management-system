'use client';

import { LoginForm } from '@/components/login-form';
import React from 'react';

const page = () => {
  // Get error from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const error = searchParams.get('error');

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm urlError={error} />
      </div>
    </div>
  );
};

export default page;
