import { firebaseApp } from '@/firebase';
import { getFirestore, type Firestore } from 'firebase/firestore';
import env from '@/constants';

const initializeDatabase = (): Firestore => {
  try {
    const isProd = env.DATABASE_ENV === 'prod';
    console.log(`Initializing Firestore in ${isProd ? 'production' : 'development'} mode`);

    return isProd ? getFirestore(firebaseApp, 'production') : getFirestore(firebaseApp);
  } catch (error) {
    console.error('Failed to initialize Firestore:', error);
    throw new Error('Database initialization failed');
  }
};

export const db = initializeDatabase();
