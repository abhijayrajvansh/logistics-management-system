'use client';

import React, { createContext, useContext } from 'react';
import { User } from 'firebase/auth';

const AuthContext = createContext<{ user: User | null }>({
  user: null,
});

export const AuthProvider = ({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) => {
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
