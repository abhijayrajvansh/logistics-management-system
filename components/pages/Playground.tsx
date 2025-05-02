'use client';

import React from 'react';
import useOrders from '@/hooks/useOrders';

const Playground = () => {
  const { orders, isLoading, error } = useOrders();
  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : (
        <p>{JSON.stringify(orders)}</p>
      )}
    </div>
  );
};

export default Playground;
