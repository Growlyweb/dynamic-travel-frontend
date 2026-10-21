import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CreditCard, CheckCircle2 } from 'lucide-react'
import { formatMoney } from '../reports.api'

export default function RecordVendorPaymentModal({
  open,
  onOpenChange,
  bill = null,
  onSave,
}) {
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (bill) {
      setAmount(bill.payable ? String(bill.payable) : '')
    } else {
      setAmount('')
    }
  }, [bill, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    setSubmitting(true)
    try {
      await onSave({
        billNo: bill.billNo,
        amount: Number(amount),
      })
      onOpenChange(false)
    } catch (err) {
      alert(err.message || 'Failed to record vendor payment')
    } finally {
      setSubmitting(false)
    }
  }

  if (!bill) return null

  const payableAmt = bill.payable
  const enteredAmount = Number(amount) || 0
  const remainingPayable = Math.max(0, payableAmt - enteredAmount)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <CreditCard className="size-5 text-primary" />
            <span>Pay Vendor Bill</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="bg-slate-50 border border-border/80 rounded-xl p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Vendor:</span>
              <span className="font-bold text-foreground text-sm">{bill.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Bill Reference:</span>
              <span className="font-mono font-semibold text-foreground">{bill.billNo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Invoiced:</span>
              <span className="font-semibold text-foreground">{formatMoney(bill.billed)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Already Paid:</span>
              <span className="text-emerald-700 font-semibold">{formatMoney(bill.paid)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Outstanding Payable:</span>
              <span className="font-bold text-rose-600">{formatMoney(payableAmt)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Payment Amount (৳) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={payableAmt}
              required
              placeholder="e.g. 20000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-muted-foreground">
              <span>Quick set:</span>
              <button
                type="button"
                onClick={() => setAmount(String(payableAmt))}
                className="text-primary hover:underline font-medium"
              >
                Clear Full Balance ({formatMoney(payableAmt)})
              </button>
            </div>
          </div>

          {enteredAmount > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200/60 rounded-lg text-xs space-y-1 text-emerald-800">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <CheckCircle2 className="size-4" />
                <span>Settlement Preview</span>
              </div>
              <div className="flex justify-between">
                <span>Payment to supplier:</span>
                <span className="font-bold">{formatMoney(enteredAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining bill balance:</span>
                <span className="font-bold">{formatMoney(remainingPayable)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary-strong text-white text-sm"
            >
              {submitting ? 'Processing...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
