import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Truck } from '@/types';

/**
 * Sample script to seed truck data into Firestore
 * Run this script to add sample truck records to the database
 */
async function seedTrucks() {
  console.log('Starting to seed truck data...');

  try {
    // First check if we already have trucks in the collection
    const trucksCollection = collection(db, 'trucks');
    const existingTrucks = await getDocs(trucksCollection);

    if (!existingTrucks.empty) {
      console.log(
        `Found ${existingTrucks.size} existing trucks. Skipping seeding to avoid duplicates.`,
      );
      return;
    }

    // Sample truck data
    const trucks: Omit<Truck, 'id'>[] = [
      {
        regNumber: 'TN-01-AB-1234',
        axleConfig: '6x2',
        ownership: 'Owned',
        emiAmount: 0,
        insuranceExpiry: new Date('2026-01-15'),
        permitExpiry: new Date('2025-12-20'),
        odoCurrent: 45000,
        odoAtLastService: 38000,
      },
      {
        regNumber: 'KA-02-CD-5678',
        axleConfig: '4x2',
        ownership: 'OnLoan',
        emiAmount: 15000,
        insuranceExpiry: new Date('2025-07-22'),
        permitExpiry: new Date('2025-08-10'),
        odoCurrent: 62000,
        odoAtLastService: 60000,
      },
      {
        regNumber: 'MH-03-EF-9012',
        axleConfig: '8x4',
        ownership: 'Owned',
        emiAmount: 0,
        insuranceExpiry: new Date('2025-06-05'), // Expiring soon
        permitExpiry: new Date('2026-02-17'),
        odoCurrent: 28000,
        odoAtLastService: 20000,
      },
      {
        regNumber: 'GJ-04-GH-3456',
        axleConfig: '6x4',
        ownership: 'OnLoan',
        emiAmount: 22000,
        insuranceExpiry: new Date('2026-03-11'),
        permitExpiry: new Date('2025-05-30'), // Expiring very soon
        odoCurrent: 75000,
        odoAtLastService: 55000, // Service due
      },
      {
        regNumber: 'DL-05-IJ-7890',
        axleConfig: '4x2',
        ownership: 'Owned',
        emiAmount: 0,
        insuranceExpiry: new Date('2026-05-19'),
        permitExpiry: new Date('2026-04-23'),
        odoCurrent: 36000,
        odoAtLastService: 32000,
      },
    ];

    // Add each truck to Firestore
    for (const truck of trucks) {
      await addDoc(trucksCollection, {
        ...truck,
        created_at: new Date(),
      });
      console.log(`Added truck with registration: ${truck.regNumber}`);
    }

    console.log('Successfully seeded 5 trucks to Firestore!');
  } catch (error) {
    console.error('Error seeding truck data:', error);
  }
}

// Run the seed function
seedTrucks();
