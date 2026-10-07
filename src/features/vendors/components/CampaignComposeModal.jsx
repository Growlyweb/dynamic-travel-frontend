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
import { Send, MessageSquare, Mail, Sparkles, Clock, CheckCircle2 } from 'lucide-react'

export default function CampaignComposeModal({ open, onOpenChange, onSubmit, totalContacts = 0 }) {
  const [formData, setFormData] = useState({
    title: '',
    channel: 'SMS',
    audience: 'All Active Vendors',
    recipientCount: totalContacts || 120,
    messageContent:
      'Dear {vendor_name}, Special block fares for Ramadan Umrah 2026 flights and Clock Tower hotels are now available. Book early with ABL Travel to earn 8% commission. Hotline: +880 9610-888999.',
    sendImmediately: true,
    scheduledAt: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const insertVariable = (variable) => {
    setFormData((prev) => ({
      ...prev,
      messageContent: prev.messageContent + ` ${variable} `,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.messageContent) return

    setSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
      setFormData({
        title: '',
        channel: 'SMS',
        audience: 'All Active Vendors',
        recipientCount: totalContacts || 120,
        messageContent: '',
        sendImmediately: true,
        scheduledAt: '',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-6 rounded-3xl bg-popover text-popover-foreground border border-border shadow-2xl">
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-2 text-primary">
            <Send className="size-5" />
            <DialogTitle className="text-lg font-bold">Compose Marketing & Offer Broadcast</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Dispatch bulk SMS/Email campaigns or schedule automated message sequences to vendors and travelers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Campaign Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Campaign Name / Offer Title *</label>
            <Input
              required
              placeholder="e.g. Ramadan 2026 Umrah Flight & Hotel Block Tariff"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Channel Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Broadcast Channel *</label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              >
                <option value="SMS">SMS Gateway (Branded Sender ID)</option>
                <option value="Email">Email Newsletter (HTML Template)</option>
                <option value="WhatsApp">WhatsApp Business Broadcast</option>
                <option value="SMS & Email">Omnichannel (SMS + Email)</option>
              </select>
            </div>

            {/* Target Audience */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Target Audience Segment</label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
              >
                <option value="All Active Vendors">All Active Vendors ({totalContacts})</option>
                <option value="Vendors (Umrah & Air Tickets)">Vendors (Umrah & Air Tickets)</option>
                <option value="Vendors (Visas & Passports)">Vendors (Visas & Passports)</option>
                <option value="Vendors with Positive Due">Vendors with Pending Dues (Payment Notice)</option>
                <option value="All Synced Marketing Contacts">All Contacts (Vendors + Clients)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Message Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Message Content / Offer Body *
              </label>
              <span className="text-[11px] text-muted-foreground">
                {formData.messageContent.length} chars (Approx. {Math.ceil(formData.messageContent.length / 160)} SMS parts)
              </span>
            </div>

            {/* Personalized tags buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <span className="text-[10.5px] text-muted-foreground">Insert Tag:</span>
              {['{vendor_name}', '{company_name}', '{dynamic_due}', '{contact_phone}', '{ticket_pnr}'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="px-2 py-0.5 rounded-md text-[10.5px] bg-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer font-mono"
                >
                  + {v}
                </button>
              ))}
            </div>

            <Textarea
              required
              rows={4}
              value={formData.messageContent}
              onChange={(e) => setFormData({ ...formData, messageContent: e.target.value })}
              placeholder="Type your promotional message or announcement..."
              className="text-xs"
            />
          </div>

          {/* Schedule / Dispatch Mode */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-2.5">
            <div className="flex items-center gap-4 text-xs font-semibold">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dispatchMode"
                  checked={formData.sendImmediately}
                  onChange={() => setFormData({ ...formData, sendImmediately: true })}
                />
                <span className="flex items-center gap-1 text-foreground">
                  <Send className="size-3.5 text-primary" /> Dispatch Immediately
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dispatchMode"
                  checked={!formData.sendImmediately}
                  onChange={() => setFormData({ ...formData, sendImmediately: false })}
                />
                <span className="flex items-center gap-1 text-foreground">
                  <Clock className="size-3.5 text-muted-foreground" /> Schedule for Later
                </span>
              </label>
            </div>

            {!formData.sendImmediately && (
              <div className="pt-1">
                <Input
                  type="datetime-local"
                  required={!formData.sendImmediately}
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="text-xs"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? 'Processing…'
                : formData.sendImmediately
                ? 'Dispatch Campaign Now'
                : 'Schedule Campaign Sequence'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
