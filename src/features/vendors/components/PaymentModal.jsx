import { useState, useEffect, useMemo } from 'react'
import Modal from '@/components/common/Modal'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { formatNumber } from '@/utils/formatters'
import { calculateVendorSegmentDue } from '../vendor.api'

export default function PaymentModal({
  open,
  onClose,
  onSave,
  payment, // If editing
  vendors = [],
  services = [],
  bills = [],
  payments = [],
  initialVendorId,
}) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    vendorId: '',
    serviceId: '',
    billId: '',
    method: 'bank',
    account: '',
    amount: '',
    note: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Initialize or reset form
  useEffect(() => {
    if (payment) {
      setFormData({
        date: payment.date || new Date().toISOString().slice(0, 10),
        vendorId: payment.vendorId || '',
        serviceId: payment.serviceId || '',
        billId: payment.billId || '',
        method: payment.method || 'bank',
        account: payment.account || '',
        amount: payment.amount || '',
        note: payment.note || '',
      })
    } else {
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        vendorId: initialVendorId || (vendors[0]?.id || ''),
        serviceId: '',
        billId: '',
        method: 'bank',
        account: '',
        amount: '',
        note: '',
      })
    }
    setErrors({})
  }, [payment, open, initialVendorId, vendors])

  const availableVendors = useMemo(() => {
    return vendors.filter((v) => v.isActive || v.id === formData.vendorId)
  }, [vendors, formData.vendorId])

  const vendorServices = useMemo(() => {
    const selectedVendor = vendors.find((v) => v.id === formData.vendorId)
    if (!selectedVendor || !selectedVendor.services) return []
    return services.filter(
      (s) => selectedVendor.services.includes(s.id) && (s.isActive || s.id === formData.serviceId)
    )
  }, [vendors, services, formData.vendorId, formData.serviceId])

  // Auto-select first service if current service is not available
  useEffect(() => {
    if (vendorServices.length > 0 && !vendorServices.some((s) => s.id === formData.serviceId)) {
      setFormData((prev) => ({ ...prev, serviceId: vendorServices[0].id }))
    }
  }, [vendorServices, formData.serviceId])

  // Relevant bills for vendor & service
  const relevantBills = useMemo(() => {
    if (!formData.vendorId || !formData.serviceId) return []
    return bills.filter(
      (b) => b.vendorId === formData.vendorId && b.serviceId === formData.serviceId
    )
  }, [bills, formData.vendorId, formData.serviceId])

  // Calculate current segment due for advance warning
  const currentSegmentDue = useMemo(() => {
    if (!formData.vendorId || !formData.serviceId) return 0
    // Exclude current payment if editing
    const effectivePayments = payment
      ? payments.filter((p) => p.id !== payment.id)
      : payments
    const { due } = calculateVendorSegmentDue(
      formData.vendorId,
      formData.serviceId,
      bills,
      effectivePayments
    )
    return due
  }, [formData.vendorId, formData.serviceId, bills, payments, payment])

  const isExcessAdvance =
    Number(formData.amount) > 0 && Number(formData.amount) > currentSegmentDue

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.vendorId) newErrors.vendorId = 'Please select a vendor'
    if (!formData.serviceId) newErrors.serviceId = 'Please select a service'
    if (!formData.date) newErrors.date = 'Date is required'

    const numAmount = Number(formData.amount)
    if (!numAmount || numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    try {
      await onSave({
        ...formData,
        amount: numAmount,
      })
      onClose()
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save payment' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={payment ? `Edit Payment (${payment.voucherNo})` : 'Record Vendor Payment'}
      description="Record an outbound payment to a vendor against a specific service segment."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="payment-form"
            disabled={saving}
            className="bg-primary text-white hover:bg-primary-strong"
          >
            {saving ? 'Saving...' : payment ? 'Update Payment' : 'Record Payment'}
          </Button>
        </div>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {errors.form}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Vendor */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Vendor <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.vendorId}
              onChange={(e) => handleChange('vendorId', e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select Vendor</option>
              {availableVendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.vendorCode})
                </option>
              ))}
            </select>
            {errors.vendorId && <p className="text-xs text-rose-500 mt-1">{errors.vendorId}</p>}
          </div>

          {/* Service / Segment */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Service / Segment <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.serviceId}
              onChange={(e) => handleChange('serviceId', e.target.value)}
              disabled={!formData.vendorId || vendorServices.length === 0}
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              {vendorServices.length === 0 ? (
                <option value="">No services linked to vendor</option>
              ) : (
                vendorServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
            {errors.serviceId && <p className="text-xs text-rose-500 mt-1">{errors.serviceId}</p>}
          </div>
        </div>

        {/* Current Due Info Banner */}
        {formData.vendorId && formData.serviceId && (
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/80 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current Segment Due:</span>
            <span
              className={
                currentSegmentDue > 0
                  ? 'font-bold text-rose-600'
                  : currentSegmentDue < 0
                  ? 'font-bold text-blue-600'
                  : 'font-bold text-emerald-600'
              }
            >
              {currentSegmentDue > 0
                ? `৳${formatNumber(currentSegmentDue)} Due`
                : currentSegmentDue < 0
                ? `৳${formatNumber(Math.abs(currentSegmentDue))} Advance`
                : '৳0 Settled'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Payment Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.date && <p className="text-xs text-rose-500 mt-1">{errors.date}</p>}
          </div>

          {/* Optional Bill Link */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Link to Bill (Optional)
            </label>
            <select
              value={formData.billId}
              onChange={(e) => handleChange('billId', e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">General payment (No specific bill)</option>
              {relevantBills.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.billNo} — ৳{formatNumber(b.amount)} ({b.invoiceRef || b.date})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Payment Method
            </label>
            <select
              value={formData.method}
              onChange={(e) => handleChange('method', e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="bank">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="bkash">bKash</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          {/* Account */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Account / Reference Details
            </label>
            <input
              type="text"
              placeholder="e.g. City Bank 1089 / 017..."
              value={formData.account}
              onChange={(e) => handleChange('account', e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Amount (BDT) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-sm text-muted-foreground font-semibold">
              ৳
            </span>
            <input
              type="number"
              min="0.01"
              step="any"
              placeholder="20,000"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="w-full h-9 pl-7 pr-3 text-sm rounded-lg border border-border bg-surface text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>}
        </div>

        {/* Advance Warning Callout (Section 4.5 & 11) */}
        {isExcessAdvance && (
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg flex items-start gap-2.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold">Advance Warning</p>
              <p className="mt-0.5">
                Payment amount (৳{formatNumber(formData.amount)}) is greater than the current due
                for this segment (৳{formatNumber(currentSegmentDue)}). The excess of ৳
                {formatNumber(Number(formData.amount) - currentSegmentDue)} will become an Advance.
              </p>
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Note / Remarks
          </label>
          <textarea
            rows={2}
            placeholder="Payment remarks or reference..."
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            className="w-full p-2.5 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </form>
    </Modal>
  )
}
