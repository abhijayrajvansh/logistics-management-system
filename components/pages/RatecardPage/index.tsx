import React from 'react'
import ClientsPage from '../ClientsPage'
import { SiteHeader } from '@/components/site-header'
import ReceiversPage from '../ReceiversPage'
import TATsPage from '../TATsPage'
import { PermissionGate } from '@/components/PermissionGate'

const RatecardPage = () => {
  return (
    <PermissionGate 
      feature="FEATURE_RATECARD_VIEW"
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-600 mt-2">You don't have permission to view ratecard.</p>
          </div>
        </div>
      }
    >
      <SiteHeader title='Rate Card'/>
      <ClientsPage />
      <ReceiversPage />
      <TATsPage />
    </PermissionGate>
  )
}

export default RatecardPage