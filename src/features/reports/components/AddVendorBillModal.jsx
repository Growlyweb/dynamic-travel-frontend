import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Building2, Calendar, FileText } from 'lucide-react'

export default function AddVendorBillModal({
  open,
  onOpenChange,
  onSave,
}) {
  const [formData, setFormData] = useState({
    name: '',
    billNo: `BILL-${Math.floor(100 + Math.random() * 900)}`,
    billed: '',
    paid: '0',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.billed) return
    setSubmitting(true)
    try {
      await onSave({
        name: formData.name.trim(),
        billNo: formData.billNo.trim(),
        billed: Number(formData.billed) || 0,
        paid: Number(formData.paid) || 0,
        dueDate: formData.dueDate,
      })
      onOpenChange(false)
      setFormData({
        name: '',
        billNo: `BILL-${Math.floor(100 + Math.random() * 900)}`,
        billed: '',
        paid: '0',
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      })
    } catch (err) {
      alert(err.message || 'Failed to add vendor bill')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Building2 className="size-5 text-primary" />
            <span>Add Vendor Bill</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Supplier / Vendor Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Saudi Ground Operator, Gulf Air, Hotel Partner..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Bill Reference # <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.billNo}
                onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Due Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Total Billed Amount (৳) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="Total invoice amount"
                value={formData.billed}
                onChange={(e) => setFormData({ ...formData, billed: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Paid Immediately (৳)
              </label>
              <input
                type="number"
                min="0"
                max={formData.billed || undefined}
                placeholder="0"
                value={formData.paid}
                onChange={(e) => setFormData({ ...formData, paid: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              />
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
              className="bg-primary hover:bg-primary-strong text-white text-sm"
            >
              {submitting ? 'Recording...' : 'Add Bill'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
