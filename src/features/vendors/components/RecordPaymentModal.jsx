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
import { CreditCard, Building2, Calendar, Landmark } from 'lucide-react'

const PAYMENT_METHODS = [
  'Bank Transfer',
  'Cheque',
  'Cash',
  'MFS (bKash Corporate)',
  'MFS (Nagad)',
  'Online Banking EFT/RTGS',
]

export default function RecordPaymentModal({ open, onOpenChange, vendors = [], defaultVendorId, onSubmit }) {
  const [formData, setFormData] = useState({
    vendorId: defaultVendorId || vendors[0]?.id || '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'Bank Transfer',
    account: 'City Bank - ABL Ops (A/C: 11029381)',
    reference: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

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
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        method: 'Bank Transfer',
        account: 'City Bank - ABL Ops (A/C: 11029381)',
        reference: '',
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
            <CreditCard className="size-5" />
            <DialogTitle className="text-lg font-bold">Issue Vendor Payment Voucher</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Disburse payment and reduce vendor dynamic due. Overpayments will dynamically transition into Blue Advance status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Vendor Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="size-3.5 text-primary" /> Vendor / Recipient *
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
            {/* Payment Amount */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Paid Amount (BDT) *</label>
              <Input
                type="number"
                required
                placeholder="e.g. 75000"
                className="font-mono"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            {/* Payment Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" /> Payment Date
              </label>
              <Input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Payment Method *</label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Bank / Disbursing Account */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Landmark className="size-3.5 text-muted-foreground" /> Disbursing Account
              </label>
              <Input
                placeholder="e.g. City Bank / Brac Bank"
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
              />
            </div>
          </div>

          {/* Reference / Cheque No / Trx ID */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Cheque No. / Transaction Ref / TrxID
            </label>
            <Input
              placeholder="e.g. Cheque #449210 or TrxID #CTY88291"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Voucher Remarks</label>
            <Textarea
              rows={2}
              placeholder="Purpose of payment, settlement for specific bill..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Disbursing…' : 'Issue Voucher & Credit Ledger'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
