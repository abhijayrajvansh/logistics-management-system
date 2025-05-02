import { columns, Trip } from './columns';
import { DataTable } from './data-tabel';
import { SiteHeader } from '@/components/site-header';
import { db } from '@/firebase/database';
import { collection, getDocs, query, where } from 'firebase/firestore';

// Helper function to serialize Firestore data
function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (data.toDate instanceof Function) {
    // Convert Firestore Timestamp to ISO string
    return data.toDate();
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeData(item));
  }

  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    Object.keys(data).forEach((key) => {
      result[key] = serializeData(data[key]);
    });
    return result;
  }

  return data;
}

async function getData(): Promise<{ unassigned: Trip[]; active: Trip[]; past: Trip[] }> {
  try {
    const tripsCollection = collection(db, 'trips');

    // Get all trips
    const snapshot = await getDocs(tripsCollection);

    const unassignedTrips: Trip[] = [];
    const activeTrips: Trip[] = [];
    const pastTrips: Trip[] = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Serialize the Firestore data
      const serializedData = serializeData(data);

      const trip = {
        id: doc.id,
        ...serializedData,
        // Ensure new fields are properly included with defaults if missing
        startingPoint: serializedData.startingPoint || '',
        destination: serializedData.destination || '',
        driver: serializedData.driver || 'Unassigned',
        numberOfStops: serializedData.numberOfStops || 0,
        startDate: serializedData.startDate || new Date(),
        truck: serializedData.truck || '',
        status: serializedData.status || 'unassigned',
      } as Trip;

      // Categorize trips based on status
      if (trip.status === 'unassigned') {
        unassignedTrips.push(trip);
      } else if (trip.status === 'active' || trip.status === 'in-progress') {
        activeTrips.push(trip);
      } else if (trip.status === 'completed' || trip.status === 'past') {
        pastTrips.push(trip);
      } else {
        // Default to unassigned if status is unknown
        unassignedTrips.push(trip);
      }
    });

    return {
      unassigned: unassignedTrips,
      active: activeTrips,
      past: pastTrips,
    };
  } catch (error) {
    console.error('Error fetching trips: ', error);
    return {
      unassigned: [],
      active: [],
      past: [],
    };
  }
}

export default async function TripsPage() {
  const { unassigned, active, past } = await getData();
  return (
    <>
      <SiteHeader title="Trips" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1"></div>
            </div>
            <DataTable
              columns={columns}
              data={unassigned}
              activeTripData={active}
              pastTripData={past}
            />
          </div>
        </div>
      </div>
    </>
  );
}
