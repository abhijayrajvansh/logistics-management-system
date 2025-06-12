'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Tyre } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UpdateTyreFormProps {
  tyreId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type TyreHistoryEntry = {
  type: 'onTrip' | 'retrading';
  // onTrip specific fields
  truckNumber?: string;
  truckType?: string;
  mountTimestamp?: string;
  mountOdometer?: number;
  mountPosition?: string;
  unmountTimestamp?: string;
  unmountOdometer?: number;
  serviceType?: string;
  serviceAmount?: number;
  serviceTimestamp?: string;
  serviceNotes?: string;
  // retrading specific fields
  retradingDate?: string;
  vendor?: string;
  readyToUseDate?: string;
};

export function UpdateTyreForm({ tyreId, onSuccess, onCancel }: UpdateTyreFormProps) {
  const [formData, setFormData] = useState({
    company: '',
    size: '',
    status: '',
    purchaseDate: '',
    currentTruckNumber: '',
    currentTruckType: '',
    currentPosition: '',
  });

  const [historyEntries, setHistoryEntries] = useState<TyreHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch tyre data on component mount
  useEffect(() => {
    const fetchTyreData = async () => {
      try {
        const tyreDoc = await getDoc(doc(db, 'tyres', tyreId));
        if (tyreDoc.exists()) {
          const data = tyreDoc.data() as Tyre;

          // Format purchase date for input field
          let formattedPurchaseDate = '';
          if (data.purchaseDate) {
            if ('toDate' in data.purchaseDate && typeof data.purchaseDate.toDate === 'function') {
              formattedPurchaseDate = data.purchaseDate.toDate().toISOString().split('T')[0];
            } else if (data.purchaseDate instanceof Date) {
              formattedPurchaseDate = data.purchaseDate.toISOString().split('T')[0];
            } else if (typeof data.purchaseDate === 'string') {
              formattedPurchaseDate = data.purchaseDate;
            }
          }

          setFormData({
            company: data.company || '',
            size: data.size || '',
            status: data.status || 'READY_TO_USE',
            purchaseDate: formattedPurchaseDate,
            currentTruckNumber:
              data.currentPosition && data.currentPosition !== 'NA'
                ? data.currentPosition.truckNumber || ''
                : '',
            currentTruckType:
              data.currentPosition && data.currentPosition !== 'NA'
                ? data.currentPosition.truckType || ''
                : '',
            currentPosition:
              data.currentPosition && data.currentPosition !== 'NA'
                ? data.currentPosition.position || ''
                : '',
          });

          // Parse existing history data
          if (data.history && data.history !== 'NA' && Array.isArray(data.history)) {
            const parsedHistory: TyreHistoryEntry[] = data.history.map((historyItem: any) => {
              if (historyItem.type === 'onTrip') {
                const entry: TyreHistoryEntry = {
                  type: 'onTrip',
                  truckNumber: historyItem.truckNumber || '',
                  truckType: historyItem.truckType || '',
                  mountTimestamp: historyItem.mount?.timestamp
                    ? new Date(historyItem.mount.timestamp.seconds * 1000)
                        .toISOString()
                        .slice(0, 16)
                    : '',
                  mountOdometer: historyItem.mount?.odometer || 0,
                  mountPosition: historyItem.mount?.position || '',
                  unmountTimestamp: historyItem.unmount?.timestamp
                    ? new Date(historyItem.unmount.timestamp.seconds * 1000)
                        .toISOString()
                        .slice(0, 16)
                    : '',
                  unmountOdometer: historyItem.unmount?.odometer || 0,
                };

                // Add service data if it exists
                if (
                  historyItem.service &&
                  Array.isArray(historyItem.service) &&
                  historyItem.service.length > 0
                ) {
                  const service = historyItem.service[0]; // Take the first service entry
                  entry.serviceType = service.serviceType || '';
                  entry.serviceAmount = service.amount || 0;
                  entry.serviceTimestamp = service.timestamp
                    ? new Date(service.timestamp.seconds * 1000).toISOString().slice(0, 16)
                    : '';
                  entry.serviceNotes = service.notes || '';
                }

                return entry;
              } else if (historyItem.type === 'retrading') {
                return {
                  type: 'retrading',
                  retradingDate: historyItem.retradingDate
                    ? new Date(historyItem.retradingDate.seconds * 1000).toISOString().split('T')[0]
                    : '',
                  vendor: historyItem.vendor || '',
                  readyToUseDate: historyItem.readyToUseDate
                    ? new Date(historyItem.readyToUseDate.seconds * 1000)
                        .toISOString()
                        .split('T')[0]
                    : '',
                };
              }
              return { type: 'onTrip' };
            });
            setHistoryEntries(parsedHistory);
          }
        } else {
          toast.error('Tyre not found');
          if (onCancel) onCancel();
        }
      } catch (error) {
        console.error('Error fetching tyre:', error);
        toast.error('Failed to load tyre data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTyreData();
  }, [tyreId, onCancel]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addHistoryEntry = () => {
    setHistoryEntries([...historyEntries, { type: 'onTrip' }]);
  };

  const removeHistoryEntry = (index: number) => {
    setHistoryEntries(historyEntries.filter((_, i) => i !== index));
  };

  const updateHistoryEntry = (index: number, field: string, value: string | number) => {
    const updatedEntries = [...historyEntries];
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };
    setHistoryEntries(updatedEntries);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare current position data
      let currentPosition: any = 'NA';
      if (formData.status === 'ACTIVE' && formData.currentTruckNumber && formData.currentPosition) {
        currentPosition = {
          truckNumber: formData.currentTruckNumber,
          truckType: formData.currentTruckType || '',
          position: formData.currentPosition,
        };
      }

      // Prepare history data
      let history: any = 'NA';
      if (historyEntries.length > 0) {
        history = historyEntries.map((entry) => {
          if (entry.type === 'onTrip') {
            const historyEntry: any = {
              type: 'onTrip',
              truckNumber: entry.truckNumber || '',
              truckType: entry.truckType || '',
              mount: {
                timestamp: entry.mountTimestamp
                  ? Timestamp.fromDate(new Date(entry.mountTimestamp))
                  : Timestamp.now(),
                odometer: entry.mountOdometer || 0,
                position: entry.mountPosition || '',
              },
              unmount: {
                timestamp: entry.unmountTimestamp
                  ? Timestamp.fromDate(new Date(entry.unmountTimestamp))
                  : Timestamp.now(),
                odometer: entry.unmountOdometer || 0,
              },
            };

            // Add service history if provided
            if (entry.serviceType && entry.serviceAmount) {
              historyEntry.service = [
                {
                  serviceType: entry.serviceType,
                  amount: entry.serviceAmount,
                  timestamp: entry.serviceTimestamp
                    ? Timestamp.fromDate(new Date(entry.serviceTimestamp))
                    : Timestamp.now(),
                  notes: entry.serviceNotes || undefined,
                },
              ];
            } else {
              historyEntry.service = 'NA';
            }

            return historyEntry;
          } else if (entry.type === 'retrading') {
            return {
              type: 'retrading',
              retradingDate: entry.retradingDate
                ? Timestamp.fromDate(new Date(entry.retradingDate))
                : Timestamp.now(),
              vendor: entry.vendor || '',
              readyToUseDate: entry.readyToUseDate
                ? Timestamp.fromDate(new Date(entry.readyToUseDate))
                : Timestamp.now(),
            };
          }
          return entry;
        });
      }

      const validatedData = {
        company: formData.company,
        size: formData.size,
        status: formData.status,
        purchaseDate: new Date(formData.purchaseDate),
        currentPosition,
        history,
        updatedAt: serverTimestamp(),
      };

      // Update tyre document in Firestore
      const tyreRef = doc(db, 'tyres', tyreId);
      await updateDoc(tyreRef, validatedData);

      toast.success('Tyre updated successfully!');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating tyre:', error);
      toast.error('Failed to update tyre', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available positions based on selected size
  const getAvailablePositions = (size: string): string[] => {
    const sizeMap: Record<string, string[]> = {
      '10 R 20': [
        'FL',
        'FR',
        'DLO',
        'DLI',
        'DRI',
        'DRO',
        'LL',
        'LR',
        'SLO',
        'SLI',
        'SRI',
        'SRO',
        'SFL',
        'SFR',
        'SRL',
        'SRR',
        'LLO',
        'LLI',
        'LRI',
        'LRO',
      ],
      '9 R 20': [
        'FSLO',
        'FSLI',
        'FSRI',
        'FSRO',
        'RSLO',
        'RSLI',
        'RSRI',
        'RSRO',
        'LLO',
        'LLI',
        'LRI',
        'LRO',
      ],
    };

    return sizeMap[size] || [];
  };

  if (isLoading) {
    return <div className="py-8 text-center">Loading tyre data...</div>;
  }

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="e.g. MRF, CEAT, JK Tyre"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Select
              value={formData.size}
              onValueChange={(value) => {
                handleInputChange('size', value);
                // Reset position when size changes
                handleInputChange('currentPosition', '');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select tyre size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10 R 20">10 R 20</SelectItem>
                <SelectItem value="9 R 20">9 R 20</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => {
                handleInputChange('status', value);
                // Reset current position fields if status is not ACTIVE
                if (value !== 'ACTIVE') {
                  handleInputChange('currentTruckNumber', '');
                  handleInputChange('currentTruckType', '');
                  handleInputChange('currentPosition', '');
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="RETIRED">Retired</SelectItem>
                <SelectItem value="UNDER_RETRADING">Under Retrading</SelectItem>
                <SelectItem value="READY_TO_USE">Ready to Use</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Current Position Section - Only show if status is ACTIVE */}
        {formData.status === 'ACTIVE' && (
          <>
            <div className="space-y-4">
              <h3 className="font-medium">Current Position (Required for Active Tyres)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentTruckNumber">Truck Number</Label>
                  <Input
                    id="currentTruckNumber"
                    placeholder="e.g. TN-01-AB-1234"
                    value={formData.currentTruckNumber}
                    onChange={(e) => handleInputChange('currentTruckNumber', e.target.value)}
                    required={formData.status === 'ACTIVE'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentTruckType">Truck Type</Label>
                  <Input
                    id="currentTruckType"
                    placeholder="e.g. Heavy, Medium"
                    value={formData.currentTruckType}
                    onChange={(e) => handleInputChange('currentTruckType', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentPosition">Position</Label>
                <Select
                  value={formData.currentPosition}
                  onValueChange={(value) => handleInputChange('currentPosition', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailablePositions(formData.size).map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {/* History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Tyre History</h3>
            <Button type="button" variant="outline" size="sm" onClick={addHistoryEntry}>
              Add History Entry
            </Button>
          </div>

          {historyEntries.map((entry, index) => (
            <div key={index} className="py-4 border rounded-md bg-white shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">History Entry {index + 1}</CardTitle>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeHistoryEntry(index)}
                  >
                    Remove
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>History Type</Label>
                  <Select
                    value={entry.type}
                    onValueChange={(value: 'onTrip' | 'retrading') =>
                      updateHistoryEntry(index, 'type', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select history type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onTrip">On Trip</SelectItem>
                      <SelectItem value="retrading">Retrading</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {entry.type === 'onTrip' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Truck Number</Label>
                        <Input
                          placeholder="e.g. TN-01-AB-1234"
                          value={entry.truckNumber || ''}
                          onChange={(e) => updateHistoryEntry(index, 'truckNumber', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Truck Type</Label>
                        <Input
                          placeholder="e.g. Heavy, Medium"
                          value={entry.truckType || ''}
                          onChange={(e) => updateHistoryEntry(index, 'truckType', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Mount Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Mount Date</Label>
                          <Input
                            type="datetime-local"
                            value={entry.mountTimestamp || ''}
                            onChange={(e) =>
                              updateHistoryEntry(index, 'mountTimestamp', e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mount Odometer</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={entry.mountOdometer || ''}
                            onChange={(e) =>
                              updateHistoryEntry(
                                index,
                                'mountOdometer',
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mount Position</Label>
                          <Select
                            value={entry.mountPosition || ''}
                            onValueChange={(value) =>
                              updateHistoryEntry(index, 'mountPosition', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailablePositions(formData.size).map((position) => (
                                <SelectItem key={position} value={position}>
                                  {position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Unmount Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Unmount Date</Label>
                          <Input
                            type="datetime-local"
                            value={entry.unmountTimestamp || ''}
                            onChange={(e) =>
                              updateHistoryEntry(index, 'unmountTimestamp', e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unmount Odometer</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={entry.unmountOdometer || ''}
                            onChange={(e) =>
                              updateHistoryEntry(
                                index,
                                'unmountOdometer',
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Service Information (Optional)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Service Type</Label>
                          <Input
                            placeholder="e.g. Repair, Maintenance"
                            value={entry.serviceType || ''}
                            onChange={(e) =>
                              updateHistoryEntry(index, 'serviceType', e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Service Amount</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={entry.serviceAmount || ''}
                            onChange={(e) =>
                              updateHistoryEntry(
                                index,
                                'serviceAmount',
                                parseFloat(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Service Date</Label>
                          <Input
                            type="datetime-local"
                            value={entry.serviceTimestamp || ''}
                            onChange={(e) =>
                              updateHistoryEntry(index, 'serviceTimestamp', e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Service Notes</Label>
                        <Textarea
                          placeholder="Additional notes about the service"
                          value={entry.serviceNotes || ''}
                          onChange={(e) =>
                            updateHistoryEntry(index, 'serviceNotes', e.target.value)
                          }
                          rows={3}
                        />
                      </div>
                    </div>
                  </>
                )}

                {entry.type === 'retrading' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Retrading Date</Label>
                      <Input
                        type="date"
                        value={entry.retradingDate || ''}
                        onChange={(e) => updateHistoryEntry(index, 'retradingDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vendor</Label>
                      <Input
                        placeholder="Vendor name"
                        value={entry.vendor || ''}
                        onChange={(e) => updateHistoryEntry(index, 'vendor', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ready to Use Date</Label>
                      <Input
                        type="date"
                        value={entry.readyToUseDate || ''}
                        onChange={(e) =>
                          updateHistoryEntry(index, 'readyToUseDate', e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating Tyre...' : 'Update Tyre'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default UpdateTyreForm;
