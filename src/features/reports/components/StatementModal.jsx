import { useEffect, useState } from 'react'
import { FileText, Printer } from 'lucide-react'
import ModalShell from './ModalShell'
import { Button } from '@/components/ui/button'
import { reportsApi, formatMoney } from '../reports.api'
import { formatDateShort } from '../accounting/dates'
import { printPartyStatement } from '../reports.print'

export default function StatementModal({ open, onOpenChange, partyId }) {
  const [statement, setStatement] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !partyId) return
    let active = true
    setLoading(true)
    setError('')
    reportsApi
      .getPartyStatement(partyId)
      .then((response) => {
        if (active) setStatement(response.data)
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Could not load the statement.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open, partyId])

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={statement ? `Statement — ${statement.party.name}` : 'Statement of account'}
      subtitle={
        statement
          ? `${statement.party.code} · ${statement.party.type === 'Vendor' ? 'Supplier payable' : 'Customer receivable'}`
          : 'Loading ledger…'
      }
      icon={FileText}
      maxWidth="max-w-4xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            disabled={!statement}
            onClick={() => printPartyStatement(statement)}
            className="gap-1.5 bg-primary text-white hover:bg-primary/90"
          >
            <Printer className="size-3.5" />
            Print statement
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Building statement…</div>
      ) : error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{error}</p>
      ) : statement ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Opening</p>
              <p className="mt-0.5 text-[13px] font-bold tabular-nums text-slate-800">
                {formatMoney(statement.rows[0]?.balance - statement.rows[0]?.debit + statement.rows[0]?.credit || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Debit / credit</p>
              <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-slate-700">
                {formatMoney(statement.debit)} / {formatMoney(statement.credit)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {statement.party.type === 'Vendor' ? 'Payable' : 'Receivable'}
              </p>
              <p className="mt-0.5 text-[13px] font-bold tabular-nums text-emerald-700">
                {formatMoney(statement.closing)}
              </p>
            </div>
          </div>

          <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-[11.5px]">
              <thead className="sticky top-0 bg-[#0F172A] text-white">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold">Date</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Voucher</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Particulars</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Debit</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Credit</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statement.rows.map((row) => (
                  <tr key={`${row.id}-${row.no}`} className="bg-white">
                    <td className="whitespace-nowrap px-3 py-2">{formatDateShort(row.date)}</td>
                    <td className="px-3 py-2 font-mono text-[10.5px] text-slate-500">{row.no}</td>
                    <td className="px-3 py-2">
                      <span className="text-slate-700">{row.narration}</span>
                      {row.ref ? <span className="block text-[10px] text-slate-400">{row.ref}</span> : null}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.debit ? formatMoney(row.debit) : '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.credit ? formatMoney(row.credit) : '—'}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">
                      {formatMoney(row.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </ModalShell>
  )
}
