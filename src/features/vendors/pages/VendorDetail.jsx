import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import StatCard from '../../../components/charts/StatCard'
import VendorFormModal from '../components/VendorFormModal'
import VendorBillsPanel from '../components/VendorBillsPanel'
import VendorPaymentsPanel from '../components/VendorPaymentsPanel'
import { vendorApi } from '../vendor.api'
import { usePermission } from '../../../hooks/usePermission'
import { useToast } from '../../../context/ToastContext'
import { PERMISSIONS } from '../../../utils/permissions'
import { errorMessage } from '../../../utils/errors'
import { formatCurrency, formatDate } from '../../../utils/formatters'

export default function VendorDetail() {
  const { id } = useParams()
  const toast = useToast()
  const { can } = usePermission()
  const [vendor, setVendor] = useState(null)
  const [tab, setTab] = useState('bills')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      setVendor(await vendorApi.getVendor(id))
    } catch (failure) {
      setError(failure)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Loader fullPage label="Loading vendor…" />
  if (error) return <ErrorState title="Could not load this vendor" message={errorMessage(error)} onRetry={load} />

  const vendors = [vendor]

  return (
    <div className="stack">
      <PageHeader
        title={vendor.name}
        description={`${vendor.code}${vendor.contactPerson ? ` · ${vendor.contactPerson}` : ''}`}
        breadcrumbs={[{ label: 'Vendors', to: '/vendors' }, { label: vendor.name }]}
        actions={
          <>
            <Link to="/vendors"><Button variant="ghost">Back</Button></Link>
            {can(PERMISSIONS.VENDOR_MANAGE) ? <Button onClick={() => setEditing(true)}>Edit</Button> : null}
          </>
        }
      />

      <div className="grid grid--4">
        <StatCard label="Billed" value={formatCurrency(vendor.billed, 'BDT')} />
        <StatCard label="Paid" value={formatCurrency(vendor.paid, 'BDT')} />
        <StatCard label="We owe" value={formatCurrency(vendor.due, 'BDT')} hint={vendor.overdue > 0 ? `${formatCurrency(vendor.overdue, 'BDT')} overdue` : undefined} />
        <StatCard label="Paid ahead" value={formatCurrency(vendor.advance, 'BDT')} />
      </div>

      <div className="card">
        <dl className="detail-list">
          <div><dt>Status</dt><dd><Badge tone={vendor.active ? 'success' : 'neutral'}>{vendor.active ? 'Active' : 'Switched off'}</Badge></dd></div>
          <div><dt>Phone</dt><dd>{vendor.phone || '—'}</dd></div>
          <div><dt>Email</dt><dd>{vendor.email || '—'}</dd></div>
          <div><dt>Address</dt><dd>{vendor.address || '—'}</dd></div>
          <div><dt>Credit limit</dt><dd>{vendor.creditLimit ? formatCurrency(vendor.creditLimit, 'BDT') : 'Not set'}</dd></div>
          <div><dt>Since</dt><dd>{formatDate(vendor.since ?? vendor.createdAt)}</dd></div>
          {vendor.notes ? <div><dt>Notes</dt><dd>{vendor.notes}</dd></div> : null}
        </dl>
      </div>

      <div className="card stack">
        <div className="row" style={{ gap: 8 }}>
          <Button variant={tab === 'bills' ? 'primary' : 'ghost'} onClick={() => setTab('bills')}>Bills</Button>
          <Button variant={tab === 'payments' ? 'primary' : 'ghost'} onClick={() => setTab('payments')}>Payments</Button>
        </div>
        {tab === 'bills' ? <VendorBillsPanel vendors={vendors} vendorId={vendor.id} onChanged={load} /> : <VendorPaymentsPanel vendors={vendors} vendorId={vendor.id} onChanged={load} />}
      </div>

      <VendorFormModal open={editing} vendor={vendor} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); toast.success('Vendor saved.'); load() }} />
    </div>
  )
}
