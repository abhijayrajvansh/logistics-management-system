// Mock shipper data with associated default values
export interface ShipperData {
  id: string;
  name: string;
  defaultReceiverDetails: string;
  defaultChargeBasis: "Weight" | "Volume" | "Fixed";
  defaultTAT: string; // Format as YYYY-MM-DD for date inputs
  clientDetails: string;
}

export const shippers: ShipperData[] = [
  {
    id: "shipper-1",
    name: "ABC Logistics",
    defaultReceiverDetails: "XYZ Distribution Center, Mumbai",
    defaultChargeBasis: "Weight",
    defaultTAT: "2025-05-08", // 7 days from current date
    clientDetails: "Regular client, priority shipping",
  },
  {
    id: "shipper-2",
    name: "QuickShip Express",
    defaultReceiverDetails: "FastTrack Warehousing, Delhi",
    defaultChargeBasis: "Volume",
    defaultTAT: "2025-05-06", // 5 days from current date
    clientDetails: "Premium client, express delivery",
  },
  {
    id: "shipper-3",
    name: "Global Freight Ltd",
    defaultReceiverDetails: "International Cargo Hub, Chennai",
    defaultChargeBasis: "Fixed",
    defaultTAT: "2025-05-15", // 14 days from current date
    clientDetails: "International shipping partner",
  },
  {
    id: "shipper-4",
    name: "Swift Transport Co.",
    defaultReceiverDetails: "Regional Distribution Center, Bangalore",
    defaultChargeBasis: "Weight",
    defaultTAT: "2025-05-05", // 4 days from current date
    clientDetails: "Local distributor, standard rates apply",
  },
  {
    id: "shipper-5",
    name: "Prime Movers Inc.",
    defaultReceiverDetails: "Nationwide Warehousing Solutions, Kolkata",
    defaultChargeBasis: "Volume",
    defaultTAT: "2025-05-10", // 9 days from current date
    clientDetails: "Long-term contract, bulk shipments",
  },
];
