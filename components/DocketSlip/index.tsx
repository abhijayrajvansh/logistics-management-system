'use client';

import DocketSlipUI from './DocketSlipUI';

const PrintDocketSlips = () => {
  const docketIds = ['1167447', '1829264'];

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
              transform: scale(1);
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

        {docketIds.map((docketId) => (
          <DocketSlipUI
            key={docketId}
            docketId={docketId}
          />
        ))}
      </div>
    </div>
  );
};

export default PrintDocketSlips;
