import { useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import VendorBillsPanel from '../components/VendorBillsPanel'
import { vendorApi } from '../vendor.api'

// Every vendor bill. The vendors are read here once, for the "new bill" form.
export default function VendorBills() {
  const [vendors, setVendors] = useState([])
  useEffect(() => {
    vendorApi.listVendors({ pageSize: 500 }).then((result) => setVendors(result.items)).catch(() => setVendors([]))
  }, [])

  return (
    <div className="stack">
      <PageHeader title="Vendor bills" description="What vendors billed us." breadcrumbs={[{ label: 'Vendors', to: '/vendors' }, { label: 'Bills' }]} />
      <div className="card">
        <VendorBillsPanel vendors={vendors} />
      </div>
    </div>
  )
}
