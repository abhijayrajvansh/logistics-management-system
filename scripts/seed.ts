import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/database';

const addSampleDataToFirestore = async (): Promise<void> => {
  // Sample Orders Data
  const orders = [
    // Ready To Transport Orders
    {
      docket_id: 'DO001234',
      shipper_details: 'Amazon India',
      receiver_details: 'Amazon Warehouse Mumbai',
      total_boxes_count: 50,
      packing_type: 'Carton',
      dimensions: '100x50x50',
      total_order_weight: 500,
      lr_no: 'LR001234',
      eway_bill_no: 'EW001234',
      tat: new Date('2025-05-15'),
      charge_basis: 'By Weight',
      current_location: 'Delhi Hub',
      client_details: 'Amazon Logistics',
      price: 25000,
      invoice: 'paid',
      status: 'Ready To Transport',
    },
    {
      docket_id: 'DO002234',
      shipper_details: 'Flipkart',
      receiver_details: 'Flipkart Warehouse Bangalore',
      total_boxes_count: 30,
      packing_type: 'Pallet',
      dimensions: '80x40x40',
      total_order_weight: 300,
      lr_no: 'LR002234',
      eway_bill_no: 'EW002234',
      tat: new Date('2025-05-16'),
      charge_basis: 'Per Boxes',
      current_location: 'Mumbai Hub',
      client_details: 'Flipkart Logistics',
      price: 15000,
      invoice: 'to pay',
      status: 'Ready To Transport',
    },
    {
      docket_id: 'DO003234',
      shipper_details: 'Myntra',
      receiver_details: 'Myntra Warehouse Chennai',
      total_boxes_count: 40,
      packing_type: 'Carton',
      dimensions: '90x45x45',
      total_order_weight: 400,
      lr_no: 'LR003234',
      eway_bill_no: 'EW003234',
      tat: new Date('2025-05-17'),
      charge_basis: 'By Weight',
      current_location: 'Bangalore Hub',
      client_details: 'Myntra Logistics',
      price: 20000,
      invoice: 'paid',
      status: 'Ready To Transport',
    },
    {
      docket_id: 'DO004234',
      shipper_details: 'Reliance Retail',
      receiver_details: 'Reliance Warehouse Kolkata',
      total_boxes_count: 60,
      packing_type: 'Pallet',
      dimensions: '120x60x60',
      total_order_weight: 600,
      lr_no: 'LR004234',
      eway_bill_no: 'EW004234',
      tat: new Date('2025-05-18'),
      charge_basis: 'Per Boxes',
      current_location: 'Chennai Hub',
      client_details: 'Reliance Logistics',
      price: 30000,
      invoice: 'to pay',
      status: 'Ready To Transport',
    },

    // Assigned Orders
    {
      docket_id: 'DO005234',
      shipper_details: 'Tata Motors',
      receiver_details: 'Tata Warehouse Pune',
      total_boxes_count: 25,
      packing_type: 'Carton',
      dimensions: '70x35x35',
      total_order_weight: 250,
      lr_no: 'LR005234',
      eway_bill_no: 'EW005234',
      tat: new Date('2025-05-19'),
      charge_basis: 'By Weight',
      current_location: 'Kolkata Hub',
      client_details: 'Tata Logistics',
      price: 12500,
      invoice: 'paid',
      status: 'Assigned',
    },
    {
      docket_id: 'DO006234',
      shipper_details: 'Mahindra',
      receiver_details: 'Mahindra Warehouse Nagpur',
      total_boxes_count: 35,
      packing_type: 'Pallet',
      dimensions: '85x42x42',
      total_order_weight: 350,
      lr_no: 'LR006234',
      eway_bill_no: 'EW006234',
      tat: new Date('2025-05-20'),
      charge_basis: 'Per Boxes',
      current_location: 'Pune Hub',
      client_details: 'Mahindra Logistics',
      price: 17500,
      invoice: 'to pay',
      status: 'Assigned',
    },
    {
      docket_id: 'DO007234',
      shipper_details: 'Hero MotoCorp',
      receiver_details: 'Hero Warehouse Jaipur',
      total_boxes_count: 45,
      packing_type: 'Carton',
      dimensions: '95x47x47',
      total_order_weight: 450,
      lr_no: 'LR007234',
      eway_bill_no: 'EW007234',
      tat: new Date('2025-05-21'),
      charge_basis: 'By Weight',
      current_location: 'Nagpur Hub',
      client_details: 'Hero Logistics',
      price: 22500,
      invoice: 'paid',
      status: 'Assigned',
    },
    {
      docket_id: 'DO008234',
      shipper_details: 'Bajaj Auto',
      receiver_details: 'Bajaj Warehouse Lucknow',
      total_boxes_count: 55,
      packing_type: 'Pallet',
      dimensions: '110x55x55',
      total_order_weight: 550,
      lr_no: 'LR008234',
      eway_bill_no: 'EW008234',
      tat: new Date('2025-05-22'),
      charge_basis: 'Per Boxes',
      current_location: 'Jaipur Hub',
      client_details: 'Bajaj Logistics',
      price: 27500,
      invoice: 'to pay',
      status: 'Assigned',
    },
    {
      docket_id: 'DO009234',
      shipper_details: 'TVS Motors',
      receiver_details: 'TVS Warehouse Ahmedabad',
      total_boxes_count: 65,
      packing_type: 'Carton',
      dimensions: '130x65x65',
      total_order_weight: 650,
      lr_no: 'LR009234',
      eway_bill_no: 'EW009234',
      tat: new Date('2025-05-23'),
      charge_basis: 'By Weight',
      current_location: 'Lucknow Hub',
      client_details: 'TVS Logistics',
      price: 32500,
      invoice: 'paid',
      status: 'Assigned',
    },
    {
      docket_id: 'DO010234',
      shipper_details: 'Yamaha Motors',
      receiver_details: 'Yamaha Warehouse Indore',
      total_boxes_count: 70,
      packing_type: 'Pallet',
      dimensions: '140x70x70',
      total_order_weight: 700,
      lr_no: 'LR010234',
      eway_bill_no: 'EW010234',
      tat: new Date('2025-05-24'),
      charge_basis: 'Per Boxes',
      current_location: 'Ahmedabad Hub',
      client_details: 'Yamaha Logistics',
      price: 35000,
      invoice: 'to pay',
      status: 'Assigned',
    },
    {
      docket_id: 'DO011234',
      shipper_details: 'Honda Motors',
      receiver_details: 'Honda Warehouse Bhopal',
      total_boxes_count: 75,
      packing_type: 'Carton',
      dimensions: '150x75x75',
      total_order_weight: 750,
      lr_no: 'LR011234',
      eway_bill_no: 'EW011234',
      tat: new Date('2025-05-25'),
      charge_basis: 'By Weight',
      current_location: 'Indore Hub',
      client_details: 'Honda Logistics',
      price: 37500,
      invoice: 'paid',
      status: 'Assigned',
    },
    {
      docket_id: 'DO012234',
      shipper_details: 'Suzuki Motors',
      receiver_details: 'Suzuki Warehouse Raipur',
      total_boxes_count: 80,
      packing_type: 'Pallet',
      dimensions: '160x80x80',
      total_order_weight: 800,
      lr_no: 'LR012234',
      eway_bill_no: 'EW012234',
      tat: new Date('2025-05-26'),
      charge_basis: 'Per Boxes',
      current_location: 'Bhopal Hub',
      client_details: 'Suzuki Logistics',
      price: 40000,
      invoice: 'to pay',
      status: 'Assigned',
    },
  ];

  // Sample Trips Data
  const trips = [
    // Active Trips
    {
      tripId: 'TRIP001234',
      startingPoint: 'New York',
      destination: 'Los Angeles',
      driver: 'driver_1',
      numberOfStops: 3,
      startDate: new Date('2025-05-01'),
      truck: 'TN-01-AA-1234',
      type: 'active',
      currentStatus: 'Delivering',
    },
    {
      tripId: 'TRIP002234',
      startingPoint: 'Chicago',
      destination: 'Houston',
      driver: 'driver_2',
      numberOfStops: 2,
      startDate: new Date('2025-05-02'),
      truck: 'TN-02-BB-5678',
      type: 'active',
      currentStatus: 'Returning',
    },
    {
      tripId: 'TRIP003234',
      startingPoint: 'San Francisco',
      destination: 'Seattle',
      driver: 'driver_3',
      numberOfStops: 4,
      startDate: new Date('2025-05-03'),
      truck: 'TN-03-CC-9012',
      type: 'active',
      currentStatus: 'Delivering',
    },
    {
      tripId: 'TRIP004234',
      startingPoint: 'Miami',
      destination: 'Atlanta',
      driver: 'driver_4',
      numberOfStops: 1,
      startDate: new Date('2025-05-04'),
      truck: 'TN-04-DD-3456',
      type: 'active',
      currentStatus: 'Delivering',
    },

    // Past Trips
    {
      tripId: 'TRIP005234',
      startingPoint: 'Dallas',
      destination: 'Denver',
      driver: 'driver_5',
      numberOfStops: 2,
      startDate: new Date('2025-04-15'),
      truck: 'TN-05-EE-7890',
      type: 'past',
      currentStatus: 'NA',
    },
    {
      tripId: 'TRIP006234',
      startingPoint: 'Boston',
      destination: 'Philadelphia',
      driver: 'driver_6',
      numberOfStops: 3,
      startDate: new Date('2025-04-16'),
      truck: 'TN-06-FF-1234',
      type: 'past',
      currentStatus: 'NA',
    },
    {
      tripId: 'TRIP007234',
      startingPoint: 'Phoenix',
      destination: 'Las Vegas',
      driver: 'driver_7',
      numberOfStops: 1,
      startDate: new Date('2025-04-17'),
      truck: 'TN-07-GG-5678',
      type: 'past',
      currentStatus: 'NA',
    },
    {
      tripId: 'TRIP008234',
      startingPoint: 'Portland',
      destination: 'Sacramento',
      driver: 'driver_8',
      numberOfStops: 2,
      startDate: new Date('2025-04-18'),
      truck: 'TN-08-HH-9012',
      type: 'past',
      currentStatus: 'NA',
    },

    // Unassigned Trips
    {
      tripId: 'TRIP009234',
      startingPoint: 'Detroit',
      destination: 'Cleveland',
      driver: 'driver_9',
      numberOfStops: 3,
      startDate: new Date('2025-05-10'),
      truck: 'TN-09-II-3456',
      type: 'unassigned',
      currentStatus: 'NA',
    },
    {
      tripId: 'TRIP010234',
      startingPoint: 'Nashville',
      destination: 'Memphis',
      driver: 'driver_10',
      numberOfStops: 2,
      startDate: new Date('2025-05-11'),
      truck: 'TN-10-JJ-7890',
      type: 'unassigned',
      currentStatus: 'NA',
    },
    {
      tripId: 'TRIP011234',
      startingPoint: 'St. Louis',
      destination: 'Kansas City',
      driver: 'driver_11',
      numberOfStops: 4,
      startDate: new Date('2025-05-12'),
      truck: 'TN-11-KK-1234',
      type: 'unassigned',
      currentStatus: 'NA',
    },
    {
      tripId: 'TRIP012234',
      startingPoint: 'Indianapolis',
      destination: 'Cincinnati',
      driver: 'driver_12',
      numberOfStops: 1,
      startDate: new Date('2025-05-13'),
      truck: 'TN-12-LL-5678',
      type: 'unassigned',
      currentStatus: 'NA',
    },
  ];

  try {
    // Add Orders
    const ordersCollection = collection(db, 'orders');
    for (const order of orders) {
      await addDoc(ordersCollection, {
        ...order,
        created_at: new Date(),
      });
    }
    console.log('Successfully added 12 sample orders to Firestore.');

    // Add Trips
    const tripsCollection = collection(db, 'trips');
    for (const trip of trips) {
      await addDoc(tripsCollection, {
        ...trip,
        created_at: new Date(),
      });
    }
    console.log('Successfully added 12 sample trips to Firestore.');
  } catch (error) {
    console.error('Error adding sample data:', error);
  }
};

// Run the function
addSampleDataToFirestore();
