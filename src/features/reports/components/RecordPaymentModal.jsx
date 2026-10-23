import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DollarSign, CheckCircle2 } from 'lucide-react'
import { formatMoney } from '../reports.api'

export default function RecordPaymentModal({
  open,
  onOpenChange,
  client = null,
  onSave,
}) {
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (client) {
      setAmount(client.due ? String(client.due) : '')
    } else {
      setAmount('')
    }
  }, [client, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    setSubmitting(true)
    try {
      await onSave({
        name: client.name,
        amount: Number(amount),
      })
      onOpenChange(false)
    } catch (err) {
      alert(err.message || 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  if (!client) return null

  const dueAmt = client.due || (client.inv - client.paid)
  const enteredAmount = Number(amount) || 0
  const remainingDue = Math.max(0, dueAmt - enteredAmount)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <DollarSign className="size-5 text-emerald-600" />
            <span>Record Received Payment</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="bg-slate-50 border border-border/80 rounded-xl p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Client / Agency:</span>
              <span className="font-bold text-foreground text-sm">{client.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account Channel:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-soft text-primary">
                {client.t || client.type}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Invoiced:</span>
              <span className="font-semibold text-foreground">{formatMoney(client.inv)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Due:</span>
              <span className="font-bold text-rose-600">{formatMoney(dueAmt)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Payment Amount (৳) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={dueAmt}
              required
              placeholder="e.g. 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-muted-foreground">
              <span>Quick set:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setAmount(String(dueAmt))}
                  className="text-primary hover:underline font-medium"
                >
                  Full Due ({formatMoney(dueAmt)})
                </button>
                {dueAmt >= 20000 && (
                  <>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setAmount(String(Math.round(dueAmt / 2)))}
                      className="text-primary hover:underline font-medium"
                    >
                      50%
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {enteredAmount > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200/60 rounded-lg text-xs space-y-1 text-emerald-800">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <CheckCircle2 className="size-4" />
                <span>Payment Settlement Preview</span>
              </div>
              <div className="flex justify-between">
                <span>Payment to apply:</span>
                <span className="font-bold">{formatMoney(enteredAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining due balance:</span>
                <span className="font-bold">{formatMoney(remainingDue)}</span>
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
            >
              {submitting ? 'Applying...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
