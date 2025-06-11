'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEvent, useState, useCallback } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { IoIosWarning } from 'react-icons/io';
import { IconLoader } from '@tabler/icons-react';
import { useHandleAuthentication } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import env from '@/constants';

interface FormData {
  email: string;
  password: string;
}

export function LoginForm({
  className,
  urlError,
  ...props
}: React.ComponentProps<'div'> & { urlError?: string | null }) {
  const router = useRouter();
  const { login, googleAuth } = useHandleAuthentication();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, email: e.target.value }));
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, password: e.target.value }));
  }, []);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login.mutate({ email: formData.email + env.USERID_EMAIL, password: formData.password });
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await googleAuth.mutate();
      router.push('/dashboard');
    } catch (error) {
      console.error('Google login failed:', error);
    }
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
                  className="py-5 hover:border-black transition-all ease-in-out"
                  id="email"
                  name="email"
                  placeholder="123456"
                  required
                  disabled={login.isPending}
                  value={formData.email}
                  onChange={handleEmailChange}
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
                  onChange={handlePasswordChange}
                />
              </div>

              {(login.error || urlError) && (
                <div className="text-red-600 bg-red-100 px-2 py-1 rounded text-sm border border-red-300">
                  <p className="flex items-center gap-2">
                    <IoIosWarning size={21} />
                    {urlError || 'Invalid login credentials. Try again!'}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full text-base py-5 mb-1 bg-blue-600 hover:border-black cursor-pointer"
                  disabled={login.isPending}
                >
                  {login.isPending && <IconLoader className="animate-spin" />}
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
            disabled={googleAuth.isPending}
            onClick={handleGoogleAuth}
            variant="outline"
            size={'default'}
            className="w-full py-5 hover:border-black/40 transition-all mt-3 ease-in-out text-[15px] cursor-pointer"
          >
            {googleAuth.isPending && <IconLoader className="animate-spin mr-2" />}
            <FcGoogle size={18} className="mr-2" />
            {googleAuth.isPending ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
