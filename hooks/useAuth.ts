import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from '@/firebase/auth';
import { db } from '@/firebase/database';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { User } from '@/types';

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

  const checkUserExistsInFirestore = async (email: string): Promise<boolean> => {
    // Query Firestore to find a user with the given email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  const handleEmailLogin = async (data: { email: string; password: string }) => {
    try {
      setIsLoginPending(true);
      setLoginError(null);

      // First check if user exists in Firestore
      const userExists = await checkUserExistsInFirestore(data.email);

      if (!userExists) {
        // If user doesn't exist in Firestore, throw error
        throw new Error('Invalid login credentials. Please try again.');
      }

      // If user exists in Firestore, attempt Firebase Auth
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
      const result = await signInWithPopup(auth, provider);

      // Check if the Google user exists in Firestore
      const userExists = await checkUserExistsInFirestore(result.user.email!);

      if (!userExists) {
        // If user doesn't exist in Firestore, sign out and throw error
        await signOut(auth);
        throw new Error(
          'This Google account is not authorized. Please contact your admin.',
        );
      }
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
