import env from '@/constants';
import { db } from '@/firebase/database';
import { User } from '@/types';
import { doc, setDoc } from 'firebase/firestore';

const users: User[] = [
  {
    userId: 'YFs5BTBkUMYkg7iw7I8ovL3EMit2', // get user ID from the firebase auth user uid
    email: 'accountant' + env.USERID_EMAIL,
    password: 'accountant',
    displayName: 'accountant',
    location: 'NA',
    role: 'accountant',
    createdAt: new Date(),
    walletId: 'NA',
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
