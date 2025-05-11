import { Timestamp } from "firebase/firestore";

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
  role: 'admin' | 'manager' | 'driver';
  createdAt: Date;
};

export type Order = {
  order_id: string;
  docket_id: string;
  charge_basis: string;
  client_details: string;
  created_at: Date;
  current_location: string;
  dimensions: string;
  invoice: string;
  lr_no: string;
  price: number;
  proof_of_delivery: ProofOfDelivery | 'NA';
  receiver_name: string;
  receiver_details: string;
  receiver_contact: string;
  status: string;
  tat: Date;
  total_boxes_count: number;
  total_order_weight: number;
  updated_at: Date;
};

export type ProofOfDelivery = {
  photo: string;
}

export type Trip = {
  id: string;
  tripId: string;
  startingPoint: string;
  destination: string;
  driver: string;
  numberOfStops: number;
  startDate: Date;
  truck: string;
  type: 'unassigned' | 'active' | 'past';
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
  phoneNumber?: string;
  languages: string[];
  driverTruckId?: string;
  driverDocuments?: DriverDocuments;
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
  current_tat: Date;
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
}

export type DriversAttendance = {
  id: string;
  attendance: DailyAttendacne[];
  driverId: string;
}

export type DailyAttendacne = {
  date: Timestamp;
  driverPhoto: string | 'NA';
  truckPhoto: string | 'NA';
  status: 'Present' | 'Absent';
}

export type Truck = {
  id: string;
  regNumber: string;
  axleConfig: string;
  ownership: "Owned" | "OnLoan";
  emiAmount: number;
  insuranceExpiry: Date;
  permitExpiry: Date;
  odoCurrent: number;
  odoAtLastService: number;
};
