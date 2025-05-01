import 'dotenv/config';
import { createAdminClient } from '@/appwrite/appwrite.config';

const email = 'abhijay@uptut.com';
const password = 'password123';

(async () => {
  try {
    const { account } = await createAdminClient();
    const { secret: sessionToken } = await account.createEmailPasswordSession(email, password);
    console.log({ sessionToken });
  } 
  catch (error) {
    console.log({
      session: false,
      message: 'bad authentication',
    });
  }
})();
