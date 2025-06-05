'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TruckAuditHistory } from '@/types';
import { formatFirestoreDate } from '@/lib/fomatTimestampToDate';

interface AuditHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  auditHistory: TruckAuditHistory[] | 'NA' | undefined;
}

const AuditHistoryDialog = ({ isOpen, onClose, auditHistory }: AuditHistoryDialogProps) => {
  if (!auditHistory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit History</DialogTitle>
          <DialogDescription>View all audit records for this truck.</DialogDescription>
        </DialogHeader>

        {auditHistory === 'NA' || !Array.isArray(auditHistory) || auditHistory.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No audit history available.</div>
        ) : (
          <div className="space-y-4">
            {auditHistory.map((record, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="font-medium">{formatFirestoreDate(record.date)}</div>
                <div className="text-sm text-muted-foreground">{record.audit_detail}</div>
                {record.photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {record.photos.map((photo, photoIndex) => (
                      <img
                        key={photoIndex}
                        src={photo}
                        alt={`Audit photo ${photoIndex + 1}`}
                        className="rounded-md w-full h-32 object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuditHistoryDialog;
