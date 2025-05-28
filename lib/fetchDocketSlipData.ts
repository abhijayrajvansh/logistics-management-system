import { db } from '@/firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { DocketPayloadProps } from '@/components/DocketSlip/docketSlipInterface';

/**
 * Transforms Firestore data to DocketPayloadProps format
 */
const transformDocketData = (data: any): DocketPayloadProps => {
  return {
    receiptNumber: data.docket_id,
    date: data.created_at
      ? new Date(data.created_at.seconds * 1000).toLocaleDateString()
      : undefined,
    origin: {
      name: data.client_details || '',
      company: data.client_details || '',
      address: data.current_location || '',
      city: data.previous_center_location !== 'NA' ? data.previous_center_location : '',
      country: 'India',
    },
    destination: {
      name: data.receiver_name || '',
      company: data.receiver_details || '',
      address: data.current_location || '',
      city: data.receiver_city || '',
      country: 'India',
      mobileNo: data.receiver_contact || '',
    },
    packages: {
      count: data.total_boxes_count || 0,
      packing: 'Standard',
      dimensions: data.dimensions || '',
      actualWeight: data.total_order_weight?.toString() || '0',
      chargedWeight: data.total_order_weight?.toString() || '0',
    },
    gstInfo: {
      pan: 'XXXXXXXXXXXXX', // Default value as it's not in source data
      gstin: data.GST || 'NA',
      transporterId: data.lr_no || '',
      gstinTaxPayableInfo: [data.GST_amount || 'NA'],
    },
    billInfo: {
      billNo: data.lr_no || '',
      value: data.total_price?.toString() || '0',
      paymentMode: transformPaymentMode(data.payment_mode),
    },
    charges: {
      freightCharge: data.calculated_price?.toString() || '0',
      serTax: data.GST === 'Excluded' ? '0' : data.GST_amount || '0',
      labourCharge: '0',
      grCharge: data.docket_price?.toString() || '0',
      handlingCharge: '0',
      subTotal: data.calculated_price?.toString() || '0',
      total: data.total_price?.toString() || '0',
      grandTotal: data.total_price?.toString() || '0',
    },
  };
};

/**
 * Transforms payment mode to match DocketPayloadProps format
 */
const transformPaymentMode = (mode: string): 'PAID' | 'TO PAY' | 'CREDIT' => {
  switch (mode?.toLowerCase()) {
    case 'cash':
      return 'PAID';
    case 'credit':
      return 'CREDIT';
    default:
      return 'TO PAY';
  }
};

/**
 * Fetches complete order details from the orders collection using docket ID
 * @param docketId - The unique identifier of the order/docket
 * @returns Promise containing the order data with its ID
 */
export const fetchDocketSlipData = async (docketId: string): Promise<DocketPayloadProps> => {
  try {
    // Get the order document reference
    const orderRef = doc(db, 'orders', docketId);

    // Fetch the order document
    const orderSnapshot = await getDoc(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error(`Order with docket ID ${docketId} not found`);
    }

    // Transform the data to match DocketPayloadProps interface
    const transformedData = transformDocketData(orderSnapshot.data());

    return transformedData;
  } catch (error) {
    console.error('Error fetching docket slip data:', error);
    throw error;
  }
};
