'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEvent, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { IoIosWarning } from 'react-icons/io';
import env from '@/constants';
import { IconLoader } from '@tabler/icons-react';
// import { useAuth } from '@/hooks/useAuth';

interface FormData {
  email: string;
  password: string;
}

export function LoginForm({
  className,
  urlError,
  ...props
}: React.ComponentProps<'div'> & { urlError?: string | null }) {

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  // const { login, googleAuth } = useAuth();
  const login = {
    isPending: false,
  };
  

  const convertUserIDtoEmail = (userID: string) => {
    const convertedEmail = userID + env.USERID_EMAIL;
    return convertedEmail;
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailAddress = convertUserIDtoEmail(formData.email);
    console.log({ ...formData, email: emailAddress });
  };

  const handleGoogleAuth = () => {
    // googleAuth.mutate();
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-3xl mb-3">Login</CardTitle>

          <CardDescription className="text-black text-base font-medium">
            Enter your credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label className="text-base" htmlFor="email">
                  User ID
                </Label>
                <Input
                  className="py-5 hover:border-black transition-all ease-in-out "
                  id="email"
                  name="email"
                  type="string"
                  placeholder="123456789"
                  required
                  disabled={login.isPending}
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label className="text-base" htmlFor="password">
                    Password
                  </Label>
                </div>
                <Input
                  className="py-5 border hover:border-black transition-all ease-in-out"
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={login.isPending}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>

              {/* {(login.error || urlError) && (
                <div className="text-red-600 bg-red-100 px-2 py-1 rounded text-sm border border-red-300">
                  {env.NODE_ENV === 'dev' ? (
                    (login.error as Error)?.message || urlError
                  ) : (
                    <p className="flex items-center gap-2">
                      <IoIosWarning size={21} />
                      {urlError || 'Invalid login credentials. Try again!'}
                    </p>
                  )}
                </div>
              )} */}

              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full text-base py-5 mb-1 bg-blue-600 hover:border-black cursor-pointer"
                  disabled={login.isPending}
                >
                  {login.isPending && <IconLoader className="animate-spin"/>}
                  {login.isPending ? 'Logging in...' : 'Login'}
                </Button>

                <div className="flex items-center justify-center gap-3">
                  <div className="border-t w-full"></div>
                  <p className="text-black/50 font-light text-sm">or</p>
                  <div className="border-t w-full"></div>
                </div>
              </div>
            </div>
          </form>
          <Button
            disabled={login.isPending}
            onClick={handleGoogleAuth}
            variant="outline"
            size={'default'}
            className="w-full py-5 hover:border-black/40 transition-all mt-3 ease-in-out text-[15px] cursor-pointer"
          >
            <FcGoogle size={18} />
            Log in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
