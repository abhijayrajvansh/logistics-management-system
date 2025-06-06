'use client';

import { SectionCards } from '@/components/section-cards';
import AnalyticsChart from '../../AnalyticsChart';
import { SiteHeader } from '../../site-header';
import { PermissionGate } from '@/components/PermissionGate';

export default function AdminDashboard() {
  return (
    <PermissionGate
      feature="FEATURE_DASHBOARD_VIEW"
      fallback={
        <div className="p-8 text-center">You don't have permission to view the dashboard.</div>
      }
    >
      <SiteHeader title="Dashboard" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1">
                <div className="px-6 lg:px-8 my-5">
                  <h1 className="text-3xl font-semibold">Real Time Analytics</h1>
                  <p className="text-[14px] text-black/70 mt-1">
                    analyse all your data in real time.
                  </p>
                </div>
                <SectionCards />
                <div className="mt-4">
                  <AnalyticsChart />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
