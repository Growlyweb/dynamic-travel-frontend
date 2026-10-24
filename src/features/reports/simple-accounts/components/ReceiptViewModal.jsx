import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import ModalShell from '@/features/reports/components/ModalShell'
import { Button } from '@/components/ui/button'

import { simpleApi } from '../simple.api'
import { printSimpleReceipt, receiptHtml } from '../receipts.print'

export default function ReceiptViewModal({ open, onOpenChange, receiptNo, receipt: initialReceipt }) {
  const [receipt, setReceipt] = useState(initialReceipt || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (initialReceipt) {
      setReceipt(initialReceipt)
      setError('')
      return
    }
    if (!receiptNo) return
    let active = true
    setLoading(true)
    setError('')
    simpleApi
      .getReceipt(receiptNo)
      .then((row) => active && setReceipt(row))
      .catch((err) => active && setError(err?.message || 'Could not load this money receipt.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [open, receiptNo, initialReceipt])

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={receipt ? `Money Receipt · ${receipt.no}` : 'Money Receipt'}
      subtitle="Client copy. Print or save as PDF."
      maxWidth="max-w-4xl"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-4">
            Close
          </Button>
          <Button
            onClick={() => receipt && printSimpleReceipt(receipt)}
            disabled={!receipt}
            className="h-10 gap-2 bg-[#2F80ED] px-4 text-white hover:bg-[#1d6fd0]"
          >
            <Printer className="size-4" /> Print / Download PDF
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading money receipt…</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">{error}</div>
      ) : receipt ? (
        <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: receiptHtml(receipt) }} />
      ) : null}
    </ModalShell>
  )
}
