import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { User } from '@/types';

export function useUsers(userIdFilter?: string, roleFilter?: string) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);

    try {
      // Set up real-time listener for users collection
      const usersRef = collection(db, 'users');

      // Build query with filters
      let queryConstraints = [];

      if (userIdFilter) {
        queryConstraints.push(where('userId', '==', userIdFilter));
      }

      if (roleFilter) {
        queryConstraints.push(where('role', '==', roleFilter));
      }

      const filteredUsersRef =
        queryConstraints.length > 0 ? query(usersRef, ...queryConstraints) : usersRef;

      const unsubscribe = onSnapshot(
        filteredUsersRef,
        (snapshot) => {
          const fetchedUsers = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              location: data.location || 'NA',
              ...data,
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
  }, [userIdFilter, roleFilter]); // Added roleFilter to dependencies

  return {
    users,
    isLoading,
    error,
  };
}

export default useUsers;
