import { useState, useEffect, useMemo } from 'react'
import Modal from '@/components/common/Modal'
import { Button } from '@/components/ui/button'

export default function BillModal({
  open,
  onClose,
  onSave,
  bill, // If editing
  vendors = [],
  services = [],
  initialVendorId,
}) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    vendorId: '',
    serviceId: '',
    invoiceRef: '',
    amount: '',
    note: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Initialize or reset form
  useEffect(() => {
    if (bill) {
      setFormData({
        date: bill.date || new Date().toISOString().slice(0, 10),
        vendorId: bill.vendorId || '',
        serviceId: bill.serviceId || '',
        invoiceRef: bill.invoiceRef || '',
        amount: bill.amount || '',
        note: bill.note || '',
      })
    } else {
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        vendorId: initialVendorId || (vendors[0]?.id || ''),
        serviceId: '',
        invoiceRef: '',
        amount: '',
        note: '',
      })
    }
    setErrors({})
  }, [bill, open, initialVendorId, vendors])

  // Get active vendors for creation
  const availableVendors = useMemo(() => {
    return vendors.filter((v) => v.isActive || v.id === formData.vendorId)
  }, [vendors, formData.vendorId])

  // Selected vendor's linked services
  const vendorServices = useMemo(() => {
    const selectedVendor = vendors.find((v) => v.id === formData.vendorId)
    if (!selectedVendor || !selectedVendor.services) return []
    return services.filter(
      (s) => selectedVendor.services.includes(s.id) && (s.isActive || s.id === formData.serviceId)
    )
  }, [vendors, services, formData.vendorId, formData.serviceId])

  // Auto-select first service if current service is not available for this vendor
  useEffect(() => {
    if (vendorServices.length > 0 && !vendorServices.some((s) => s.id === formData.serviceId)) {
      setFormData((prev) => ({ ...prev, serviceId: vendorServices[0].id }))
    }
  }, [vendorServices, formData.serviceId])

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
      setErrors({ form: err.message || 'Failed to save bill' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={bill ? `Edit Bill (${bill.billNo})` : 'Record Vendor Bill'}
      description="Record a new payable purchase bill from a vendor for a specific service segment."
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
            form="bill-form"
            disabled={saving}
            className="bg-primary text-white hover:bg-primary-strong"
          >
            {saving ? 'Saving...' : bill ? 'Update Bill' : 'Record Bill'}
          </Button>
        </div>
      }
    >
      <form id="bill-form" onSubmit={handleSubmit} className="space-y-4">
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
                    {s.name} {s.code ? `(${s.code})` : ''}
                  </option>
                ))
              )}
            </select>
            {errors.serviceId && <p className="text-xs text-rose-500 mt-1">{errors.serviceId}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Bill Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.date && <p className="text-xs text-rose-500 mt-1">{errors.date}</p>}
          </div>

          {/* Invoice / Ref */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Invoice / Reference No
            </label>
            <input
              type="text"
              placeholder="e.g. INV-2231"
              value={formData.invoiceRef}
              onChange={(e) => handleChange('invoiceRef', e.target.value)}
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
              placeholder="50,000"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="w-full h-9 pl-7 pr-3 text-sm rounded-lg border border-border bg-surface text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>}
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Note / Description
          </label>
          <textarea
            rows={2}
            placeholder="Details of purchase or tickets..."
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            className="w-full p-2.5 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </form>
    </Modal>
  )
}
