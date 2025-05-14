'use client'

import useCenters from '@/hooks/useCenters';
import useUsers from '@/hooks/useUsers';
import React from 'react';

const Playground = () => {
  const { users, error, isLoading } = useUsers('leXz5GEc87YiysJ2gMYYwQJHboa2');
  console.log('centers', users);
  console.log('error', error);
  console.log('isLoading', isLoading);
  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }
  if (!users || users.length === 0) {
    return <div className="p-4">No users found.</div>;
  }
  return (  
    <div className="p-4">
      <h1 className="text-2xl font-bold">Centers</h1>
      <ul>
        {users.map((user) => (
          <li key={user.userId} className="py-2">
            <strong>{user.displayName}</strong> - ({user.role}, {user.location} , {user.email}, {user.userId})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Playground;
