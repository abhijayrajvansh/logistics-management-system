import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Truck } from '@/types';
import { formatFirestoreDate } from '@/lib/fomatTimestampToDate';

interface ViewTruckDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  truck: Truck;
}

const ViewTruckDetails = ({ isOpen, onClose, truck }: ViewTruckDetailsProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Truck Details</DialogTitle>
          <DialogDescription>Complete information about truck {truck.regNumber}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Basic Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Registration Number:</span>
                  <p className="font-medium">{truck.regNumber}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Axle Configuration:</span>
                  <p className="font-medium">{truck.axleConfig}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Ownership:</span>
                  <p className="font-medium">{truck.ownership}</p>
                </div>
                {truck.ownership === 'OnLoan' && (
                  <div>
                    <span className="text-sm text-muted-foreground">EMI Amount:</span>
                    <p className="font-medium">₹ {truck.emiAmount}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Insurance & Permit Information */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Insurance & Permit Details</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Insurance Expiry:</span>
                  <p className="font-medium">{formatFirestoreDate(truck.insuranceExpiry)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">National Permit Expiry:</span>
                  <p className="font-medium">{formatFirestoreDate(truck.permitExpiry)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Odometer & Service Information */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Odometer & Service Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Current ODO:</span>
                  <p className="font-medium">{truck.odoCurrent.toLocaleString()} km</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">ODO at Last Service:</span>
                  <p className="font-medium">{truck.odoAtLastService.toLocaleString()} km</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">KM Since Last Service:</span>
                  <p className="font-medium">
                    {(truck.odoCurrent - truck.odoAtLastService).toLocaleString()} km
                  </p>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Documents</h3>
              {truck.truckDocuments ? (
                <div className="space-y-2">
                  {Object.entries(truck.truckDocuments).map(([key, value]) => {
                    if (key === 'multiple_state_permits' && Array.isArray(value)) {
                      return (
                        <div key={key} className="space-y-1">
                          <span className="text-sm text-muted-foreground capitalize block">
                            {key
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/_/g, ' ')
                              .trim()}
                            :
                          </span>
                          {value.map((url, index) => (
                            <div
                              key={`${key}-${index}`}
                              className="flex items-center justify-between pl-4"
                            >
                              <span className="text-sm text-muted-foreground">
                                Permit {index + 1}
                              </span>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                View Document
                              </a>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground capitalize">
                          {key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/_/g, ' ')
                            .trim()}
                          :
                        </span>
                        <a
                          href={value as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Document
                        </a>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No documents uploaded</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewTruckDetails;
