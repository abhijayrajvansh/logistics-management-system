import { db } from '@/firebase/database';
import { DriversAttendance, DailyAttendacne } from '@/types';
import { collection, getDocs, Timestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export async function createDriversAttendanceAbsent() {
  const driverCollectionRef = collection(db, 'drivers');
  const attendanceCollectionRef = collection(db, 'attendance');

  const querySnapshot = await getDocs(driverCollectionRef);

  if (querySnapshot.empty) {
    throw new Error('no driver uids found');
  }

  const driverDocumentIds = querySnapshot.docs.map((doc) => ({
    id: doc.id,
  }));

  // Process each driver asynchronously
  const promises = driverDocumentIds.map(async (driver) => {
    const driverUID = driver.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day

    const attendanceDocRef = doc(attendanceCollectionRef, driverUID);
    const attendanceDoc = await getDoc(attendanceDocRef);

    const newAttendanceEntry: DailyAttendacne = {
      date: Timestamp.fromDate(today),
      driverPhoto: 'NA',
      truckPhoto: 'NA',
      status: 'Absent' as const,
    };

    if (!attendanceDoc.exists()) {
      // Case 1: Create new attendance document
      const newAttendanceDoc: DriversAttendance = {
        id: driverUID,
        driverId: driverUID,
        attendance: [newAttendanceEntry],
      };
      await setDoc(attendanceDocRef, newAttendanceDoc);
    } else {
      // Case 2: Update existing attendance document
      const existingData = attendanceDoc.data() as DriversAttendance;
      const todayExists = existingData.attendance.some(
        (entry) => (entry.date as Timestamp).toDate().getTime() === today.getTime(),
      );

      if (!todayExists) {
        await updateDoc(attendanceDocRef, {
          attendance: [...existingData.attendance, newAttendanceEntry],
        });
      }
    }
  });

  await Promise.all(promises);
  console.log('Successfully updated attendance records for all drivers');
}

// Only run if this file is executed directly
if (require.main === module) {
  createDriversAttendanceAbsent()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
