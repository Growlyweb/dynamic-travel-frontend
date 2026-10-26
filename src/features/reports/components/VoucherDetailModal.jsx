import { useEffect, useState } from 'react'
import { Ban, BookOpenCheck, Printer } from 'lucide-react'
import ModalShell from './ModalShell'
import { Button } from '@/components/ui/button'
import { formatMoney, reportsApi } from '../reports.api'
import { formatDateShort } from '../accounting/dates'
import { printJournalVoucher } from '../reports.print'

const TYPE_LABEL = {
  OB: 'Opening Balance',
  SV: 'Sales Invoice',
  RV: 'Money Receipt',
  PV: 'Payment',
  JV: 'Journal Voucher',
  CV: 'Contra Voucher',
}

export default function VoucherDetailModal({ open, onOpenChange, journalId, onChanged, onPrint }) {
  const [journal, setJournal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !journalId) return
    let active = true
    setLoading(true)
    setError('')
    reportsApi
      .getJournal(journalId)
      .then((response) => {
        if (active) setJournal(response.data)
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Could not load this voucher.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open, journalId])

  const handleVoid = async () => {
    if (!journal) return
    if (!window.confirm(`Void voucher ${journal.no}? It will stay in the register but stop affecting reports.`)) {
      return
    }
    try {
      await reportsApi.voidJournal(journal.id)
      onChanged?.()
      onOpenChange(false)
    } catch (err) {
      setError(err?.message || 'Could not void this voucher.')
    }
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={journal ? journal.no : 'Voucher'}
      subtitle={journal ? `${TYPE_LABEL[journal.type] || journal.type} · ${formatDateShort(journal.date)}` : 'Loading voucher…'}
      icon={BookOpenCheck}
      maxWidth="max-w-3xl"
      badge={
        journal ? (
          <span
            className={`mr-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              journal.status === 'void'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {journal.status}
          </span>
        ) : null
      }
      footer={
        <>
          {journal && journal.status !== 'void' ? (
            <Button type="button" variant="outline" onClick={handleVoid} className="mr-auto gap-1.5 text-rose-600">
              <Ban className="size-3.5" />
              Void voucher
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            disabled={!journal}
            onClick={() => (onPrint || printJournalVoucher)(journal)}
            className="gap-1.5 bg-primary text-white hover:bg-primary/90"
          >
            <Printer className="size-3.5" />
            Print voucher
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading voucher…</div>
      ) : error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{error}</p>
      ) : journal ? (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Narration</p>
              <p className="mt-0.5 text-[12.5px] font-medium text-slate-800">{journal.narration}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Party</p>
              <p className="mt-0.5 text-[12.5px] font-medium text-slate-800">{journal.partyName || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Segment / file</p>
              <p className="mt-0.5 text-[12.5px] font-medium text-slate-800">
                {journal.segmentName} {journal.fileNo ? `· ${journal.fileNo}` : ''}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#0F172A] text-white">
                  <th className="px-3 py-2.5 text-left font-semibold">Account</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Particulars</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Debit</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journal.lines.map((line, index) => (
                  <tr key={index} className="bg-white">
                    <td className="px-3 py-2.5 align-top">
                      <span className="font-semibold text-slate-800">{line.accountName}</span>
                      <span className="block text-[10px] text-slate-400">
                        {line.account}
                        {line.partyName ? ` · ${line.partyName}` : ''}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-top text-slate-600">{line.memo || '—'}</td>
                    <td className="px-3 py-2.5 text-right align-top font-medium tabular-nums text-slate-800">
                      {line.debit ? formatMoney(line.debit) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right align-top font-medium tabular-nums text-slate-800">
                      {line.credit ? formatMoney(line.credit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td className="px-3 py-2.5" colSpan={2}>
                    Total
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(journal.debit)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(journal.credit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {journal.ref ? (
            <p className="text-[11px] text-slate-500">
              Reference: <strong className="text-slate-700">{journal.ref}</strong>
            </p>
          ) : null}
        </div>
      ) : null}
    </ModalShell>
  )
}
