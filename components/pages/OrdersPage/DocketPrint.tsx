'use client';

import React, { useState } from 'react';

interface LogisticsReceiptProps {
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

const LogisticsReceipt: React.FC<LogisticsReceiptProps> = ({
  receiptNumber = '1047256',
  date = '31/03/25',
  origin = {
    name: 'G.Mobile Devices',
    company: 'Pvt',
  },
  destination = {
    name: 'Shri Shyam Mobiles',
    country: 'Baddi',
  },
  packages = {
    count: 6,
    packing: 'Box',
    dimensions: 'GHP258159',
    actualWeight: '25',
  },
  gstInfo = {
    pan: 'APJPB6449Q',
    gstin: '02APJPB6449Q1ZK',
    transporterId: '88APJPB6449Q1ZI',
    gstinTaxPayableInfo: [
      'GSTIN Tax Payable by Consignor',
      'GSTIN Tax Payable by Consignee',
      'GSTIN Tax Payable by Transporter',
      'GSTIN Tax Not Payable',
    ],
  },
  billInfo = {
    billNo: '36482',
    value: '',
    paymentMode: 'PAID' as const,
  },
  charges = {
    grandTotal: '',
  },
}) => {
  const [selectedTransport, setSelectedTransport] = useState<'AIR' | 'TRAIN' | 'ROAD' | null>(null);
  const [selectedShipmentType, setSelectedShipmentType] = useState<{
    international: { dox: boolean; nonDox: boolean };
    domestic: { dox: boolean; nonDox: boolean };
  }>({
    international: { dox: false, nonDox: false },
    domestic: { dox: false, nonDox: false },
  });

  const handlePrint = () => {
    const printContent = document.querySelector('.print-container');
    const printTab = window.open('', '_blank');

    if (printTab && printContent) {
      printTab.document.write(`
        <html>
          <head>
            <title>Print Logistics Receipt</title>
            <style>
              @media print {
                @page {
                  size: A4;
                  margin: 0;
                }
                .print-container {
                  width: 100%;
                  height: auto;
                  min-height: 120mm;  /* Increased height to prevent cropping */
                  page-break-after: always;
                  overflow: visible;  /* Changed from hidden to visible */
                }
                .receipt-content {
                  width: 100%;
                  transform-origin: top left;
                  transform: scale(1);  /* Full scale to use entire width */
                  margin: 0;
                  padding: 8px;
                }
                body {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                }
              }
              /* Copy all existing styles */
              body { margin: 0; padding: 20px; }
              ${Array.from(document.styleSheets)
                .map((sheet) => {
                  try {
                    return Array.from(sheet.cssRules)
                      .map((rule) => rule.cssText)
                      .join('\n');
                  } catch {
                    return '';
                  }
                })
                .join('\n')}
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
          </body>
        </html>
      `);
      printTab.document.close();
      printTab.focus();
      setTimeout(() => {
        printTab.print();
      }, 250);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handlePrint}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors fixed top-4 right-4 z-10"
      >
        Print Receipt
      </button>
      <div className="print-container">
        {/* Print styles */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            .print-container {
              width: 100%;
              height: auto;
              min-height: 120mm; /* Increased height to prevent cropping */
              page-break-after: always;
              overflow: visible; /* Changed from hidden to visible */
            }
            .receipt-content {
              width: 100%;
              transform-origin: top left;
              transform: scale(1); /* Full scale to use entire width */
              margin: 0;
              padding: 8px;
            }
            body {
              margin: 0;
              padding: 0;
              width: 100%;
            }
          }
        `}</style>

        <div className="receipt-content bg-white border border-gray-300 p-2 font-sans text-[8px]">
          <div className="border border-black">
            {/* Header Row */}
            <div className="flex border-b border-black">
              {/* Logo and Company Info - Further reduced size */}
              <div className="w-1/4 border-r border-black p-0.5">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-900 flex items-center justify-center text-white">
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold">JAI'Z</span>
                      </div>
                      <div className="absolute bottom-0 w-full text-center text-[6px]">
                        Logistics Inc
                      </div>
                    </div>
                  </div>
                  <div className="ml-1">
                    <div className="text-red-600 font-bold text-[10px]">JAI'Z LOGISTICS INC.</div>
                    <div className="text-[6px]">
                      Jaiz Logistics Park, Near Mount Carmel School
                      <br />
                      Rakkar Colony - Una HP - 174303
                      <br />
                      Mob.: +91 98169 01111, 98051 01111
                      <br />
                      Website: www.jaizlogistics.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Rest of the header with reduced padding */}
              <div className="w-1/4 border-r border-black p-0.5">
                <div className="text-center font-bold text-[10px]">INTERNATIONAL</div>
                <div className="flex justify-around mt-0.5">
                  <div className="flex items-center">
                    <div className="border border-black w-2.5 h-2.5 mr-0.5"></div>
                    <span className="text-[6px]">DOX</span>
                  </div>
                  <div className="flex items-center">
                    <div className="border border-black w-2.5 h-2.5 mr-0.5"></div>
                    <span className="text-[6px]">NON-DOX</span>
                  </div>
                </div>
                <div className="text-center font-bold text-[10px] mt-0.5">DOMESTIC</div>
                <div className="flex justify-around mt-0.5">
                  <div className="flex items-center">
                    <div className="border border-black w-2.5 h-2.5 mr-0.5"></div>
                    <span className="text-[6px]">DOX</span>
                  </div>
                  <div className="flex items-center">
                    <div className="border border-black w-2.5 h-2.5 mr-0.5"></div>
                    <span className="text-[6px]">NON-DOX</span>
                  </div>
                </div>
              </div>

              <div className="w-1/4 border-r border-black p-0.5">
                <div className="text-center font-bold text-[10px] mb-0.5">MODE OF TRANSPORT</div>
                <div className="flex justify-around">
                  <div className="flex items-center">
                    <div className="border border-black w-2.5 h-2.5 mr-0.5"></div>
                    <span className="text-[6px]">AIR</span>
                  </div>
                  <div className="flex items-center">
                    <div className="border border-black w-2.5 h-2.5 mr-0.5"></div>
                    <span className="text-[6px]">TRAIN</span>
                  </div>
                  <div className="flex items-center">
                    <div className="border border-black w-2.5 h-2.5 mr-0.5"></div>
                    <span className="text-[6px]">ROAD</span>
                  </div>
                </div>
              </div>

              <div className="w-1/4 p-0.5 flex flex-col justify-center items-center">
                <div className="text-base font-bold">{receiptNumber}</div>
                <div className="mt-0.5 w-full flex justify-between">
                  <div className="text-red-600 text-[6px]">DATE</div>
                  <div className="border-b border-black px-1 text-[8px]">{date}</div>
                </div>
              </div>
            </div>

            {/* Origin and Destination - Reduced padding */}
            <div className="flex">
              <div className="w-1/2 border-r border-black">
                <div className="bg-gray-100 border-b border-black px-1 py-0.5">
                  <span className="font-bold text-[8px]">ORIGIN</span>
                </div>
                <div className="p-1">
                  <div className="mb-1">
                    <span className="text-xs align-top">From (Shipper's Name)</span>
                    <span className="border-b border-black w-full inline-block ml-1">
                      {origin.name}
                    </span>
                  </div>
                  <div className="mb-1">
                    <span className="text-xs">Company</span>
                    <span className="border-b border-black w-full inline-block ml-1">
                      {origin.company}
                    </span>
                  </div>
                  <div className="mb-1">
                    <span className="text-xs">Address</span>
                    <span className="border-b border-black w-full inline-block ml-1">
                      {origin.address || ''}
                    </span>
                  </div>
                  <div className="mb-1 flex">
                    <div className="flex-1">
                      <span className="text-xs">City</span>
                      <span className="border-b border-black w-3/4 inline-block ml-1">
                        {origin.city || ''}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs">Country</span>
                      <span className="border-b border-black w-3/4 inline-block ml-1">
                        {origin.country || ''}
                      </span>
                    </div>
                  </div>
                  <div className="mb-1">
                    <span className="text-xs">Tin</span>
                    <span className="border-b border-black w-full inline-block ml-1">
                      {origin.tin || ''}
                    </span>
                  </div>
                  <div className="mb-1 flex">
                    <div className="flex-1">
                      <span className="text-xs">Mobile No</span>
                      <span className="border-b border-black w-3/4 inline-block ml-1">
                        {origin.mobileNo || ''}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs">Dated</span>
                      <span className="border-b border-black w-3/4 inline-block ml-1">
                        {origin.dated || ''}
                      </span>
                    </div>
                  </div>
                  <div className="mb-1">
                    <span className="text-xs">Truck No.</span>
                    <span className="border-b border-black w-full inline-block ml-1">
                      {origin.truckNo || ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-1/2">
                <div className="flex">
                  <div className="bg-gray-100 border-b border-r border-black px-1 py-0.5 w-full">
                    <span className="text-red-600 font-bold text-[8px]">DESTINATION</span>
                  </div>
                  <div className="bg-gray-100 border-b border-black px-1 py-0.5 w-24 text-center">
                    <span className="text-red-600 font-bold text-[8px]">CHARGES</span>
                  </div>
                  <div className="bg-gray-100 border-b border-black px-1 py-0.5 w-20 text-center">
                    <span className="text-red-600 font-bold text-[8px]">AMOUNT</span>
                  </div>
                </div>
                <div className="flex">
                  <div className="p-1 w-full border-r border-black">
                    <div className="mb-1">
                      <span className="text-xs align-top">To (Receiver's Name)</span>
                      <span className="border-b border-black w-full inline-block ml-1">
                        {destination.name}
                      </span>
                    </div>
                    <div className="mb-1">
                      <span className="text-xs">Company</span>
                      <span className="border-b border-black w-full inline-block ml-1">
                        {destination.company || ''}
                      </span>
                    </div>
                    <div className="mb-1">
                      <span className="text-xs">Address</span>
                      <span className="border-b border-black w-full inline-block ml-1">
                        {destination.address || ''}
                      </span>
                    </div>
                    <div className="mb-1 flex">
                      <div className="flex-1">
                        <span className="text-xs">City</span>
                        <span className="border-b border-black w-3/4 inline-block ml-1">
                          {destination.city || ''}
                        </span>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs">Country</span>
                        <span className="border-b border-black w-3/4 inline-block ml-1">
                          {destination.country}
                        </span>
                      </div>
                    </div>
                    <div className="mb-1">
                      <span className="text-xs">Tin</span>
                      <span className="border-b border-black w-full inline-block ml-1">
                        {destination.tin || ''}
                      </span>
                    </div>
                    <div className="mb-1 flex">
                      <div className="flex-1">
                        <span className="text-xs">Mobile No</span>
                        <span className="border-b border-black w-3/4 inline-block ml-1">
                          {destination.mobileNo || ''}
                        </span>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs">Dated</span>
                        <span className="border-b border-black w-3/4 inline-block ml-1">
                          {destination.dated || ''}
                        </span>
                      </div>
                    </div>
                    <div className="mb-1">
                      <span className="text-xs">Truck No.</span>
                      <span className="border-b border-black w-full inline-block ml-1">
                        {destination.truckNo || ''}
                      </span>
                    </div>
                  </div>
                  <div className="w-24 border-r border-black">
                    <div className="border-b border-black p-0.5">
                      <div className="text-xs font-bold">FREIGHT CHARGE</div>
                    </div>
                    <div className="border-b border-black p-0.5">
                      <div className="text-xs font-bold">SER. TAX</div>
                    </div>
                    <div className="border-b border-black p-0.5">
                      <div className="text-xs font-bold">LABOUR CHARGE</div>
                    </div>
                    <div className="border-b border-black p-0.5">
                      <div className="text-xs font-bold">G. R. CHARGE</div>
                    </div>
                    <div className="border-b border-black p-0.5">
                      <div className="text-xs font-bold">HANDLING CHARGE</div>
                    </div>
                    <div className="border-b border-black p-0.5">
                      <div className="text-xs font-bold">SUB -TOTAL</div>
                    </div>
                    <div className="border-b border-black p-0.5">
                      <div className="text-xs font-bold">TOTAL</div>
                    </div>
                    <div className="p-0.5">
                      <div className="text-xs font-bold">GRAND TOTAL</div>
                    </div>
                  </div>
                  <div className="w-20 flex flex-col"></div>
                  <div className="border-b border-black p-0.5 h-8 flex">
                    <div className="border-r border-black w-8 text-center">Rs.</div>
                    <div className="w-8 text-center">P.</div>
                  </div>
                  <div className="border-b border-black p-0.5 h-6"></div>
                  <div className="border-b border-black p-0.5 h-6"></div>
                  <div className="border-b border-black p-0.5 h-6"></div>
                  <div className="border-b border-black p-0.5 h-6"></div>
                  <div className="border-b border-black p-0.5 h-6"></div>
                  <div className="border-b border-black p-0.5 h-6"></div>
                  <div className="p-0.5 h-6 relative">
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 font-bold text-2xl">
                      {charges.grandTotal || '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Package Details - Reduced padding */}
          <div className="border-t border-black">
            <div className="flex">
              <div className="w-16 border-r border-black p-0.5 text-center">
                <div className="text-[6px]">No. of Pkgs.</div>
                <div className="text-sm font-bold">{packages.count}</div>
              </div>
              <div className="w-16 border-r border-black p-0.5 text-center">
                <div className="text-[6px]">Packing</div>
                <div className="text-sm font-bold">{packages.packing}</div>
              </div>
              <div className="flex-1 border-r border-black p-0.5">
                <div className="text-[6px] text-center italic">Said to be Contain</div>
              </div>
              <div className="w-1/3 p-0.5">
                <div className="flex mb-0.5">
                  <div className="w-1/2 text-center text-[6px]">
                    Dimensions (Cms)
                    <br />
                    Length x Width x Height
                  </div>
                  <div className="w-1/4 text-center text-[6px]">
                    Actual
                    <br />
                    Weight
                  </div>
                  <div className="w-1/4 text-center text-[6px]">
                    Charged
                    <br />
                    Weight
                  </div>
                </div>
                <div className="flex mt-1">
                  <div className="w-1/2 text-center font-bold text-[8px]">
                    {packages.dimensions}
                  </div>
                  <div className="w-1/4 text-center font-bold text-[8px]">
                    {packages.actualWeight}
                  </div>
                  <div className="w-1/4 text-center font-bold text-[8px]">
                    {packages.chargedWeight || ''}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Section - Reduced padding */}
          <div className="flex border-t border-black">
            <div className="w-1/2 p-1 border-r border-black">
              <div className="text-[6px] mb-1">
                The goods of in this G.R. have booked AT OWNER'S RISK.
                <br />
                A carbon copy has been received by consignor is taken of all
                <br />
                terms & conditions. The company is not responsible for
                <br />
                leakage & breakage.
              </div>
              <div className="flex mt-2">
                <div className="w-1/3">
                  <div className="text-[6px]">Driver's Name</div>
                  <div className="mt-2 text-[6px]">Signature</div>
                </div>
                <div className="w-2/3 border border-black p-0.5">
                  <div className="font-bold text-[6px]">PAN : {gstInfo.pan}</div>
                  <div className="font-bold text-[6px]">GSTIN : {gstInfo.gstin}</div>
                  <div className="font-bold text-[6px]">
                    TRANSPORTER ID : {gstInfo.transporterId}
                  </div>
                  {gstInfo.gstinTaxPayableInfo.map((info, index) => (
                    <div key={index} className="font-bold text-[6px]">
                      {info}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-1/2">
              <div className="border-b border-black p-1">
                <div className="flex">
                  <div className="w-1/3 text-red-600 font-bold text-[8px]">DELIVERY AT</div>
                  <div className="w-1/3 text-red-600 font-bold text-[8px] text-center">
                    PAYMENT MODE
                  </div>
                  <div className="w-1/3"></div>
                </div>
                <div className="flex mt-2">
                  <div className="w-1/3">
                    <div className="flex items-center">
                      <div className="text-xs">Bill No</div>
                      <div className="ml-2 border-b border-black flex-1 text-center font-bold">
                        {billInfo.billNo}
                      </div>
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="text-xs">Value</div>
                      <div className="ml-2 border-b border-black flex-1 text-center font-bold">
                        {billInfo.value}
                      </div>
                    </div>
                  </div>
                  <div className="w-1/3 flex flex-col items-center justify-center">
                    <div className="flex items-center mb-2">
                      <div
                        className={`border border-black w-4 h-4 mr-1 ${billInfo.paymentMode === 'PAID' ? 'bg-black' : ''}`}
                      ></div>
                      <span>PAID</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <div
                        className={`border border-black w-4 h-4 mr-1 ${billInfo.paymentMode === 'TO PAY' ? 'bg-black' : ''}`}
                      ></div>
                      <span>TO PAY</span>
                    </div>
                    <div className="flex items-center">
                      <div
                        className={`border border-black w-4 h-4 mr-1 ${billInfo.paymentMode === 'CREDIT' ? 'bg-black' : ''}`}
                      ></div>
                      <span>CREDIT</span>
                    </div>
                  </div>
                  <div className="w-1/3"></div>
                </div>
              </div>
              <div className="p-1">
                <div className="font-bold">RECEIVED IN GOOD CONDITION</div>
                <div className="mt-2">
                  <div className="flex">
                    <div className="text-xs w-16">NAME :</div>
                    <div className="border-b border-black flex-1"></div>
                  </div>
                  <div className="flex mt-2">
                    <div className="text-xs w-16">MOB :</div>
                    <div className="border-b border-black flex-1"></div>
                  </div>
                  <div className="flex mt-2">
                    <div className="text-xs w-16">DATE :</div>
                    <div className="border-b border-black flex-1"></div>
                    <div className="text-xs w-24 ml-4">SIGNATURE</div>
                    <div className="border-b border-black w-32"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Received By Footer - Reduced padding */}
          <div className="border-t border-black p-1 flex justify-between items-center">
            <div className="font-bold text-red-600 text-[8px]">
              Received By : JAI'Z LOGISTICS INC.
            </div>
            <div className="flex">
              <div className="mr-2">
                <div className="mb-0.5 text-[6px]">Signature</div>
                <div className="mb-0.5 text-[6px]">Date :</div>
                <div className="text-[6px]">Time :</div>
              </div>
              <div className="border-b border-black h-4 w-24 relative">
                <div className="absolute -top-3 right-0 text-2xl font-bold">-</div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipper Copy Tag */}
        <div className="absolute top-0 right-0 -rotate-90 origin-bottom-right text-[6px] transform translate-y-6 -translate-x-1 bg-white px-1 border border-black">
          SHIPPER COPY
        </div>
      </div>
    </div>
  );
};

export default LogisticsReceipt;
