'use client';

import React from 'react';
import useOrders from '@/hooks/useOrders';
import useTrips from '@/hooks/useTrips';

const Playground = () => {
  const { activeTrips, unassignedTrips, pastTrips, isLoading, error } = useTrips();
  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : (
        <p>{JSON.stringify(unassignedTrips)}</p>
      )}
    </div>
  );
};

export default Playground;
