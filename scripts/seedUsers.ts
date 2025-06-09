import env from '@/constants';
import { db } from '@/firebase/database';
import { User } from '@/types';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const seedTypes = ['add', 'update'] as const;

const users: User[] = [
  {
    userId: 'MK5OwprsXAVghVv1K1JVX1gZAHw2', // get user ID from the firebase auth user uid
    email: 'yash' + env.USERID_EMAIL,
    password: 'password',
    displayName: 'Yash Khattar',
    location: '123456',
    role: 'admin',
    createdAt: new Date(),
    walletId: 'NA',
  },
];

async function seeUsers(type: 'add' | 'update' = 'add') {
  console.log(`Starting to ${type} user data...\n`);

  try {
    for (const user of users) {
      const userDocRef = doc(db, 'users', user.userId);

      if (type === 'add') {
        // Check if user already exists only in add mode
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          console.log(`⚠️  Skipping user ${user.displayName} with ID: ${user.userId} - already exists`);
          continue;
        }
      }

      await setDoc(userDocRef, user);
      console.log(
        `${type === 'add' ? 'Added' : 'Updated'} ${user.role} user: ${user.displayName} with ID: ${user.userId}`,
      );
    }

    console.log(`\nSuccessfully completed adding users to database!`);
  } catch (error) {
    console.error('Error seeding user data:', error);
  }
}

async function runSeedFunctions() {
  await seeUsers(); // pass update if you want to update existing users
}

runSeedFunctions().finally(() => {
  process.exit(0);
});
