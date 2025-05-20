'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FaRegEye } from 'react-icons/fa';
import Image from 'next/image';

interface ProofCellProps {
  imageUrl?: string;
}

export function ProofCell({ imageUrl }: ProofCellProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="text-center">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsDialogOpen(true)}
        disabled={!imageUrl}
      >
        <FaRegEye />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Proof Image</DialogTitle>
          </DialogHeader>
          {imageUrl ? (
            <div className="relative aspect-square w-full">
              <Image src={imageUrl} alt="Proof Image" className="object-contain" fill />
            </div>
          ) : (
            <div className="text-center py-8">No proof image available</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
