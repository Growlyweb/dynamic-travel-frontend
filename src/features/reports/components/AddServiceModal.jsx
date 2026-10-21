import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ReceiptText, Sparkles } from 'lucide-react'
import { formatMoney } from '../reports.api'

export default function AddServiceModal({
  open,
  onOpenChange,
  serviceToEdit = null,
  onSave,
}) {
  const [name, setName] = useState('')
  const [cost, setCost] = useState('')
  const [b2b, setB2b] = useState('')
  const [b2c, setB2c] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name || '')
      setCost(serviceToEdit.cost?.toString() || '')
      setB2b(serviceToEdit.b2b?.toString() || '')
      setB2c(serviceToEdit.b2c?.toString() || '')
    } else {
      setName('')
      setCost('')
      setB2b('')
      setB2c('')
    }
  }, [serviceToEdit, open])

  // Computed margins preview
  const costNum = Number(cost) || 0
  const b2bNum = Number(b2b) || 0
  const b2cNum = Number(b2c) || 0

  const b2bProfit = b2bNum - costNum
  const b2bMargin = b2bNum > 0 ? (b2bProfit / b2bNum) * 100 : 0

  const b2cProfit = b2cNum - costNum
  const b2cMargin = b2cNum > 0 ? (b2cProfit / b2cNum) * 100 : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await onSave({
        name: name.trim(),
        cost: costNum,
        b2b: b2bNum,
        b2c: b2cNum,
      })
      onOpenChange(false)
    } catch (err) {
      alert(err.message || 'Failed to save service')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <ReceiptText className="size-5 text-primary" />
            <span>{serviceToEdit ? 'Edit Service Rates' : 'Add New Service Rate'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Service / Package Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Schengen Visa, Umrah Package, Singapore Tour..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Vendor Direct Cost (৳) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              placeholder="Supplier or direct cost price"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                B2B Agency Rate (৳)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Wholesale rate"
                value={b2b}
                onChange={(e) => setB2b(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                B2C Client Rate (৳)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Retail rate"
                value={b2c}
                onChange={(e) => setB2c(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Live Preview Box */}
          {(b2bNum > 0 || b2cNum > 0) && (
            <div className="bg-primary-soft/40 border border-primary/20 rounded-lg p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <Sparkles className="size-3.5" />
                <span>Profit Margins Analysis</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>B2B Wholesale Profit:</span>
                <span className={b2bProfit >= 0 ? 'text-primary font-medium' : 'text-danger font-medium'}>
                  {formatMoney(b2bProfit)} ({b2bMargin.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>B2C Retail Profit:</span>
                <span className={b2cProfit >= 0 ? 'text-emerald-700 font-medium' : 'text-danger font-medium'}>
                  {formatMoney(b2cProfit)} ({b2cMargin.toFixed(1)}%)
                </span>
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
              {submitting ? 'Saving...' : serviceToEdit ? 'Save Changes' : 'Add Service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
