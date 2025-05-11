import { createUserWithEmailAndPassword, updateProfile, UserInfo } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth } from '@/firebase/auth';
import { db } from '@/firebase/database';
import { User } from '@/types';

export interface NewUserPayload {
  email: string,
  password: string,
  displayName: string,
  role: string,
}

export async function createNewUser(newUser: NewUserPayload) {
  const { email, password, displayName, role } = newUser;
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName });

  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, {
    email,
    password,
    displayName,
    role,
    createdAt: new Date(),
  });

  return user;
}

export async function createUserWebhook(user: UserInfo) {
  const { email, displayName, uid } = user;

  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, {
    email,
    displayName,
    userId: uid,
    createdAt: new Date(),
  } as User);

  return user;
}
