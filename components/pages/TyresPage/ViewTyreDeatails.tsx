import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tyre } from '@/types';
import { formatFirestoreDate } from '@/lib/fomatTimestampToDate';

interface ViewTyreDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  tyre: Tyre;
}

const ViewTyreDetails = ({ isOpen, onClose, tyre }: ViewTyreDetailsProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tyre Details</DialogTitle>
          <DialogDescription>
            Complete information about {tyre.company} {tyre.size} tyre
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Basic Information</h3>
              <div className="space-y-2">
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
                  <p className="font-medium">{tyre.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Purchase Date:</span>
                  <p className="font-medium">{formatFirestoreDate(tyre.purchaseDate)}</p>
                </div>
              </div>
            </div>

            {/* Current Position Information */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Current Position</h3>
              <div className="space-y-2">
                {tyre.currentPosition && tyre.currentPosition !== 'NA' ? (
                  <>
                    <div>
                      <span className="text-sm text-muted-foreground">Truck Number:</span>
                      <p className="font-medium">{tyre.currentPosition.truckNumber}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Truck Type:</span>
                      <p className="font-medium">
                        {tyre.currentPosition.truckType || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Position:</span>
                      <p className="font-medium">{tyre.currentPosition.position}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Tyre is not currently mounted on any truck
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* History Information */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">History</h3>
              {tyre.history &&
              tyre.history !== 'NA' &&
              Array.isArray(tyre.history) &&
              tyre.history.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {tyre.history.map((entry, index) => (
                    <div key={index} className="border rounded-md p-3 space-y-2">
                      {entry.type === 'onTrip' ? (
                        <>
                          <div className="font-medium text-sm">Trip History</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Truck:</span>
                              <p>{entry.truckNumber}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Position:</span>
                              <p>{entry.mount.position}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Mount Date:</span>
                              <p>{formatFirestoreDate(entry.mount.timestamp)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Mount Odometer:</span>
                              <p>{entry.mount.odometer.toLocaleString()} km</p>
                            </div>
                            {entry.unmount && (
                              <>
                                <div>
                                  <span className="text-muted-foreground">Unmount Date:</span>
                                  <p>{formatFirestoreDate(entry.unmount.timestamp)}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Unmount Odometer:</span>
                                  <p>{entry.unmount.odometer.toLocaleString()} km</p>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Service History */}
                          {entry.service &&
                            entry.service !== 'NA' &&
                            Array.isArray(entry.service) &&
                            entry.service.length > 0 && (
                              <div className="mt-2">
                                <div className="text-sm font-medium mb-1">Service Records:</div>
                                <div className="space-y-1">
                                  {entry.service.map((service, serviceIndex) => (
                                    <div
                                      key={serviceIndex}
                                      className="text-xs bg-gray-50 p-2 rounded"
                                    >
                                      <div className="flex justify-between">
                                        <span>{service.serviceType}</span>
                                        <span>₹{service.amount}</span>
                                      </div>
                                      <div className="text-muted-foreground">
                                        {formatFirestoreDate(service.timestamp)}
                                      </div>
                                      {service.notes && (
                                        <div className="text-muted-foreground mt-1">
                                          {service.notes}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </>
                      ) : entry.type === 'retrading' ? (
                        <>
                          <div className="font-medium text-sm">Retrading History</div>
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="text-muted-foreground">Vendor:</span>
                              <p>{entry.vendor}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Retrading Date:</span>
                              <p>{formatFirestoreDate(entry.retradingDate)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ready to Use Date:</span>
                              <p>{formatFirestoreDate(entry.readyToUseDate)}</p>
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No history available</p>
              )}
            </div>

            {/* Timestamps */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Timestamps</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Created At:</span>
                  <p className="font-medium">{formatFirestoreDate(tyre.createdAt)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Updated At:</span>
                  <p className="font-medium">{formatFirestoreDate(tyre.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewTyreDetails;
