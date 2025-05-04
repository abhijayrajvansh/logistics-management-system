import { Trip } from "../types";
import { db } from "../firebase/database";
import { collection, addDoc } from "firebase/firestore";

const addSampleTripsToFirestore = async (): Promise<void> => {
  const trips = [
    {
      tripId: "TRIP001234",
      startingPoint: "New York",
      destination: "Los Angeles",
      driver: "John Doe",
      numberOfStops: 3,
      startDate: new Date("2025-05-01"),
      truck: "Truck A",
      type: "active",
    },
    {
      tripId: "TRIP00224",
      startingPoint: "Chicago",
      destination: "Houston",
      driver: "Jane Smith",
      numberOfStops: 2,
      startDate: new Date("2025-04-25"),
      truck: "Truck B",
      type: "past",
    },
    {
      tripId: "TRIP003243",
      startingPoint: "San Francisco",
      destination: "Seattle",
      driver: "Mike Johnson",
      numberOfStops: 1,
      startDate: new Date("2025-05-03"),
      truck: "Truck C",
      type: "unassigned",
    },
    {
      tripId: "TRIP004234",
      startingPoint: "Miami",
      destination: "Atlanta",
      driver: "Emily Davis",
      numberOfStops: 4,
      startDate: new Date("2025-05-02"),
      truck: "Truck D",
      type: "unassigned",
    },
    {
      tripId: "TRIP005324",
      startingPoint: "Dallas",
      destination: "Denver",
      driver: "Chris Brown",
      numberOfStops: 3,
      startDate: new Date("2025-04-30"),
      truck: "Truck E",
      type: "unassigned",
    },
  ];

  const tripsCollection = collection(db, "trips");

  for (const trip of trips) {
    await addDoc(tripsCollection, trip);
  }

  console.log("Sample trips added to Firestore.");
};

addSampleTripsToFirestore();