import { Eye, HandCoins, Pencil, PlusCircle } from 'lucide-react'
import ModalShell from '@/features/reports/components/ModalShell'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/features/reports/reports.api'
import { formatDateShort } from '@/features/reports/accounting/dates'

export default function SaleViewModal({ open, onOpenChange, sale, onEdit, onReceipt, onCost }) {
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={sale ? `${sale.fileNo} — ${sale.partyName}` : 'Sale'}
      subtitle={sale ? `${sale.category} · ${formatDateShort(sale.date)}` : ''}
      icon={Eye}
      maxWidth="max-w-2xl"
      badge={
        sale ? (
          <span
            className={`mr-1 rounded-full border px-3 py-1 text-xs font-bold ${
              sale.status === 'Cancelled'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : sale.due <= 0
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-blue-200 bg-[#E6F2FD] text-[#2F80ED]'
            }`}
          >
            {sale.status === 'Cancelled' ? 'Cancelled' : sale.due <= 0 ? 'Paid' : 'Due'}
          </span>
        ) : null
      }
      footer={
        <>
          {sale && sale.status !== 'Cancelled' ? (
            <>
              <Button type="button" variant="outline" onClick={() => onCost?.(sale)} className="mr-auto h-11 gap-2 px-4 text-base">
                <PlusCircle className="size-4" /> Add Cost
              </Button>
              <Button type="button" variant="outline" onClick={() => onEdit?.(sale)} className="h-11 gap-2 px-4 text-base">
                <Pencil className="size-4" /> Edit
              </Button>
              {sale.due > 0 ? (
                <Button type="button" onClick={() => onReceipt?.(sale)} className="h-11 gap-2 bg-[#2F80ED] px-5 text-base text-white">
                  <HandCoins className="size-4" /> Money Receipt
                </Button>
              ) : null}
            </>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-4 text-base">
            Close
          </Button>
        </>
      }
    >
      {sale ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-500">Client</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{sale.partyName}</p>
              <p className="text-sm text-slate-500">
                {sale.partyType === 'B2B' ? 'B2B Agent' : 'B2C Customer'} {sale.detail ? `· ${sale.detail}` : ''}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-500">Sale</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{sale.category}</p>
              <p className="text-sm text-slate-500">
                {formatDateShort(sale.date)} {sale.receiptNo ? `· Receipt ${sale.receiptNo}` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Selling Price', value: sale.sale, color: 'text-slate-900' },
              { label: 'Cost Price', value: sale.cost, color: 'text-slate-900' },
              { label: 'Profit', value: sale.profit, color: sale.profit >= 0 ? 'text-emerald-700' : 'text-rose-600' },
              { label: 'Due', value: sale.due, color: sale.due > 0 ? 'text-rose-600' : 'text-emerald-700' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                <p className={`mt-1 text-lg font-bold tabular-nums ${item.color}`}>{formatMoney(item.value)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Received</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">{formatMoney(sale.received)}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-[#E6F2FD] p-4">
              <p className="text-sm font-semibold text-[#2F80ED]">Due</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[#2F80ED]">{formatMoney(sale.due)}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-slate-700">Cost Breakdown</p>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {(sale.costLines || []).map((line, index) => (
                    <tr key={index} className="bg-white">
                      <td className="px-3 py-2 text-slate-700">{line.label}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                        {formatMoney(line.amount)}
                      </td>
                    </tr>
                  ))}
                  {!(sale.costLines || []).length ? (
                    <tr>
                      <td className="px-3 py-3 text-center text-slate-400" colSpan={2}>
                        No cost added.
                      </td>
                    </tr>
                  ) : null}
                  <tr className="bg-slate-50 font-bold">
                    <td className="px-3 py-2">Total Cost</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatMoney(sale.cost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {sale.notes ? <p className="text-sm text-slate-500">Note: {sale.notes}</p> : null}
        </div>
      ) : null}
    </ModalShell>
  )
}
