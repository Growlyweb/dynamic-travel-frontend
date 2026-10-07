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
import { UserPlus, Building2, Phone, Mail, Tag } from 'lucide-react'

export default function AddContactModal({ open, onOpenChange, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    segments: ['Air Tickets'],
    tags: ['Manual Lead'],
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.phone) return

    setSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
      setFormData({
        name: '',
        company: '',
        phone: '',
        email: '',
        segments: ['Air Tickets'],
        tags: ['Manual Lead'],
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-3xl bg-popover text-popover-foreground border border-border shadow-2xl">
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-2 text-primary">
            <UserPlus className="size-5" />
            <DialogTitle className="text-lg font-bold">Add Marketing Contact</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Manually enroll vendor agents or corporate buyers into marketing communication lists.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Contact Name *</label>
            <Input
              required
              placeholder="e.g. Salimullah Bepari"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="size-3.5 text-muted-foreground" /> Company / Agency Name
            </label>
            <Input
              placeholder="e.g. Old Dhaka Travel Associates"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" /> Mobile / WhatsApp *
              </label>
              <Input
                required
                placeholder="+880 1711-..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="size-3.5 text-muted-foreground" /> Email Address
              </label>
              <Input
                type="email"
                placeholder="agent@domain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Tag className="size-3.5 text-muted-foreground" /> Tags (Comma-separated)
            </label>
            <Input
              placeholder="VIP, Umrah, High Value, Corporate"
              value={formData.tags.join(', ')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                })
              }
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
