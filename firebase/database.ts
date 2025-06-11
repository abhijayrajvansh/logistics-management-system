import { firebaseApp } from '@/firebase';
import { getFirestore, type Firestore } from 'firebase/firestore';
import env from '@/constants';

const initializeDatabase = (): Firestore => {
  try {
    const isProd = env.DATABASE_ENV === 'prod';
    console.log(`\x1b[1m\x1b[32m ✓\x1b[0m Initializing database: ${isProd ? 'production' : 'development'}`);

    return isProd ? getFirestore(firebaseApp, 'production') : getFirestore(firebaseApp);
  } catch (error) {
    console.error('Failed to initialize Firestore:', error);
    throw new Error('Database initialization failed');
  }
};

export const db = initializeDatabase();
