import { createUserWebhook } from '@/firebase/auth';
import { User } from '@/types';

const userPayload: User = {
  userId: 'TJhvxsUYFklhUkhbs',
  email: '23421q3@jaizlogistics.com',
  password: 'password',
  displayName: 'mukesh',
  role: 'driver',
  createdAt: new Date(),
}

createUserWebhook(userPayload)
  .then((user) => {
    console.log('User created successfully:', user);
  })
  .catch((error) => {
    console.error('Error creating user:', error);
  })
  .finally(() => {
    process.exit(0);
  });
