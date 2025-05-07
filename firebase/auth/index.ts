import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/firebase';
import { createUserWebhook } from './createUserWebhook';

export const auth = getAuth(firebaseApp);
export { createUserWebhook };