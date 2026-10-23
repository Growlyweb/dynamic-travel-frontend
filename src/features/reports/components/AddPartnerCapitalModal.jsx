import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Landmark, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function AddPartnerCapitalModal({
  open,
  onOpenChange,
  onSave,
}) {
  const [partner, setPartner] = useState('A')
  const [type, setType] = useState('Investment')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    setSubmitting(true)
    try {
      await onSave({
        partner,
        type,
        amount: Number(amount),
        date,
        note: note.trim(),
      })
      onOpenChange(false)
      setAmount('')
      setNote('')
      setDate(new Date().toISOString().slice(0, 10))
    } catch (err) {
      alert(err.message || 'Failed to record partner capital transaction')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Landmark className="size-5 text-primary" />
            <span>Record Capital Transaction</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Partner <span className="text-danger">*</span>
              </label>
              <select
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="A">Partner A</option>
                <option value="B">Partner B</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Transaction Type <span className="text-danger">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="Investment">Investment (Capital Inflow)</option>
                <option value="Withdrawal">Withdrawal (Drawings)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Amount (৳) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 200000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Transaction Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Purpose / Description
            </label>
            <input
              type="text"
              placeholder={type === 'Investment' ? 'e.g. Working capital, Visa float, Office renovation' : 'e.g. Profit drawings, Monthly disbursement'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              type === 'Investment'
                ? 'bg-emerald-50 border-emerald-200/60 text-emerald-800'
                : 'bg-rose-50 border-rose-200/60 text-rose-800'
            }`}
          >
            {type === 'Investment' ? (
              <ArrowDownLeft className="size-4 shrink-0 text-emerald-600" />
            ) : (
              <ArrowUpRight className="size-4 shrink-0 text-rose-600" />
            )}
            <span>
              {type === 'Investment'
                ? `Adds capital balance to Partner ${partner}, increasing their equity share and monthly profit entitlement.`
                : `Deducts capital balance from Partner ${partner}, adjusting equity share accordingly.`}
            </span>
          </div>

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
              className={`text-white text-sm ${
                type === 'Investment'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {submitting ? 'Recording...' : `Record ${type}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
