import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { User } from '@/types';

export function useUsers(userIdFilter?: string) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);

    try {
      // Set up real-time listener for users collection
      const usersRef = collection(db, 'users');

      // filter users based on userId
      const filteredUsersRef = userIdFilter 
        ? query(usersRef, where('userId', '==', userIdFilter))
        : usersRef;
      
      const unsubscribe = onSnapshot(
        filteredUsersRef,
        (snapshot) => {
          const fetchedUsers = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              userId: doc.id,
              email: data.email || '',
              password: data.password || '',
              displayName: data.displayName || '',
              location: data.location || '',
              role: data.role || 'driver',
              createdAt: data.createdAt?.toDate() || new Date(),
            } as User;
          });

          setUsers(fetchedUsers);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching users:', err);
          setError(err as Error);
          setIsLoading(false);
        },
      );

      // Clean up listener on unmount
      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up users listener:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  return {
    users,
    isLoading,
    error,
  };
}

export default useUsers;
