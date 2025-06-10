// Script to check the structure of requests in the database
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/database';

async function checkRequestsStructure() {
  try {
    const requestsRef = collection(db, 'driver_requests');
    const snapshot = await getDocs(requestsRef);

    console.log(`Found ${snapshot.docs.length} requests in the database:`);

    snapshot.docs.forEach((doc, index) => {
      console.log(`\n--- Request ${index + 1} (ID: ${doc.id}) ---`);
      const data = doc.data();
      console.log('Full document data:', JSON.stringify(data, null, 2));
      console.log('Type field specifically:', data.type);
      console.log('Type of type field:', typeof data.type);
    });
  } catch (error) {
    console.error('Error checking requests structure:', error);
  }
}

checkRequestsStructure();
