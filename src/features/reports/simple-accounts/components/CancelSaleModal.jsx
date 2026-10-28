import { useEffect, useState } from 'react'
import { Ban } from 'lucide-react'
import ModalShell, { Field } from '@/features/reports/components/ModalShell'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/features/reports/lib/format'
import { errorMessage } from '@/utils/errors'

const input =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2F80ED] focus:ring-2 focus:ring-primary/20'

// A sale is never deleted. Cancelling it keeps the record and takes its sale, cost and due out of the numbers. When money was
// already received the books need to know what became of it: given back (refund) or kept.
export default function CancelSaleModal({ open, onOpenChange, sale, onConfirm }) {
  const [reason, setReason] = useState('')
  const [settlement, setSettlement] = useState('refund')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const hasMoney = Number(sale?.received) > 0

  useEffect(() => {
    if (!open) return
    setReason('')
    setSettlement('refund')
    setError('')
  }, [open])

  async function submit(event) {
    event.preventDefault()
    if (!reason.trim()) return setError('Write the reason.')
    setSaving(true)
    try {
      await onConfirm({ reason: reason.trim(), settlement: hasMoney ? settlement : undefined })
      onOpenChange(false)
    } catch (failure) {
      setError(errorMessage(failure, 'Could not cancel the sale.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={`Cancel sale ${sale?.fileNo ?? ''}`}
      subtitle="The sale stays in the records, marked as cancelled."
      icon={Ban}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="h-11 px-5 text-base">
            Keep the sale
          </Button>
          <Button type="submit" form="cancel-sale-form" disabled={saving} className="h-11 bg-[#DC2626] px-6 text-base text-white">
            {saving ? 'Cancelling…' : 'Cancel sale'}
          </Button>
        </>
      }
    >
      <form id="cancel-sale-form" onSubmit={submit} className="space-y-4">
        <Field label="Reason" required>
          <input type="text" value={reason} onChange={(event) => setReason(event.target.value)} className={input} autoFocus />
        </Field>
        {hasMoney ? (
          <Field label={`${formatMoney(sale.received)} was received. What happens to it?`}>
            <div className="space-y-2 text-sm">
              <label className="flex items-start gap-2">
                <input type="radio" name="settlement" checked={settlement === 'refund'} onChange={() => setSettlement('refund')} className="mt-1" />
                <span>We give it back to the client (a refund is recorded).</span>
              </label>
              <label className="flex items-start gap-2">
                <input type="radio" name="settlement" checked={settlement === 'keep'} onChange={() => setSettlement('keep')} className="mt-1" />
                <span>We keep it (it is recorded as other income).</span>
              </label>
            </div>
          </Field>
        ) : null}
        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
      </form>
    </ModalShell>
  )
}
