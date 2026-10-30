import { useEffect, useState } from 'react'
import { Ban } from 'lucide-react'
import ModalShell, { Field } from '@/features/reports/components/ModalShell'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/utils/errors'

const input =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2F80ED] focus:ring-2 focus:ring-primary/20'

// Asks for the reason of something that cannot be undone quietly (voiding a receipt, a bill, a payment).
export default function ReasonModal({ open, onOpenChange, title, subtitle, confirmLabel = 'Confirm', children, onConfirm }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setReason('')
    setError('')
  }, [open])

  async function submit(event) {
    event.preventDefault()
    if (!reason.trim()) return setError('Write the reason.')
    setSaving(true)
    try {
      await onConfirm(reason.trim())
      onOpenChange(false)
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      subtitle={subtitle}
      icon={Ban}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="h-11 px-5 text-base">
            Back
          </Button>
          <Button type="submit" form="reason-form" disabled={saving} className="h-11 bg-[#DC2626] px-6 text-base text-white">
            {saving ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      <form id="reason-form" onSubmit={submit} className="space-y-4">
        {children}
        <Field label="Reason" required>
          <input type="text" value={reason} onChange={(event) => setReason(event.target.value)} className={input} autoFocus />
        </Field>
        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
      </form>
    </ModalShell>
  )
}
