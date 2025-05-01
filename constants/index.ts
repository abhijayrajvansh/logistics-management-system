import { FirebaseConfig } from '@/types';
import 'dotenv/config';

const firebase: FirebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY as string,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.FIREBASE_APP_ID as string,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID as string,
  databaseURL: process.env.FIREBASE_DATABASE_URL as string,
}

const env = {
  // manager level email abstraction for userID
  USERID_EMAIL: 'tms@uptut.com',

  // firebase config
  firebase,

  // console env
  NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV as string,
};

export default env;