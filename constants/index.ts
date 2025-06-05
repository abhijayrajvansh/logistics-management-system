import { FirebaseConfig } from '@/types';
import 'dotenv/config';

const firebase = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID as string,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL as string,
}

const env = {
  // authentication level email abstraction for userID
  USERID_EMAIL: '@jaizlogistics.com',

  // console env
  DATABASE_ENV: process.env.NEXT_PUBLIC_DATABASE_ENV as string,

  // firebase config
  firebase: firebase as FirebaseConfig,
};

export default env;