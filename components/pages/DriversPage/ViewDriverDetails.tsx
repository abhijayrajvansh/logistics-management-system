import { Driver, DriverDocuments, EmergencyContact, ReferredBy } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { IconEye } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import useUsers from '@/hooks/useUsers';
import useTrucks from '@/hooks/useTrucks';
import { Timestamp } from 'firebase/firestore';

interface ViewDriverDetailsProps {
  driver: Driver;
}

function isDriverDocuments(docs: Driver['driverDocuments']): docs is DriverDocuments {
  return docs !== 'NA';
}

function isEmergencyContact(contact: Driver['emergencyContact']): contact is EmergencyContact {
  return contact !== 'NA';
}

function isReferredBy(referral: Driver['referredBy']): referral is ReferredBy {
  return referral !== 'NA';
}

const getFormattedDate = (date: Date | Timestamp | undefined) => {
  if (!date) return 'Not specified';
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString();
  }
  return date.toLocaleDateString();
};

export function ViewDriverDetails({ driver }: ViewDriverDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { users } = useUsers();
  const { trucks } = useTrucks();

  const getReferrerName = () => {
    if (!driver.referredBy || driver.referredBy === 'NA') return 'Self';
    const referredBy = driver.referredBy as ReferredBy;
    const referrer = users.find((user) => user.userId === referredBy.userId);
    return referrer?.displayName || 'Unknown';
  };

  const getTruckDetails = () => {
    if (!driver.assignedTruckId || driver.assignedTruckId === 'NA') return 'Not Assigned';
    const truck = trucks.find((t) => t.id === driver.assignedTruckId);
    return truck ? `${truck.regNumber} (${truck.axleConfig})` : 'Unknown';
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-primary p-1 rounded-lg cursor-pointer border border-primary text-primary hover:text-white"
        onClick={() => setIsOpen(true)}
      >
        <IconEye size={15} />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Driver Details</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Driver ID</label>
                  <p className="text-sm text-muted-foreground">{driver.driverId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-muted-foreground">{driver.driverName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <p className="text-sm text-muted-foreground">{driver.phoneNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div>
                    <Badge
                      className={
                        driver.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : driver.status === 'OnTrip'
                            ? 'bg-blue-100 text-blue-800'
                            : driver.status === 'OnLeave'
                              ? 'bg-yellow-100 text-yellow-800'
                              : driver.status === 'Suspended'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {driver.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Capabilities */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Capabilities</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Languages</label>
                  <div className="flex gap-2 mt-1">
                    {driver.languages.map((lang, idx) => (
                      <Badge key={idx} variant="outline">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Wheels Capability</label>
                  <div className="flex gap-2 mt-1">
                    {!driver.wheelsCapability || driver.wheelsCapability === 'NA' ? (
                      <span className="text-sm text-muted-foreground">Not Specified</span>
                    ) : (
                      driver.wheelsCapability?.map((wheel, idx) => (
                        <Badge key={idx} variant="outline">
                          {wheel} Wheeler
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Documents</h3>
              {!driver.driverDocuments || driver.driverDocuments === 'NA' ? (
                <p className="text-sm text-muted-foreground">No documents provided</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Aadhar Number</label>
                    <p className="text-sm text-muted-foreground">
                      {driver.driverDocuments.aadhar_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">License Number</label>
                    <p className="text-sm text-muted-foreground">
                      {driver.driverDocuments.license_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date of Birth</label>
                    <p className="text-sm text-muted-foreground">
                      {getFormattedDate(driver.driverDocuments.dob)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">License Expiry</label>
                    <p className="text-sm text-muted-foreground">
                      {getFormattedDate(driver.driverDocuments.license_expiry)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Document Status</label>
                    <Badge
                      className={
                        driver.driverDocuments.status === 'Verified'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {driver.driverDocuments.status}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Document Links */}
              {isDriverDocuments(driver.driverDocuments) && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {driver.driverDocuments.aadhar_front && (
                    <a
                      href={driver.driverDocuments.aadhar_front}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Aadhar Front
                    </a>
                  )}
                  {driver.driverDocuments.aadhar_back && (
                    <a
                      href={driver.driverDocuments.aadhar_back}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Aadhar Back
                    </a>
                  )}
                  {driver.driverDocuments.license && (
                    <a
                      href={driver.driverDocuments.license}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View License
                    </a>
                  )}
                  {driver.driverDocuments.medicalCertificate && (
                    <a
                      href={driver.driverDocuments.medicalCertificate}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Medical Certificate
                    </a>
                  )}
                  {driver.driverDocuments.dob_certificate && (
                    <a
                      href={driver.driverDocuments.dob_certificate}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View DOB Certificate
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Emergency Contact</h3>
              {!driver.emergencyContact || driver.emergencyContact === 'NA' ? (
                <p className="text-sm text-muted-foreground">No emergency contact provided</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-sm text-muted-foreground">{driver.emergencyContact.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <p className="text-sm text-muted-foreground">
                      {driver.emergencyContact.number}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Residency Address</label>
                    <p className="text-sm text-muted-foreground">
                      {driver.emergencyContact.residencyAddress}
                    </p>
                  </div>
                  {driver.emergencyContact.residencyProof && (
                    <div>
                      <label className="text-sm font-medium">Residency Proof</label>
                      <a
                        href={driver.emergencyContact.residencyProof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary hover:underline"
                      >
                        View Residency Proof
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Assignment & Referral */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Assignment & Referral</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Assigned Truck</label>
                  <p className="text-sm text-muted-foreground">{getTruckDetails()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Referred By</label>
                  <p className="text-sm text-muted-foreground">{getReferrerName()}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
