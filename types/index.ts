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

// Order type definition
export interface Order {
  orderId: string;
  docket_id?: string;
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
  pickup_location: string;
  delivery_location: string;
  customer_name: string;
}