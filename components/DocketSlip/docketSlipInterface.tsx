export interface LogisticsReceiptProps {
  receiptNumber?: string;
  date?: string;
  origin?: {
    name: string;
    company?: string;
    address?: string;
    city?: string;
    country?: string;
    tin?: string;
    mobileNo?: string;
    dated?: string;
    truckNo?: string;
  };
  destination?: {
    name: string;
    company?: string;
    address?: string;
    city?: string;
    country?: string;
    tin?: string;
    mobileNo?: string;
    dated?: string;
    truckNo?: string;
  };
  packages?: {
    count: number;
    packing: string;
    dimensions: string;
    actualWeight: string;
    chargedWeight?: string;
  };
  gstInfo?: {
    pan: string;
    gstin: string;
    transporterId: string;
    gstinTaxPayableInfo: string[];
  };
  billInfo?: {
    billNo: string;
    value: string;
    paymentMode: 'PAID' | 'TO PAY' | 'CREDIT';
  };
  charges?: {
    freightCharge?: string;
    serTax?: string;
    labourCharge?: string;
    grCharge?: string;
    handlingCharge?: string;
    subTotal?: string;
    total?: string;
    grandTotal?: string;
  };
}