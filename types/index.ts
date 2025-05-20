import { Timestamp } from 'firebase/firestore';

export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
  databaseURL: string;
};

export type User = {
  userId: string;
  email: string;
  password: string;
  displayName: string;
  location: string;
  role: 'admin' | 'manager' | 'driver';
  createdAt: Date;
};

export type Order = {
  order_id: string;
  docket_id: string;
  docket_price: number;
  charge_basis: string;
  client_details: string;
  created_at: Date;
  current_location: string;
  deadline: Date; // deadline for delivery, calculated from order creation date + tat
  dimensions: string;
  invoice: 'paid' | 'to pay' | 'received';
  lr_no: string;
  payment_mode: 'cash' | 'online' | '-';
  calculated_price: number;
  total_price: number;
  proof_of_delivery: ProofOfDelivery | 'NA';
  proof_of_payment: ProofOfPayment | 'NA';
  receiver_name: string;
  receiver_details: string;
  receiver_contact: string;
  status: 'Ready To Transport' | 'Assigned' | 'In Transit' | 'Transferred' | 'Delivered';
  tat: number; // whole numbers, format: hours
  total_boxes_count: number;
  total_order_weight: number;
  updated_at: Date;
  to_be_transferred: boolean; // if true, then this order is to be transferred to another center
  transfer_center_location: string | 'NA'; // if to_be_transferred is true, then this is the center's pincode to which the order is to be transferred
  previous_center_location: string | 'NA'; // if to_be_transferred is true, then this is the center's pincode from which the order is to be transferred
};

export type ProofOfDelivery = {
  photo: string[];
};

export type ProofOfPayment = {
  photo: string;
};

export type Trip = {
  id: string;
  tripId: string;
  startingPoint: string;
  destination: string;
  driver: string;
  numberOfStops: number;
  startDate: Date;
  truck: string;
  type: 'ready to ship' | 'active' | 'past';
  currentStatus?: 'Delivering' | 'Returning' | 'NA';
};

export type TripOrders = {
  tripId: string;
  orderIds: string[];
  updatedAt: Date;
};

export type Driver = {
  id: string;
  driverId: string;
  driverName: string;
  status: 'Active' | 'Inactive' | 'OnLeave' | 'OnTrip' | 'Suspended' | 'Deleted' | 'Stuck';
  phoneNumber: string;
  languages: string[];
  wheelsCapability?: string[] | 'NA'; // 3, 4, 6, 8, 10, 12, 14, 16, 18, 20
  assignedTruckId?: string | 'NA'; // if the driver is not assigned to any truck, then this will be 'NA'
  driverDocuments?: DriverDocuments | 'NA';
  emergencyContact?: EmergencyContact | 'NA';
  referredBy?: ReferredBy | 'NA';
};

export type EmergencyContact = {
  name: string;
  number: string;
  residencyAddress: string; // address of the emergency contact
  residencyProof: string;
};

export type ReferredBy = {
  type: User['role'];
  userId: string; // ID of the user who referred the driver
};

export type DriverDocuments = {
  aadhar_front: string;
  aadhar_back: string;
  aadhar_number: string;
  dob: Date;
  dob_certificate: string;
  license: string;
  license_number: string;
  license_expiry: Date;
  medicalCertificate: string;
  status: 'Verified' | 'Pending';
};

export type Client = {
  id: string;
  clientId: string;
  clientName: string;
  clientDetails: string;
  pincode: string;
  rateCard: ClientRateCard;
};

export type ClientRateCard = {
  preferance: 'By Weight' | 'Per Boxes';
  pricePerPref: number;
  minPriceWeight?: number | 'NA'; // if preferance is by weight, then price is should less than this minPriceWeight or "NA"
};

export type ReceiverDetails = {
  id: string;
  receiverId: string;
  receiverName: string;
  receiverDetails: string;
  receiverContact: string;
  pincode: string;
};

export type DriversAttendance = {
  id: string;
  attendance: DailyAttendacne[];
  driverId: string;
};

export type DailyAttendacne = {
  date: Timestamp;
  driverPhoto: string | 'NA';
  truckPhoto: string | 'NA';
  status: 'Present' | 'Absent';
};

export type Truck = {
  id: string;
  regNumber: string;
  axleConfig: string;
  ownership: 'Owned' | 'OnLoan';
  emiAmount: number;
  insuranceExpiry: Date;
  permitExpiry: Date;
  odoCurrent: number;
  odoAtLastService: number;
};

export type Center = {
  id: string;
  name: string;
  location: string;
  pincode: string;
};

export type TAT_Mapping = {
  id: string;
  center_pincode: string;
  client_pincode: string;
  receiver_pincode: string;
  tat_value: number; // in hours
  created_at: Timestamp;
  updated_at: Timestamp;
};


export type DriversRequest = {
  id: string;
  driverId: string; // reference to the driver who created the request
  type: 'leave' | 'money' | 'food' | 'others';
  status: 'Pending' | 'Approve' | 'Rejected';
  title: string;
  description: string;
  createdAt: Date;
};

export type PrintDocketSchema = {
  docketNumber: string;             // 1047256
  date: string;                     // 31/03/25

  consignor: {
    name: string;                   // G M Mobile Devices
    city?: string;                  // PUN
    address?: string;
    mobile?: string;
    tin?: string;
    truckNumber?: string;
  };

  consignee: {
    name: string;                   // Shree Shyam Mobiles
    city?: string;                  // Baddi
    address?: string;
    mobile?: string;
    tin?: string;
    truckNumber?: string;
  };

  noOfPackages: number;             // 6
  packingType: string;             // Box
  saidToContain: string;           // GHP2580159
  actualWeight: number;            // 25
  chargedWeight?: number;

  modeOfTransport: {
    air: boolean;
    train: boolean;
    road: boolean;
    international: {
      dox: boolean;
      nonDox: boolean;
    };
    domestic: {
      dox: boolean;
      nonDox: boolean;
    };
  };

  charges: {
    freightCharge?: number;
    serviceTax?: number;
    labourCharge?: number;
    grCharge?: number;
    handlingCharge?: number;
    subTotal?: number;
    total?: number;
    grandTotal?: number;
  };

  deliveryAt: {
    billNumber: string;            // 364895
    value: number;                 // 364895
    paymentMode: 'Paid' | 'To Pay' | 'Credit';
  };

  driverName?: string;
  driverSignature?: string;

  receivedBy: string;              // Jaiz Logistics Inc.
  receivedSignature?: string;
  receivedDate?: string;
  receivedTime?: string;

  transporterDetails: {
    pan: string;                   // APJPB6449Q
    gstin: string;                 // 02APJPB6449Q1ZK
    transporterId: string;        // 88APJPB6449Q1ZI
    gstinTaxPayableBy: {
      consignor: boolean;
      consignee: boolean;
      transporter: boolean;
      notPayable: boolean;
    };
  };
};
