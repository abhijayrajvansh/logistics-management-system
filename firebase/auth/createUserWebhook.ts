import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth } from '@/firebase/auth';
import { db } from '@/firebase/database';
import { User } from '@/types';

export async function createUserWebhook(newUser: User) {
  const { email, password, displayName, role, userId } = newUser;

  // Check if the user already exists
  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    throw new Error('User already exists');
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName });

  await setDoc(userDocRef, {
    userId,
    email,
    password,
    displayName,
    role,
    createdAt: new Date(),
  });

  return user;
}
