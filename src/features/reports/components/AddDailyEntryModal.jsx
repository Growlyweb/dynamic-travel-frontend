import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

export default function AddDailyEntryModal({
  open,
  onOpenChange,
  categories = [],
  defaultDate = '',
  onSave,
}) {
  const [formData, setFormData] = useState({
    date: defaultDate || new Date().toISOString().slice(0, 10),
    type: 'Sale',
    category: categories[0]?.n || 'Visa',
    channel: 'B2C',
    description: '',
    sell: '',
    cost: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSave({
        date: formData.date,
        type: formData.type,
        category: formData.type === 'Sale' ? formData.category : 'Expense',
        channel: formData.type === 'Sale' ? formData.channel : 'General',
        description: formData.description,
        sell: formData.type === 'Sale' ? Number(formData.sell) || 0 : 0,
        cost: Number(formData.cost) || 0,
      })
      onOpenChange(false)
      setFormData({
        date: defaultDate || new Date().toISOString().slice(0, 10),
        type: 'Sale',
        category: categories[0]?.n || 'Visa',
        channel: 'B2C',
        description: '',
        sell: '',
        cost: '',
      })
    } catch (err) {
      alert(err.message || 'Failed to add entry')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <PlusCircle className="size-5 text-primary" />
            <span>Add Daily Entry</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Transaction Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="Sale">Sale (Revenue)</option>
                <option value="Expense">Operating Expense</option>
              </select>
            </div>
          </div>

          {formData.type === 'Sale' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.n} value={c.n}>
                      {c.n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Channel
                </label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="B2B">B2B Agent</option>
                  <option value="B2C">B2C Retail Client</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              placeholder={formData.type === 'Sale' ? 'e.g. Visa processing, tour package' : 'e.g. Office rent, salaries'}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {formData.type === 'Sale' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Selling Price (৳) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={formData.sell}
                    onChange={(e) => setFormData({ ...formData, sell: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Cost Price (৳) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Expense Amount (৳) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            )}
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
              {submitting ? 'Saving...' : 'Add Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
