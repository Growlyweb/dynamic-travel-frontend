import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  Ban,
  CalendarDays,
  CheckCircle2,
  FileText,
  FolderOpen,
  Printer,
  ReceiptText,
  Wallet,
} from 'lucide-react'
import ModalShell from './ModalShell'
import { Button } from '@/components/ui/button'
import { reportsApi, formatMoney, formatPct } from '../reports.api'
import { formatDateShort } from '../accounting/dates'
import { printFileInvoice, printMoneyReceipt } from '../reports.print'

const STATUS_STYLE = {
  Processing: 'border-amber-200 bg-amber-50 text-amber-700',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
}

export default function FileDetailModal({ open, onOpenChange, fileId, onChanged, onReceive }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open || !fileId) return
    let active = true
    setLoading(true)
    setError('')
    reportsApi
      .getFile(fileId)
      .then((response) => {
        if (active) setFile(response.data)
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Could not load this file.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open, fileId])

  const refresh = async () => {
    if (!fileId) return
    const response = await reportsApi.getFile(fileId)
    setFile(response.data)
    onChanged?.()
  }

  const markCompleted = async () => {
    setBusy(true)
    try {
      await reportsApi.updateFileStatus(file.id, 'Completed')
      await refresh()
    } catch (err) {
      setError(err?.message || 'Could not update the file.')
    } finally {
      setBusy(false)
    }
  }

  const cancelFile = async () => {
    if (!window.confirm(`Cancel ${file.fileNo}? All linked vouchers will be voided and the file removed from reports.`)) {
      return
    }
    setBusy(true)
    try {
      await reportsApi.voidFile(file.id)
      onChanged?.()
      onOpenChange(false)
    } catch (err) {
      setError(err?.message || 'Could not cancel the file.')
    } finally {
      setBusy(false)
    }
  }

  const receiptJournal = file?.journals?.filter((journal) => journal.type === 'RV').slice(-1)[0]
  const receipt = receiptJournal
    ? {
        ...receiptJournal,
        amount: receiptJournal.lines
          .filter((line) => line.debit > 0)
          .reduce((sum, line) => sum + line.debit, 0),
        account: receiptJournal.lines.find((line) => line.debit > 0)?.account,
      }
    : null

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={file ? `${file.fileNo} · ${file.applicant}` : 'Service file'}
      subtitle={file ? `${file.type} · ${file.destination || '—'} · ${formatDateShort(file.date)}` : 'Loading file…'}
      icon={FolderOpen}
      maxWidth="max-w-4xl"
      badge={
        file ? (
          <span
            className={`mr-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[file.status] || STATUS_STYLE.Processing}`}
          >
            {file.status}
          </span>
        ) : null
      }
      footer={
        <>
          {file && file.status !== 'Cancelled' ? (
            <Button
              type="button"
              variant="outline"
              onClick={cancelFile}
              disabled={busy}
              className="mr-auto gap-1.5 text-rose-600"
            >
              <Ban className="size-3.5" />
              Cancel file
            </Button>
          ) : null}
          {file && file.status === 'Processing' ? (
            <Button type="button" variant="outline" onClick={markCompleted} disabled={busy} className="gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Mark completed
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {file ? (
            <Button
              type="button"
              onClick={() => printFileInvoice({ ...file, partyCode: file.party?.code, partyPhone: file.party?.phone })}
              className="gap-1.5 bg-primary text-white hover:bg-primary/90"
            >
              <Printer className="size-3.5" />
              Invoice
            </Button>
          ) : null}
        </>
      }
    >
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading file…</div>
      ) : error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{error}</p>
      ) : file ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Client & applicant</p>
              <p className="mt-1 text-[13px] font-bold text-slate-900">{file.partyName}</p>
              <p className="text-[11px] text-slate-500">
                {file.partyType === 'B2B' ? 'B2B Agent' : 'B2C Retail'} · {file.party?.phone || '—'}
              </p>
              <p className="mt-2 text-[11.5px] text-slate-600">
                Applicant: <strong className="text-slate-800">{file.applicant}</strong>
              </p>
              {file.passportNo ? <p className="text-[11.5px] text-slate-600">Passport: {file.passportNo}</p> : null}
            </div>
            <div className="rounded-xl border border-slate-200 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Service details</p>
              <p className="mt-1 text-[13px] font-bold text-slate-900">{file.destination || '—'}</p>
              <p className="text-[11px] text-slate-500">{file.detail || file.type}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-slate-600">
                <span>Travellers: <strong>{file.pax}</strong></span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3" /> {file.travelDate ? formatDateShort(file.travelDate) : '—'}
                </span>
                <span>Due: {formatDateShort(file.dueDate)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Sale value', value: file.sale, tone: 'text-slate-900' },
              { label: 'Direct cost', value: file.cost, tone: 'text-slate-900' },
              { label: 'Gross profit', value: file.profit, tone: file.profit >= 0 ? 'text-emerald-700' : 'text-rose-600', extra: formatPct(file.margin) },
              { label: 'Balance due', value: file.due, tone: file.due > 0 ? 'text-rose-600' : 'text-emerald-700', extra: file.paymentStatus },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{card.label}</p>
                <p className={`mt-1 text-[15px] font-bold tabular-nums ${card.tone}`}>{formatMoney(card.value)}</p>
                {card.extra ? <p className="text-[10px] font-semibold text-slate-400">{card.extra}</p> : null}
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <FileText className="size-3.5" /> Cost breakdown
              </p>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-[11.5px]">
                  <tbody className="divide-y divide-slate-100">
                    {(file.costLines || []).map((line, index) => (
                      <tr key={index} className="bg-white">
                        <td className="px-3 py-2">
                          <span className="font-medium text-slate-700">{line.label}</span>
                          <span className="block text-[10px] text-slate-400">{line.account}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">
                          {formatMoney(line.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold">
                      <td className="px-3 py-2">Total cost</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMoney(file.cost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <BadgeCheck className="size-3.5" /> Linked vouchers
              </p>
              <div className="max-h-56 overflow-auto rounded-xl border border-slate-200">
                <table className="w-full text-[11.5px]">
                  <tbody className="divide-y divide-slate-100">
                    {(file.journals || []).map((journal) => (
                      <tr key={journal.id} className="bg-white">
                        <td className="px-3 py-2">
                          <span className="font-mono text-[10.5px] font-semibold text-slate-700">{journal.no}</span>
                          <span className="block text-[10px] text-slate-400">{formatDateShort(journal.date)}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{journal.narration}</td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatMoney(journal.debit)}</td>
                      </tr>
                    ))}
                    {!(file.journals || []).length ? (
                      <tr>
                        <td className="px-3 py-4 text-center text-slate-400" colSpan={3}>
                          No vouchers linked.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {file.notes ? <p className="text-[11px] text-slate-500">Notes: {file.notes}</p> : null}

          {file.status !== 'Cancelled' ? (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {file.due > 0 ? (
                <Button
                  type="button"
                  onClick={() => onReceive?.(file)}
                  className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Wallet className="size-3.5" />
                  Receive payment
                </Button>
              ) : null}
              {receipt ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => printMoneyReceipt({ receipt, party: file.party, file })}
                  className="gap-1.5"
                >
                  <ReceiptText className="size-3.5 text-emerald-600" />
                  Print receipt
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </ModalShell>
  )
}
