'use client';

import React, { useState } from 'react';
import { FaCircle } from 'react-icons/fa6';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatFirestoreDate } from '@/lib/fomatTimestampToDate';
import { Tyre } from '@/types';

interface TyreIconCellProps {
  tyre: Tyre;
}

const TyreIconCell: React.FC<TyreIconCellProps> = ({ tyre }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <button
        className="hover:bg-primary p-1 rounded-lg cursor-pointer border border-primary text-primary hover:text-white flex items-center justify-center gap-1"
        onClick={() => setIsDialogOpen(true)}
        title="View tyre details"
      >
        <FaCircle size={15} />
      </button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tyre Details</DialogTitle>
            <DialogDescription>Complete information about this tyre</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Company:</span>
                <p className="font-medium">{tyre.company}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Size:</span>
                <p className="font-medium">{tyre.size}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Status:</span>
                <p className="font-medium">{tyre.status}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Purchase Date:</span>
                <p className="font-medium">{formatFirestoreDate(tyre.purchaseDate)}</p>
              </div>
            </div>

            {tyre.currentPosition && tyre.currentPosition !== 'NA' && (
              <div>
                <span className="text-sm text-muted-foreground">Current Position:</span>
                <p className="font-medium">
                  {tyre.currentPosition.truckNumber} - {tyre.currentPosition.position}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TyreIconCell;
