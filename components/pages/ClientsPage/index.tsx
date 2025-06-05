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
import { CreateClientForm } from './create-client';
import useClients from '@/hooks/useClients';

export default function ClientsPage() {
  const { clients, isLoading, error } = useClients();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClientSuccess = () => {
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
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
          {/* Header with Create Client Button */}
          <div className="flex justify-between px-4 lg:px-6">
            <div>
              <h1 className="text-3xl font-semibold">Manage Clients and Rate Cards</h1>
              <p className="text-[14px] text-black/70 mt-1">
                Create, view and manage your clients at ease.
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="rounded-lg">
                  <PlusIcon />
                  <span className="hidden font-semibold lg:inline">Create Client</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Client</DialogTitle>
                  <DialogDescription>
                    Fill out the form below to create a new client. Click submit when you're done.
                  </DialogDescription>
                </DialogHeader>
                <CreateClientForm onSuccess={handleClientSuccess} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Client Data Table */}
          <div className="px-6">
            <DataTable columns={columns} data={clients} />
          </div>
        </div>
      </div>
    </>
  );
}
