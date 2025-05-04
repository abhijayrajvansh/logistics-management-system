export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
  databaseURL: string;
}

export type Order = {
  order_id: string;
  docket_id: string;
  charge_basis: string;
  client_details: string;
  created_at: Date;
  current_location: string;
  dimensions: string;
  eway_bill_no: string;
  invoice: string;
  lr_no: string;
  packing_type: string;
  price: number;
  receiver_details: string;
  shipper_details: string;
  status: string;
  tat: Date;
  total_boxes_count: number;
  total_order_weight: number;
  updated_at: Date;
}

export type Trip = {
  id: string; // Firestore document ID
  tripId: string; // Our custom unique trip ID
  startingPoint: string;
  destination: string;
  driver: string;
  numberOfStops: number;
  startDate: Date;
  truck: string;
  status: string;
};


export type Driver = {
  id: string;
  driverId: string;
  driverName: string;
  driverTruckNo: string;
  phoneNumber?: string;
  licenseNumber?: string;
  status?: string;
};
