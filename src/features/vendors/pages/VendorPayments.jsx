import { useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import VendorPaymentsPanel from '../components/VendorPaymentsPanel'
import { vendorApi } from '../vendor.api'

// Every payment to a vendor.
export default function VendorPayments() {
  const [vendors, setVendors] = useState([])
  useEffect(() => {
    vendorApi.listVendors({ pageSize: 500 }).then((result) => setVendors(result.items)).catch(() => setVendors([]))
  }, [])

  return (
    <div className="stack">
      <PageHeader title="Vendor payments" description="What we paid vendors, and the advances we paid ahead." breadcrumbs={[{ label: 'Vendors', to: '/vendors' }, { label: 'Payments' }]} />
      <div className="card">
        <VendorPaymentsPanel vendors={vendors} />
      </div>
    </div>
  )
}
