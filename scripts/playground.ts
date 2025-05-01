import { getFirestore, collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { firebaseApp } from '../firebase/firebase.config';

// Initialize Firestore
const db = getFirestore(firebaseApp);

// Sample order data
const sampleOrders = [
  {
    docket_id: '100021',
    client_details: 'ABC Enterprises',
    shipper_details: 'XYZ Shipping Co.',
    receiver_details: 'Global Importers Ltd.',
    total_boxes_count: 5,
    packing_type: 'Standard',
    dimensions: '40x30x20',
    total_order_weight: 120,
    lr_no: 'LR12345',
    eway_bill_no: 'EWB98765',
    tat: new Date('2023-09-15'),
    charge_basis: 'By Weight',
    current_location: 'Mumbai',
    status: 'pending',
    created_at: Timestamp.now(),
  },
  {
    docket_id: '100022',
    client_details: 'Quick Logistics',
    shipper_details: 'FastTrack Exports',
    receiver_details: 'Prime Distributors',
    total_boxes_count: 3,
    packing_type: 'Premium',
    dimensions: '20x15x10',
    total_order_weight: 45,
    lr_no: 'LR54321',
    eway_bill_no: 'EWB12345',
    tat: new Date('2023-09-20'),
    charge_basis: 'Per Boxes',
    current_location: 'Delhi',
    status: 'processing',
    created_at: Timestamp.now(),
  },
  {
    docket_id: '100023',
    client_details: 'Horizon Imports Inc.',
    shipper_details: 'Sea Breeze Shipping',
    receiver_details: 'Metro Distribution Center',
    total_boxes_count: 8,
    packing_type: 'Heavy Duty',
    dimensions: '50x45x30',
    total_order_weight: 240,
    lr_no: 'LR67890',
    eway_bill_no: 'EWB45678',
    tat: new Date('2023-09-25'),
    charge_basis: 'By Weight',
    current_location: 'Bangalore',
    status: 'in_transit',
    created_at: Timestamp.now(),
  },
  {
    docket_id: '100024',
    client_details: 'Techno Solutions Ltd.',
    shipper_details: 'Digital Cargo Express',
    receiver_details: 'NextGen Electronics',
    total_boxes_count: 2,
    packing_type: 'Electronic Safe',
    dimensions: '25x20x15',
    total_order_weight: 18,
    lr_no: 'LR98765',
    eway_bill_no: 'EWB34567',
    tat: new Date('2023-09-18'),
    charge_basis: 'Per Boxes',
    current_location: 'Hyderabad',
    status: 'delivered',
    created_at: Timestamp.now(),
  },
  {
    docket_id: '100025',
    client_details: 'Green Earth Organics',
    shipper_details: 'Eco-Friendly Logistics',
    receiver_details: 'Natural Foods Distributors',
    total_boxes_count: 12,
    packing_type: 'Biodegradable',
    dimensions: '35x25x20',
    total_order_weight: 75,
    lr_no: 'LR24680',
    eway_bill_no: 'EWB13579',
    tat: new Date('2023-09-30'),
    charge_basis: 'By Weight',
    current_location: 'Chennai',
    status: 'pending',
    created_at: Timestamp.now(),
  },
];

// Function to save sample data to Firestore
async function saveSampleOrdersToFirestore() {
  try {
    console.log('Saving sample orders to Firestore...');

    // First check if orders already exist to avoid duplicates
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    if (!ordersSnapshot.empty) {
      console.log(
        `${ordersSnapshot.size} orders already exist in Firestore. Skipping sample data creation.`,
      );
      return;
    }

    // Add each sample order to Firestore
    for (const order of sampleOrders) {
      const docRef = await addDoc(collection(db, 'orders'), order);
      console.log(`Order added with ID: ${docRef.id}`);
    }

    console.log('Sample orders successfully added to Firestore!');
  } catch (error) {
    console.error('Error adding sample orders: ', error);
  }
}

// Execute the function
saveSampleOrdersToFirestore();

// Export for potential use in other modules
// export { saveSampleOrdersToFirestore };
