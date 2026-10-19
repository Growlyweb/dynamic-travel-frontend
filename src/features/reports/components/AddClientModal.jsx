import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UserPlus, Building2 } from 'lucide-react'
import { formatMoney } from '../reports.api'

export default function AddClientModal({
  open,
  onOpenChange,
  type = 'B2B',
  services = [],
  onSave,
}) {
  const isB2B = type === 'B2B'

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    limit: '100000',
    serviceIndex: '0',
    qty: '1',
    paidNow: '0',
  })
  const [submitting, setSubmitting] = useState(false)

  const selectedService = services[Number(formData.serviceIndex)] || services[0]
  const unitPrice = selectedService ? (isB2B ? selectedService.b2b : selectedService.b2c) : 0
  const qtyNum = Math.max(1, Number(formData.qty) || 1)
  const totalAmount = unitPrice * qtyNum
  const paidNum = Math.min(totalAmount, Math.max(0, Number(formData.paidNow) || 0))
  const remainingDue = Math.max(0, totalAmount - paidNum)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSave({
        name: formData.name,
        contact: formData.contact,
        limit: isB2B ? Number(formData.limit) || 0 : 0,
        serviceIndex: Number(formData.serviceIndex) || 0,
        qty: qtyNum,
        paidNow: paidNum,
      })
      onOpenChange(false)
      setFormData({
        name: '',
        contact: '',
        limit: '100000',
        serviceIndex: '0',
        qty: '1',
        paidNow: '0',
      })
    } catch (err) {
      alert(err.message || 'Failed to add')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            {isB2B ? (
              <Building2 className="size-5 text-primary" />
            ) : (
              <UserPlus className="size-5 text-emerald-600" />
            )}
            <span>{isB2B ? 'Add B2B Agent' : 'Add B2C Client'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              {isB2B ? 'Agency Name' : 'Client Name'} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={isB2B ? 'e.g. Skyline Travels, Dhaka Voyages' : 'e.g. Mohammad Rahim, Tanvir Ahmed'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="01711-XXXXXX"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            {isB2B && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Credit Limit (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Initial Service Package
              </label>
              <select
                value={formData.serviceIndex}
                onChange={(e) => setFormData({ ...formData, serviceIndex: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              >
                {services.map((s, idx) => (
                  <option key={s.n} value={idx}>
                    {s.n} ({formatMoney(isB2B ? s.b2b : s.b2c)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Paid Now (৳)
            </label>
            <input
              type="number"
              min="0"
              max={totalAmount}
              value={formData.paidNow}
              onChange={(e) => setFormData({ ...formData, paidNow: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          {/* Pricing Preview Banner */}
          <div className="p-3 rounded-xl bg-primary-soft border border-primary/20 text-xs text-foreground space-y-1">
            <div className="flex items-center justify-between font-medium">
              <span>
                {type} Rate: <b>{formatMoney(unitPrice)}</b> × {qtyNum}
              </span>
              <span className="font-bold text-sm text-primary">
                Total: {formatMoney(totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-primary/20">
              <span>Paid now: {formatMoney(paidNum)}</span>
              <span className={`font-semibold ${remainingDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                Remaining Due: {formatMoney(remainingDue)}
              </span>
            </div>
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
              className={`text-white text-sm ${isB2B ? 'bg-primary hover:bg-primary-strong' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {submitting ? 'Saving...' : isB2B ? 'Add B2B Agent' : 'Add B2C Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
