'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function Playground() {
  const showToasts = () => {
    // Success toast (green)
    toast.success('Operation successful', {
      description: 'The action was completed successfully',
    });

    // Warning toast (yellow)
    setTimeout(() => {
      toast.warning('Warning message', {
        description: 'Please review this information',
      });
    }, 1000);

    // Error toast (red)
    setTimeout(() => {
      toast.error('Error occurred', {
        description: 'Something went wrong',
      });
    }, 2000); 
  };

  return (
    <div className="flex flex-col gap-4 items-start">
      <Button variant="outline" onClick={showToasts}>
        Show All Toasts
      </Button>
    </div>
  );
}
