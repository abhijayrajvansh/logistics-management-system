import { LogisticsReceiptProps } from "./docketSlipInterface";

const dataJson: LogisticsReceiptProps = {
  receiptNumber: "1047256",
  date: "31/03/25",
  origin: {
    name: "G.Mobile Devices",
    company: "Pvt",
  },
  destination: {
    name: "Shri Shyam Mobiles",
    country: "Baddi",
  },
  packages: {
    count: 6,
    packing: "Box",
    dimensions: "GHP258159",
    actualWeight: "25",
  },
  gstInfo: {
    pan: "APJPB6449Q",
    gstin: "02APJPB6449Q1ZK",
    transporterId: "88APJPB6449Q1ZI",
    gstinTaxPayableInfo: [
      "GSTIN Tax Payable by Consignor",
      "GSTIN Tax Payable by Consignee",
      "GSTIN Tax Payable by Transporter",
      "GSTIN Tax Not Payable",
    ],
  },
  billInfo: {
    billNo: "36482",
    value: "",
    paymentMode: "PAID",
  },
  charges: {
    grandTotal: "",
  },
};

export default dataJson;
