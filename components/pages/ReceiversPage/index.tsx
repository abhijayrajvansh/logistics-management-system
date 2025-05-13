'use client';

import { useState } from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateReceiverForm } from './create-receiver';
import useReceivers from '@/hooks/useReceivers';

export default function ReceiversPage() {
  const { receivers, isLoading, error } = useReceivers();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleReceiverSuccess = () => {
    setDialogOpen(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <>
      <SiteHeader title="Receivers" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            {/* Header with Create Receiver Button */}
            <div className="flex justify-between px-4 lg:px-6">
              <div>
                <h1 className="text-3xl font-semibold">Manage Receivers</h1>
                <p className="text-[14px] text-black/70 mt-1">
                  Create, view and manage your receivers at ease.
                </p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm" className="rounded-lg">
                    <PlusIcon />
                    <span className="hidden font-semibold lg:inline">Create Receiver</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Receiver</DialogTitle>
                    <DialogDescription>
                      Fill out the form below to create a new receiver. Click submit when you're
                      done.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateReceiverForm onSuccess={handleReceiverSuccess} />
                </DialogContent>
              </Dialog>
            </div>

            {/* Receiver Data Table */}
            <DataTable columns={columns} data={receivers} />
          </div>
        </div>
      </div>
    </>
  );
}
