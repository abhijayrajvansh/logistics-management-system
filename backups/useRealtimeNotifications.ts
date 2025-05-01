//@ts-nocheck

import { Client } from 'appwrite';
import { useEffect, useState } from 'react';
import env from '@/constants';

const useRealtimeNotifications = ({
  userId,
  onNotification,
}: {
  userId: string;
  onNotification: (payload: any) => void;
}) => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Create separate client instance for realtime to avoid conflicts
    const client = new Client();

    try {
      // Configure the client
      client.setEndpoint(env.ENDPOINT).setProject(env.PROJECT_ID);

      console.log('Initializing Appwrite Realtime client:', {
        endpoint: env.ENDPOINT,
        projectId: env.PROJECT_ID,
        databaseId: env.DATABASE_ID,
        collectionId: env.COLLECTION_NOTIFICATIONS,
      });

      // Create a dedicated Realtime instance
      const clientRealtime = client;

      // Subscribe to changes in the notifications collection
      console.log('Setting up subscription for:', userId);

      const unsubscribe = clientRealtime.subscribe(
        [`databases.${env.DATABASE_ID}.collections.${env.COLLECTION_NOTIFICATIONS}.documents`],
        (response) => {
          console.log('\n\n\nRealtime event received:', response);

          // Check if this is a new document event
          if (
            response.events.includes(
              `databases.${env.DATABASE_ID}.collections.${env.COLLECTION_NOTIFICATIONS}.documents.*.create`,
            )
          ) {
            console.log('New notification created:', response.payload);

            // Verify this notification is for the current user
            if (response.payload.userId === userId) {
              console.log('Notification is for current user, processing...');
              onNotification(response.payload);
            } else {
              console.log('Notification is not for current user, ignoring.');
            }
          }
        },
      );

      console.log('Subscription established successfully');
      setConnected(true);

      // Clean up on unmount
      return () => {
        console.log('Cleaning up Appwrite Realtime subscription');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up Appwrite Realtime:', error);
      setConnected(false);
    }
  }, [userId, onNotification]);

  return { connected };
};

export default useRealtimeNotifications;
