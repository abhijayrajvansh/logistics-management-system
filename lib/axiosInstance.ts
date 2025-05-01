import { cookies } from 'next/headers';
import axios from 'axios';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL as string;

const axiosInstance = async (
  { api, method }: { api: string; method: string },
  data?: Record<string, unknown>,
) => {
  const sessionCookie = (await cookies()).get('session');

  const headers = {
    Cookie: `session=${sessionCookie?.value}`,
  };

  return axios({
    url: SERVER_URL + api,
    method,
    headers,
    data,
  });
};

export default axiosInstance;
