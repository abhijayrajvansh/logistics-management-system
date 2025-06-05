import React from 'react'
import ClientsPage from '../ClientsPage'
import { SiteHeader } from '@/components/site-header'
import ReceiversPage from '../ReceiversPage'
import TATsPage from '../TATsPage'

const RatecardPage = () => {
  return (
    <>
    <SiteHeader title='Rate Card'/>
    <ClientsPage />
    <ReceiversPage />
    <TATsPage />
    </>
  )
}

export default RatecardPage