'use client'

import useCenters from '@/hooks/useCenters';
import React from 'react';

const Playground = () => {
  const { centers, error, isLoading } = useCenters();
  console.log('centers', centers);
  console.log('error', error);
  console.log('isLoading', isLoading);
  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }
  if (!centers || centers.length === 0) {
    return <div className="p-4">No centers found.</div>;
  }
  return (  
    <div className="p-4">
      <h1 className="text-2xl font-bold">Centers</h1>
      <ul>
        {centers.map((center) => (
          <li key={center.id} className="py-2">
            <strong>{center.name}</strong> - {center.location} ({center.pincode})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Playground;
