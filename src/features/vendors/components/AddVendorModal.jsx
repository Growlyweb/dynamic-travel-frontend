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
import { Building2, User, Mail, Phone, MapPin, Calculator, Sparkles } from 'lucide-react'

const AVAILABLE_SEGMENTS = [
  'Air Tickets',
  'Visas',
  'Passports',
  'Umrah',
  'Hajj',
  'Hotels',
  'Transport',
]

export default function AddVendorModal({ open, onOpenChange, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    openingDue: 0,
    segments: ['Air Tickets', 'Umrah'],
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const toggleSegment = (seg) => {
    setFormData((prev) => {
      const exists = prev.segments.includes(seg)
      return {
        ...prev,
        segments: exists ? prev.segments.filter((s) => s !== seg) : [...prev.segments, seg],
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.company || !formData.phone) return

    setSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        openingDue: Number(formData.openingDue || 0),
      })
      onOpenChange(false)
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        openingDue: 0,
        segments: ['Air Tickets', 'Umrah'],
        notes: '',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-popover text-popover-foreground border border-border shadow-2xl">
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="size-5" />
            <DialogTitle className="text-lg font-bold">Register New Vendor / Supplier</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Add agency credentials, assign service segments, and initialize opening financial balances. Contact details will automatically sync with Marketing workflows.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Agency & Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="size-3.5 text-primary" /> Agency / Company Name *
              </label>
              <Input
                required
                placeholder="e.g. Al-Fajr Air Express Ltd"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-primary" /> Contact Person Name
              </label>
              <Input
                placeholder="e.g. Haji Kamal Uddin"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="size-3.5 text-primary" /> Mobile / WhatsApp *
              </label>
              <Input
                required
                placeholder="+880 1711-000000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="size-3.5 text-primary" /> Email Address
              </label>
              <Input
                type="email"
                placeholder="partner@agency.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" /> Physical Address
              </label>
              <Input
                placeholder="City / Area, Postal Code"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Assigned Service Segments */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-foreground">
              Assigned Service Segments
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_SEGMENTS.map((seg) => {
                const active = formData.segments.includes(seg)
                return (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => toggleSegment(seg)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer border ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                        : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {seg}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Financial Ledger & Dynamic Due Initialization */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
            <div className="flex items-center gap-2">
              <Calculator className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground">
                Opening Balance Configuration (Ledger Baseline)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Real-time rule: <span className="font-semibold text-foreground">Due = Opening Due + Total Bills - Total Payments</span>.
              Enter positive value if you owe vendor, or negative if you have advance credit.
            </p>
            <div className="w-full sm:w-1/2">
              <Input
                type="number"
                placeholder="0"
                value={formData.openingDue}
                onChange={(e) => setFormData({ ...formData, openingDue: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Auto-Sync Marketing Note */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-primary">
            <Sparkles className="size-4 shrink-0 mt-0.5" />
            <span>
              <strong>Automatic Contact Sync:</strong> This vendor's mobile and email will be immediately indexed in the Marketing & Automation database for promotional broadcasts.
            </span>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Internal Notes / Terms</label>
            <Textarea
              rows={2}
              placeholder="e.g. IATA code, commission split arrangement, credit terms..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Registering…' : 'Save & Register Vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
