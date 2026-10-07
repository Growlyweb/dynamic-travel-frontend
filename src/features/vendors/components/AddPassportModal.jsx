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
import { KeyRound, Building2, User, Phone, Plus, Trash2, Calendar, FileCheck2, Sparkles } from 'lucide-react'

const SEGMENTS = ['Umrah', 'Visas', 'Passports', 'Hajj']
const COUNTRIES = [
  'Saudi Arabia',
  'UAE (Dubai)',
  'France (Schengen)',
  'United Kingdom',
  'United States',
  'Singapore',
  'Malaysia',
  'Thailand',
  'Bangladesh (Renewal)',
]

export default function AddPassportModal({ open, onOpenChange, vendors = [], defaultVendorId, onSubmit }) {
  const [vendorId, setVendorId] = useState(defaultVendorId || vendors[0]?.id || '')
  const [serviceSegment, setServiceSegment] = useState('Umrah')
  const [country, setCountry] = useState('Saudi Arabia')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [deliveryExpected, setDeliveryExpected] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  )
  const [passengers, setPassengers] = useState([
    { name: '', passportNumber: '', relation: 'Self' },
  ])
  const [enclosedDocs, setEnclosedDocs] = useState([
    'Original Passport',
    'White Background Photos (35x45mm)',
  ])
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  React.useEffect(() => {
    if (defaultVendorId) {
      setVendorId(defaultVendorId)
      const v = vendors.find((vend) => vend.id === defaultVendorId)
      if (v) {
        setContactPerson(v.name || '')
        setPhone(v.phone || '')
        setEmail(v.email || '')
      }
    } else if (vendors.length > 0 && !vendorId) {
      setVendorId(vendors[0].id)
      setContactPerson(vendors[0].name || '')
      setPhone(vendors[0].phone || '')
      setEmail(vendors[0].email || '')
    }
  }, [defaultVendorId, vendors])

  const handleVendorChange = (id) => {
    setVendorId(id)
    const v = vendors.find((vend) => vend.id === id)
    if (v) {
      setContactPerson(v.name || '')
      setPhone(v.phone || '')
      setEmail(v.email || '')
    }
  }

  const addPassengerRow = () => {
    setPassengers((prev) => [...prev, { name: '', passportNumber: '', relation: 'Member' }])
  }

  const removePassengerRow = (index) => {
    if (passengers.length === 1) return
    setPassengers((prev) => prev.filter((_, i) => i !== index))
  }

  const updatePassenger = (index, field, value) => {
    setPassengers((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const toggleEnclosedDoc = (doc) => {
    setEnclosedDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (passengers.some((p) => !p.name || !p.passportNumber)) return

    setSubmitting(true)
    try {
      const vendor = vendors.find((v) => v.id === vendorId)
      const payload = {
        vendorId,
        receivedFrom: vendor?.company || 'Client Direct',
        contactPerson: contactPerson || vendor?.name,
        phone,
        email,
        serviceSegment,
        country,
        deliveryExpected,
        passengers,
        documents: enclosedDocs.map((doc) => ({
          docType: doc,
          count: passengers.length,
          identifiers: doc === 'Original Passport' ? passengers.map((p) => p.passportNumber).join(', ') : 'Verified',
        })),
        remarks,
      }
      await onSubmit(payload)
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-6 rounded-3xl bg-popover text-popover-foreground border border-border shadow-2xl">
        <DialogHeader className="gap-1">
          <div className="flex items-center gap-2 text-primary">
            <KeyRound className="size-5" />
            <DialogTitle className="text-lg font-bold">
              Passport & Document Intake Desk
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Receiving original passports automatically generates an official printable Acknowledgement Slip and registers traveler contact into the marketing campaign pool.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Vendor / Client Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="size-3.5 text-primary" /> Received From Vendor / Partner Agency *
              </label>
              <select
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={vendorId}
                onChange={(e) => handleVendorChange(e.target.value)}
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.company} ({v.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Service Segment *</label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={serviceSegment}
                onChange={(e) => setServiceSegment(e.target.value)}
              >
                {SEGMENTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Target Country / Jurisdiction</label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-muted-foreground" /> Contact / Submitter Name
              </label>
              <Input
                placeholder="Submitter person name"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" /> Contact Mobile / WhatsApp
              </label>
              <Input
                placeholder="+880 1711-..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" /> Expected Delivery / Collection Date
              </label>
              <Input
                type="date"
                value={deliveryExpected}
                onChange={(e) => setDeliveryExpected(e.target.value)}
              />
            </div>
          </div>

          {/* Passengers & Passport Records */}
          <div className="space-y-2 pt-1 border-t border-border/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileCheck2 className="size-4 text-primary" /> Passenger(s) & Passport Numbers *
              </label>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={addPassengerRow}
                className="gap-1 text-xs cursor-pointer h-7"
              >
                <Plus className="size-3.5" />
                <span>Add Passenger</span>
              </Button>
            </div>

            <div className="space-y-2">
              {passengers.map((pax, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60 items-center"
                >
                  <div className="col-span-5">
                    <Input
                      required
                      placeholder="Passenger full name"
                      value={pax.name}
                      onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-4">
                    <Input
                      required
                      placeholder="Passport No (e.g. A04928172)"
                      value={pax.passportNumber}
                      onChange={(e) => updatePassenger(index, 'passportNumber', e.target.value)}
                      className="h-8 text-xs font-mono uppercase"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Relation"
                      value={pax.relation}
                      onChange={(e) => updatePassenger(index, 'relation', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {passengers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removePassengerRow(index)}
                        className="text-destructive hover:bg-destructive/10 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enclosed Documents Checklist */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-foreground">
              Enclosed Supporting Documents Checklist
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                'Original Passport',
                'White Background Photos (35x45mm)',
                'Vaccination Certificate',
                'Police Clearance Certificate',
                'Company Invitation / NOC',
                '6-Month Bank Statement',
              ].map((doc) => {
                const checked = enclosedDocs.includes(doc)
                return (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => toggleEnclosedDoc(doc)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      checked
                        ? 'bg-primary/10 text-primary border-primary/40 font-semibold'
                        : 'bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground'
                    }`}
                  >
                    {checked ? '✓ ' : '+ '} {doc}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Special Instructions / Remarks</label>
            <Textarea
              rows={2}
              placeholder="e.g. Urgent submission needed for family group flight on 24th Oct..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/5 text-primary text-xs">
            <Sparkles className="size-4 shrink-0" />
            <span>
              Submitting generates the official Acknowledgement Slip ready for printing and archival.
            </span>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Generating Slip…' : 'Generate Slip & Intake Passports'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
