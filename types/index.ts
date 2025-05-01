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
  id: string;
  shipper_details: string;
  receiver_details: string;
  total_boxes_count: number;
  packing_type: string;
  dimensions: string;
  total_order_weight: number;
  lr_no: string;
  eway_bill_no: string;
  tat: string; // ISO string
  charge_basis: "weight" | "volume" | "box_count"; // example enum values
  docket_id: string;
  current_location: string;
  client_details: string;
};
