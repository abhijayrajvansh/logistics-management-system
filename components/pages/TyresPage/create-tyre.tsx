'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrucks } from '@/hooks/useTrucks';

interface CreateTyreFormProps {
  onSuccess?: () => void;
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

export function CreateTyreForm({ onSuccess }: CreateTyreFormProps) {
  const { trucks, isLoading: trucksLoading } = useTrucks();

  const [formData, setFormData] = useState({
    company: '',
    size: '',
    status: 'READY_TO_USE',
    purchaseDate: '',
    currentTruckNumber: '',
    currentTruckType: '',
    currentPosition: '',
  });

  const [historyEntries, setHistoryEntries] = useState<TyreHistoryEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Create tyre data
      const tyreData = {
        company: formData.company,
        size: formData.size,
        purchaseDate: new Date(formData.purchaseDate),
        status: formData.status,
        currentPosition,
        history,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add the tyre to Firestore
      await addDoc(collection(db, 'tyres'), tyreData);

      toast.success('Tyre added successfully!', {
        description: `Company: ${formData.company}, Size: ${formData.size}`,
      });

      // Reset form
      setFormData({
        company: '',
        size: '',
        status: 'READY_TO_USE',
        purchaseDate: '',
        currentTruckNumber: '',
        currentTruckType: '',
        currentPosition: '',
      });
      setHistoryEntries([]);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating tyre:', error);
      toast.error('Failed to add tyre', {
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
              onValueChange={(value) => handleInputChange('status', value)}
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
                  <Select
                    value={formData.currentTruckNumber}
                    onValueChange={(value) => handleInputChange('currentTruckNumber', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={trucksLoading ? 'Loading trucks...' : 'Select truck number'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {trucks.map((truck) => (
                        <SelectItem key={truck.id} value={truck.regNumber}>
                          {truck.regNumber} ({truck.axleConfig})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            <h3 className="font-normal">
              <span className="font-semibold">Tyre History</span> (Optional)
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={addHistoryEntry}>
              Add History Entry
            </Button>
          </div>

          {historyEntries.map((entry, index) => (
            <div key={index} className="py-4 border rounded-md bg-white shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">History Entry: {index + 1}</CardTitle>
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
                        <Select
                          value={entry.truckNumber || ''}
                          onValueChange={(value) => updateHistoryEntry(index, 'truckNumber', value)}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                trucksLoading ? 'Loading trucks...' : 'Select truck number'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {trucks.map((truck) => (
                              <SelectItem key={truck.id} value={truck.regNumber}>
                                {truck.regNumber} ({truck.axleConfig})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                company: '',
                size: '',
                status: 'READY_TO_USE',
                purchaseDate: '',
                currentTruckNumber: '',
                currentTruckType: '',
                currentPosition: '',
              });
              setHistoryEntries([]);
            }}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding Tyre...' : 'Add Tyre'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CreateTyreForm;
