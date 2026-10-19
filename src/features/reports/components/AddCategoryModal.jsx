import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tag } from 'lucide-react'
import { PALETTE } from '../reports.api'

export default function AddCategoryModal({
  open,
  onOpenChange,
  existingCount = 0,
  onSave,
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PALETTE[existingCount % PALETTE.length])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await onSave({ name: name.trim(), color })
      onOpenChange(false)
      setName('')
      setColor(PALETTE[(existingCount + 1) % PALETTE.length])
    } catch (err) {
      alert(err.message || 'Failed to create category')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Tag className="size-5 text-primary" />
            <span>Create Sales Category</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Category Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Hotel Booking, Umrah Package, Air Ticket..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Color Accent
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 p-0.5 rounded-lg border border-border cursor-pointer bg-surface"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {PALETTE.map((palColor) => (
                  <button
                    key={palColor}
                    type="button"
                    onClick={() => setColor(palColor)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      color.toLowerCase() === palColor.toLowerCase()
                        ? 'border-foreground scale-110 shadow-xs'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: palColor }}
                    title={palColor}
                  />
                ))}
              </div>
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
              {submitting ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
