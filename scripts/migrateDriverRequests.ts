// Script to migrate legacy driver requests to use consistent field names
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/database';

async function migrateDriverRequests() {
  try {
    const requestsRef = collection(db, 'driver_requests');
    const snapshot = await getDocs(requestsRef);

    console.log(`Found ${snapshot.docs.length} requests to potentially migrate...`);

    let migratedCount = 0;

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const updates: any = {};

      // Migrate requestType to type
      if (data.requestType && !data.type) {
        updates.type = data.requestType;
        console.log(
          `Migrating requestType "${data.requestType}" to type for doc ${docSnapshot.id}`,
        );
      }

      // Migrate declined to rejected
      if (data.status === 'declined') {
        updates.status = 'rejected';
        console.log(`Migrating status "declined" to "rejected" for doc ${docSnapshot.id}`);
      }

      // Add missing fields with defaults if needed
      if (!data.reason) {
        updates.reason = 'No reason provided';
      }

      if (!data.startDate) {
        updates.startDate = data.createdAt || new Date();
      }

      if (!data.endDate) {
        updates.endDate = data.createdAt || new Date();
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'driver_requests', docSnapshot.id), updates);
        migratedCount++;
        console.log(`Updated document ${docSnapshot.id} with:`, updates);
      }
    }

    console.log(
      `\nMigration completed! Updated ${migratedCount} out of ${snapshot.docs.length} documents.`,
    );
  } catch (error) {
    console.error('Error migrating driver requests:', error);
  }
}

migrateDriverRequests();
