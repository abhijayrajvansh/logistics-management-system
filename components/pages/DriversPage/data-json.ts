export type Payment = {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  email: string;
};

export const data: Payment[] = [
  {
    id: 'm5gr84i9',
    amount: 316,
    status: 'success',
    email: 'ken99@example.com',
  },
  {
    id: '3u1reuv4',
    amount: 242,
    status: 'success',
    email: 'Abe45@example.com',
  },
  {
    id: 'derv1ws0',
    amount: 837,
    status: 'processing',
    email: 'Monserrat44@example.com',
  },
  {
    id: '5kma53ae',
    amount: 874,
    status: 'success',
    email: 'Silas22@example.com',
  },
  {
    id: 'bhqecj4p',
    amount: 721,
    status: 'failed',
    email: 'carmella@example.com',
  },
];

import { Driver } from '@/types';

export const drivers: Driver[] = [
  {
    id: '1',
    driverId: 'DRV001',
    driverName: 'John Doe',
    status: 'Active',
    phoneNumber: '+91-9876543210',
    languages: ['English', 'Hindi'],
    driverTruckId: 'TRK001',
    driverDocuments: {
      aadhar: 'aadhar-link',
      dob: new Date('1990-01-01'),
      license: 'license-link',
      insurance: 'insurance-link',
      medicalCertificate: 'medical-cert-link',
      panCard: 'pan-link',
    },
  },
  {
    id: '2',
    driverId: 'DRV002',
    driverName: 'Raj Kumar',
    status: 'OnTrip',
    phoneNumber: '+91-9876543211',
    languages: ['Hindi', 'Punjabi'],
    driverTruckId: 'TRK002',
    driverDocuments: {
      aadhar: 'aadhar-link',
      dob: new Date('1988-05-15'),
      license: 'license-link',
      insurance: 'insurance-link',
      medicalCertificate: 'medical-cert-link',
      panCard: 'pan-link',
    },
  },
];
