'use client';

import { Button } from '../ui/button';
import DocketSlipUI from './DocketSlipUI';
import { IoArrowBack } from 'react-icons/io5';

const PrintDocketSlips = () => {
  const docketIds: string[] = ['22GOnsYWohFlnSbstXNo'];

  const handlePrint = () => {
    const printContainer = document.querySelector('.print-container');
    if (printContainer) {
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContainer.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // Reload to restore the original content
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="relative">
      {docketIds.length > 0 ? (
        <div className="flex justify-end p-4">
          <Button onClick={handlePrint}>Print</Button>
        </div>
      ) : (
        <></>
      )}
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

        {docketIds.length > 0 ? (
          docketIds.map((docketId) => <DocketSlipUI key={docketId} />)
        ) : (
          <div className="flex items-center justify-center h-screen">
            <Button onClick={handleGoBack} variant={'outline'}>
              <IoArrowBack />
              Go Back To Orders
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintDocketSlips;
