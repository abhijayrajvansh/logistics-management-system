import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from '@/firebase/auth';

interface UseAuthReturn {
  login: {
    mutate: (data: { email: string; password: string }) => Promise<void>;
    isPending: boolean;
    error: Error | null;
  };
  googleAuth: {
    mutate: () => Promise<void>;
    isPending: boolean;
    error: Error | null;
  };
  logout: () => Promise<void>;
}

export function useHandleAuthentication(): UseAuthReturn {
  const [isLoginPending, setIsLoginPending] = useState(false);
  const [loginError, setLoginError] = useState<Error | null>(null);

  const [isGooglePending, setIsGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState<Error | null>(null);

  const handleEmailLogin = async (data: { email: string; password: string }) => {
    try {
      setIsLoginPending(true);
      setLoginError(null);
      await signInWithEmailAndPassword(auth, data.email, data.password);
    } catch (error) {
      setLoginError(error as Error);
      throw error;
    } finally {
      setIsLoginPending(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGooglePending(true);
      setGoogleError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      setGoogleError(error as Error);
      throw error;
    } finally {
      setIsGooglePending(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return {
    login: {
      mutate: handleEmailLogin,
      isPending: isLoginPending,
      error: loginError,
    },
    googleAuth: {
      mutate: handleGoogleLogin,
      isPending: isGooglePending,
      error: googleError,
    },
    logout: handleLogout,
  };
}
