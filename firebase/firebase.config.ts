import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import env from '@/constants';

const firebaseConfig = {
  apiKey: "AIzaSyD-VzRFvk72EDkLMT8Gsjzoz9fZoze7P_s",
  authDomain: "jaiz-tms.firebaseapp.com",
  projectId: "jaiz-tms",
  storageBucket: "jaiz-tms.firebasestorage.app",
  messagingSenderId: "762826177463",
  appId: "1:762826177463:web:cd253c6739f91ddde88632",
  measurementId: "G-3ZLYC8L7F1",
  databaseURL: "https://jaiz-tms-default-rtdb.firebaseio.com",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);