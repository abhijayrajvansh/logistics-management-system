'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'border-2 shadow-lg',
          title: 'text-zinc-900 font-medium dark:text-zinc-50',
          description: 'text-zinc-800 dark:text-zinc-400',
          success:
            'bg-green-50 border-green-500 text-green-800 dark:bg-green-500/80 dark:border-green-400 dark:text-green-50',
          warning:
            'bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-500/80 dark:border-yellow-400 dark:text-yellow-50',
          error:
            'bg-red-50 border-red-500 text-red-800 dark:bg-red-500/80 dark:border-red-400 dark:text-red-50',
          info: 'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-500/80 dark:border-blue-400 dark:text-blue-50',
        },
        duration: 4000,
      }}
      {...props}
    />
  );
};

export { Toaster };
