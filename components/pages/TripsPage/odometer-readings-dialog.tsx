'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TripOdometerReading } from '@/types';
import { BsSpeedometer } from 'react-icons/bs';

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
              <div className="mt-1 text-sm">
                {readings.startReading === undefined ? 'Not Provided' : readings.startReading}
              </div>
            </div>
            <div>
              <Label className="font-bold">End Reading</Label>
              <div className="mt-1 text-sm">
                {readings.endReading === undefined ? 'Not Provided' : readings.endReading}
              </div>
            </div>
          </div>

          {(readings.startPhotoUrl !== 'Not Provided' ||
            readings.endPhotoUrl !== 'Not Provided') && (
            <div className="grid grid-cols-2 gap-4">
              {readings.startPhotoUrl !== 'Not Provided' && (
                <div>
                  <Label className="font-bold mb-2 block">Start Photo</Label>
                  {readings.startPhotoUrl === undefined ? (
                    <div className='h-full flex items-center justify-center'>
                      <div className='flex flex-col items-center justify-center gap-3'>
                        <BsSpeedometer size={30} className='text-gray-500'/>
                      <p className='text-gray-500'>Not Provided</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={readings.startPhotoUrl}
                        alt="Start reading"
                        className="rounded-lg w-full h-auto"
                      />
                    </>
                  )}
                </div>
              )}
              {readings.endPhotoUrl !== 'Not Provided' && (
                <div>
                  <Label className="font-bold mb-2 block">End Photo</Label>
                  {readings.endPhotoUrl === undefined ? (
                    <div className='h-full flex items-center justify-center'>
                      <div className='flex flex-col items-center justify-center gap-3'>
                        <BsSpeedometer size={30} className='text-gray-500'/>
                      <p className='text-gray-500'>Not Provided</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={readings.endPhotoUrl}
                        alt="Start reading"
                        className="rounded-lg w-full h-auto"
                      />
                    </>
                  )}
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
