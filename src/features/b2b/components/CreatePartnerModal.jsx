import { useEffect, useState } from 'react'
import ModalShell from '@/features/reports/components/ModalShell'
import { Button } from '@/components/ui/button'
import { b2bApi } from '../b2b.api'

const EMPTY = {
  company: '',
  name: '',
  email: '',
  phone: '',
  country: 'Bangladesh',
  address: '',
  password: '',
  tier: 'bronze',
}

export default function CreatePartnerModal({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setError('')
    }
  }, [open])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const partner = await b2bApi.createPartnerPortal(form)
      await onCreated?.(partner)
      onOpenChange(false)
    } catch (err) {
      setError(err?.message || 'Could not create the partner portal.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Create B2B partner portal"
      subtitle="Admin-created partners are approved and active immediately."
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-4">
            Cancel
          </Button>
          <Button type="submit" form="create-partner-form" disabled={saving} className="h-10 bg-[#2F80ED] px-4 text-white">
            {saving ? 'Creating…' : 'Create portal'}
          </Button>
        </div>
      }
    >
      <form id="create-partner-form" onSubmit={submit} className="space-y-4">
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Agency / Company name *
            <input required value={form.company} onChange={(e) => update('company', e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Contact person *
            <input required value={form.name} onChange={(e) => update('name', e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Login email *
            <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Phone
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Country
            <input value={form.country} onChange={(e) => update('country', e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Partner tier
            <select value={form.tier} onChange={(e) => update('tier', e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#2F80ED]">
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Business address
            <input value={form.address} onChange={(e) => update('address', e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Portal password * <span className="font-normal text-slate-400">(minimum 6 characters)</span>
            <input required type="password" minLength={6} value={form.password} onChange={(e) => update('password', e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
          </label>
        </div>
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
          The partner can log in at <strong>/partner/login</strong> immediately. You can still suspend the account later.
        </p>
      </form>
    </ModalShell>
  )
}
