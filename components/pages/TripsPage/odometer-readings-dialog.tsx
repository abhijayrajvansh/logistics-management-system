'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TripOdometerReading } from '@/types';

interface OdometerReadingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  readings: TripOdometerReading | 'NA' | undefined;
}

export function OdometerReadingsDialog({ isOpen, onClose, readings }: OdometerReadingsDialogProps) {
  if (readings === 'NA' || readings === undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Odometer Readings</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
            No odometer readings available for this trip.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Odometer Readings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-bold">Start Reading</Label>
              <div className="mt-1 text-sm">{readings.startReading}</div>
            </div>
            <div>
              <Label className="font-bold">End Reading</Label>
              <div className="mt-1 text-sm">{readings.endReading}</div>
            </div>
          </div>

          {(readings.startPhotoUrl !== 'Not Provided' ||
            readings.endPhotoUrl !== 'Not Provided') && (
            <div className="grid grid-cols-2 gap-4">
              {readings.startPhotoUrl !== 'Not Provided' && (
                <div>
                  <Label className="font-bold mb-2 block">Start Photo</Label>
                  <img
                    src={readings.startPhotoUrl}
                    alt="Start reading"
                    className="rounded-lg w-full h-auto"
                  />
                </div>
              )}
              {readings.endPhotoUrl !== 'Not Provided' && (
                <div>
                  <Label className="font-bold mb-2 block">End Photo</Label>
                  <img
                    src={readings.endPhotoUrl}
                    alt="End reading"
                    className="rounded-lg w-full h-auto"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OdometerReadingsDialog;
