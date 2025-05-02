import env from '@/constants';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
  measurementId: env.firebase.measurementId,
  databaseURL: env.firebase.databaseURL,
};

export const firebaseApp = initializeApp(firebaseConfig);