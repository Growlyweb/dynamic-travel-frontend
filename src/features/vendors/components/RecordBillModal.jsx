import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ReceiptText, Building2, Calendar, FileText } from 'lucide-react'

const SEGMENTS = ['Air Tickets', 'Visas', 'Passports', 'Umrah', 'Hajj', 'Hotels', 'Transport']

export default function RecordBillModal({ open, onOpenChange, vendors = [], defaultVendorId, onSubmit }) {
  const [formData, setFormData] = useState({
    vendorId: defaultVendorId || vendors[0]?.id || '',
    segment: 'Air Tickets',
    amount: '',
    reference: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Sync defaultVendorId if provided
  React.useEffect(() => {
    if (defaultVendorId) {
      setFormData((prev) => ({ ...prev, vendorId: defaultVendorId }))
    } else if (vendors.length > 0 && !formData.vendorId) {
      setFormData((prev) => ({ ...prev, vendorId: vendors[0].id }))
    }
  }, [defaultVendorId, vendors])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.vendorId || !formData.amount) return

    setSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        amount: Number(formData.amount),
      })
      onOpenChange(false)
      setFormData({
        vendorId: defaultVendorId || vendors[0]?.id || '',
        segment: 'Air Tickets',
        amount: '',
        reference: '',
        billDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        notes: '',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 rounded-3xl bg-popover text-popover-foreground border border-border shadow-2xl">
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-2 text-primary">
            <ReceiptText className="size-5" />
            <DialogTitle className="text-lg font-bold">Record Vendor Bill / Payable</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Entering this invoice updates the vendor's dynamic running due in real-time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Vendor Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="size-3.5 text-primary" /> Vendor / Supplier *
            </label>
            <select
              required
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              value={formData.vendorId}
              onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.company} ({v.name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Service Segment */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Service Segment *</label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={formData.segment}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
              >
                {SEGMENTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Bill Amount */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Bill Amount (BDT) *</label>
              <Input
                type="number"
                required
                placeholder="e.g. 50000"
                className="font-mono"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            {/* Bill Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" /> Bill Date
              </label>
              <Input
                type="date"
                value={formData.billDate}
                onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" /> Payment Due Date
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="size-3.5 text-muted-foreground" /> Reference / Sector / PNR / Room No.
            </label>
            <Input
              placeholder="e.g. DAC-JED Saudia Ticket 5 Pax PNR #SV8812"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Operational Notes</label>
            <Textarea
              rows={2}
              placeholder="Additional billing details, package code..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Recording…' : 'Record Bill & Update Ledger'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
