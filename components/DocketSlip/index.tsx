"use client";

import DocketSlip from "./docket-slip";

const LogisticsReceipt = () => {
  return (
    <div className="relative">
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
              page-break-after: always;
              overflow: visible;
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

        <DocketSlip />
      </div>
    </div>
  );
};

export default LogisticsReceipt;
