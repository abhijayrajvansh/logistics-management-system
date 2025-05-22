import { collection, setDoc, getDocs, doc } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { User } from '@/types';
import env from '@/constants';

const users: User[] = [
  {
    userId: 'leXz5GEc87YiysJ2gMYYwQJHboa2',
    email: 'managerl1' + env.USERID_EMAIL,
    password: 'managerl1',
    displayName: 'Manager L1',
    location: '111111',
    role: 'manager',
    createdAt: new Date(),
  },
];

async function seedUsers() {
  console.log('Starting to seed user data...');

  try {
    for (const user of users) {
      const userDocRef = doc(db, 'users', user.userId);
      await setDoc(userDocRef, user);
      console.log(`Added ${user.role} user: ${user.displayName} with ID: ${user.userId}`);
    }

    console.log(`Successfully seeded ${users.length} users to Firestore!`);
  } catch (error) {
    console.error('Error seeding user data:', error);
  }
}

async function runSeedFunctions() {
  await seedUsers();
}

runSeedFunctions().finally(() => {
  process.exit(0)
})
