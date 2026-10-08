import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus, Receipt, CreditCard, RotateCcw } from 'lucide-react'

import { vendorApi } from '../vendor.api'
import FilterBar from '../components/FilterBar'
import SummaryCards from '../components/SummaryCards'
import DueByVendorTable from '../components/DueByVendorTable'
import DueBySegmentTable from '../components/DueBySegmentTable'
import DueMatrixTable from '../components/DueMatrixTable'
import BillModal from '../components/BillModal'
import PaymentModal from '../components/PaymentModal'

export default function VendorDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    summary: {},
    byVendor: [],
    bySegment: [],
    matrix: { segments: [], rows: [], columnTotals: {}, grandTotal: 0 },
  })
  const [vendorsList, setVendorsList] = useState([])
  const [servicesList, setServicesList] = useState([])
  const [billsList, setBillsList] = useState([])
  const [paymentsList, setPaymentsList] = useState([])

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    vendorId: 'all',
    serviceId: 'all',
    onlyDue: false,
  })

  // Modals
  const [billModalOpen, setBillModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [targetVendorId, setTargetVendorId] = useState(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, vRes, sRes, bRes, pRes] = await Promise.all([
        vendorApi.getDashboardData(filters),
        vendorApi.getVendors(),
        vendorApi.getServices(),
        vendorApi.getBills(),
        vendorApi.getPayments(),
      ])

      if (dashRes.success) {
        setData({
          summary: dashRes.summary,
          byVendor: dashRes.byVendor,
          bySegment: dashRes.bySegment,
          matrix: dashRes.matrix,
        })
      }
      if (vRes.success) setVendorsList(vRes.data)
      if (sRes.success) setServicesList(sRes.data)
      if (bRes.success) setBillsList(bRes.data)
      if (pRes.success) setPaymentsList(pRes.data)
    } catch (err) {
      console.error('Failed to load vendor dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleResetFilters = () => {
    setFilters({
      from: '',
      to: '',
      vendorId: 'all',
      serviceId: 'all',
      onlyDue: false,
    })
  }

  const handleAddPaymentForVendor = (vId) => {
    setTargetVendorId(vId)
    setPaymentModalOpen(true)
  }

  const handleSaveBill = async (billData) => {
    await vendorApi.createBill(billData)
    loadDashboard()
  }

  const handleSavePayment = async (paymentData) => {
    await vendorApi.createPayment(paymentData)
    loadDashboard()
  }

  const handleResetDemoData = async () => {
    if (window.confirm('Reset vendor data back to the default documentation test sample?')) {
      await vendorApi.resetToSeedData()
      loadDashboard()
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Dashboard"
        description="Monitor vendor payables, segment disbursements, and cross-matrix due analytics."
        breadcrumbs={[
          { label: 'Vendors', to: '/vendors' },
          { label: 'Dashboard' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDemoData}
              className="text-xs text-muted-foreground gap-1.5 h-9 bg-white"
              title="Reset data back to spec test data"
            >
              <RotateCcw className="size-3.5" /> Reset Demo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setTargetVendorId(null)
                setBillModalOpen(true)
              }}
              className="text-xs gap-1.5 h-9 bg-white"
            >
              <Receipt className="size-3.5 text-amber-600" /> Record Bill
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setTargetVendorId(null)
                setPaymentModalOpen(true)
              }}
              className="text-xs gap-1.5 h-9 bg-white"
            >
              <CreditCard className="size-3.5 text-emerald-600" /> Record Payment
            </Button>
            <Link to="/vendors/new">
              <Button size="sm" className="bg-primary text-white hover:bg-primary-strong text-xs gap-1.5 h-9">
                <Plus className="size-3.5" /> Add Vendor
              </Button>
            </Link>
          </div>
        }
      />

      {/* Global Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        vendors={vendorsList}
        services={servicesList}
        showDueToggle={true}
      />

      {/* 5.1 Summary Cards */}
      <SummaryCards summary={data.summary} />

      {/* 5.2 Table A: Due by Vendor */}
      <DueByVendorTable
        data={data.byVendor}
        onAddPayment={handleAddPaymentForVendor}
        loading={loading}
      />

      <div className="grid grid-cols-1 gap-6">
        {/* 5.3 Table B: Due by Segment */}
        <DueBySegmentTable data={data.bySegment} loading={loading} />

        {/* 5.4 Table C: Vendor × Segment Matrix */}
        <DueMatrixTable matrix={data.matrix} loading={loading} />
      </div>

      {/* Modals */}
      <BillModal
        open={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        onSave={handleSaveBill}
        vendors={vendorsList}
        services={servicesList}
        initialVendorId={targetVendorId}
      />

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSave={handleSavePayment}
        vendors={vendorsList}
        services={servicesList}
        bills={billsList}
        payments={paymentsList}
        initialVendorId={targetVendorId}
      />
    </div>
  )
}
