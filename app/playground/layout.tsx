import React from 'react';

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bred h-screen w-full flex flex-col items-center p-4">
      <div className='mb-5 text-3xl underline'>welcome to playground</div>
      {children}
    </div>
  );
};

export default layout;
