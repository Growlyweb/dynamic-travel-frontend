import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { CalendarDays, Download, Eye, HandCoins, Search, Trash2 } from 'lucide-react'

import SimpleTabs from '../components/SimpleTabs'
import BigCard from '../components/BigCard'
import MoneyReceiptModal from '../components/MoneyReceiptModal'
import ReceiptViewModal from '../components/ReceiptViewModal'
import ReasonModal from '../components/ReasonModal'
import { simpleApi } from '../simple.api'
import { usePermission } from '@/hooks/usePermission'
import { useServerTable } from '@/hooks/useServerTable'
import { useToast } from '@/context/ToastContext'
import { PERMISSIONS } from '@/utils/permissions'
import { errorMessage } from '@/utils/errors'
import { formatMoney } from '@/features/reports/lib/format'
import { formatDateShort } from '@/features/reports/lib/dates'
import { printSimpleReceipt } from '../receipts.print'
import { Table, TablePagination } from '@/components/re-table'

export default function MoneyReceipts() {
  const { can } = usePermission()
  const toast = useToast()
  const canReceive = can(PERMISSIONS.ACCOUNTS_EDIT)
  const canVoid = can(PERMISSIONS.ACCOUNTS_VOID)

  const [dates, setDates] = useState({ from: '', to: '' })
  const [dues, setDues] = useState([])
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [viewNo, setViewNo] = useState('')
  const [voiding, setVoiding] = useState(null)

  const table = useServerTable({ table: 'accounts-receipts', fetcher: simpleApi.listReceipts, filters: dates })
  const summary = table.extras.summary ?? {}
  const current = table.page
  const pageSize = table.pageSize

  // The invoices that still owe money, for the receipt form.
  const loadDues = () => simpleApi.listDue({ pageSize: 500 }).then((result) => setDues(result.rows)).catch((error) => toast.error(errorMessage(error)))
  useEffect(() => {
    loadDues()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const columns = [
    {
      key: 'sl',
      header: 'SL.',
      render: (row, index) => (
        <span className="text-sm text-slate-500">{(current - 1) * pageSize + index + 1}</span>
      ),
    },
    {
      key: 'date',
      header: 'Payment Date',
      render: (row) => <span className="whitespace-nowrap text-sm text-slate-600">{formatDateShort(row.date)}</span>,
    },
    {
      key: 'no',
      header: 'Voucher No',
      render: (row) => (
        <div>
          <button
            type="button"
            onClick={() => setViewNo(row.no)}
            className="text-sm font-bold text-[#2F80ED] hover:underline"
          >
            {row.no}
          </button>
          <p className="text-[11px] text-slate-400">Doc: {row.invoiceNo || 'Overall'}</p>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client Name',
      render: (row) => (
        <div className="min-w-40 max-w-52">
          <p className="truncate text-sm font-semibold text-slate-900">{row.clientName}</p>
          <p className="text-[11px] text-slate-500">{row.clientPhone || '—'}</p>
          <p className="truncate text-[10px] text-slate-400">{row.category}</p>
        </div>
      ),
    },
    {
      key: 'invoiceType',
      header: 'Invoice Type',
      render: (row) => (
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#2F80ED]">
          {row.invoiceType}
        </span>
      ),
    },
    {
      key: 'payment',
      header: 'Payment Type',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-slate-800">{row.paymentType}</p>
          <p className="text-[10px] text-slate-400">{row.accountName}</p>
        </div>
      ),
    },
    {
      key: 'manualNo',
      header: 'Paper Receipt No',
      render: (row) => <span className="text-sm text-slate-500">{row.manualNo || '—'}</span>,
    },
    {
      key: 'amount',
      header: 'Paid Amount',
      align: 'right',
      render: (row) => (
        <div className="whitespace-nowrap text-right">
          <p className="text-sm font-bold tabular-nums text-slate-900">{formatMoney(row.amount)}</p>
          {row.discount > 0 ? (
            <p className="text-[10px] text-amber-600">Discount {formatMoney(row.discount)}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'center',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewNo(row.no)}
            className="inline-flex items-center gap-1 rounded-md bg-[#2F80ED] px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-[#1d6fd0]"
          >
            <Eye className="size-3" /> View
          </button>
          <button
            type="button"
            onClick={() => printSimpleReceipt(row)}
            className="inline-flex items-center gap-1 rounded-md bg-[#2F80ED] px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-[#1d6fd0]"
          >
            <Download className="size-3" /> Print
          </button>
          {canVoid ? (
            <button
              type="button"
              onClick={() => setVoiding(row)}
              className="inline-flex items-center gap-1 rounded-md bg-[#DC2626] px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-[#b91c1c]"
            >
              <Trash2 className="size-3" /> Void
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Money Receipts"
        description="Every payment received, with its MR number, client, account and printable receipt."
        breadcrumbs={[{ label: 'Accounts', to: '/accounts' }, { label: 'Money Receipts' }]}
        actions={
          canReceive ? (
            <Button
              onClick={() => setReceiptOpen(true)}
              className="h-11 gap-2 bg-[#2F80ED] px-5 text-base text-white hover:bg-[#1d6fd0]"
            >
              <HandCoins className="size-5" /> Add Money Receipt
            </Button>
          ) : null
        }
      />

      <SimpleTabs />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigCard label="Total Received" value={formatMoney(summary.total || 0)} hint={`${summary.count || 0} receipts`} tone="green" />
        <BigCard label="Cash" value={formatMoney(summary.cash || 0)} hint="Cash receipts" tone="blue" />
        <BigCard label="Bank" value={formatMoney(summary.bank || 0)} hint="Bank receipts" tone="slate" />
        <BigCard label="bKash" value={formatMoney(summary.bkash || 0)} hint="Mobile wallet" tone="amber" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={table.search}
            onChange={(event) => table.setSearch(event.target.value)}
            placeholder="Search MR no, client, invoice or phone…"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-base outline-none focus:border-[#2F80ED]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDays className="size-4 text-slate-400" />
          <input
            type="date"
            value={dates.from}
            onChange={(event) => setDates((value) => ({ ...value, from: event.target.value }))}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#2F80ED]"
          />
          <span className="text-sm text-slate-400">to</span>
          <input
            type="date"
            value={dates.to}
            onChange={(event) => setDates((value) => ({ ...value, to: event.target.value }))}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#2F80ED]"
          />
          {dates.from || dates.to || table.search ? (
            <button
              type="button"
              onClick={() => {
                setDates({ from: '', to: '' })
                table.setSearch('')
              }}
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {table.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          {errorMessage(table.error)}{' '}
          <button type="button" onClick={table.reload} className="font-semibold underline">Try again</button>
        </p>
      ) : (
        <>
          <Table
            columns={columns}
            data={table.rows}
            dense
            loading={table.loading}
            refreshing={table.refreshing}
            headerClassName="bg-[#2F80ED] text-white"
            emptyText="No money receipts yet"
            emptyDescription="Receive a payment from a sale and it will appear here."
          />
          <TablePagination {...table.paginationProps} itemLabel="receipts" />
        </>
      )}

      <MoneyReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        sales={dues}
        onSave={async (payload) => {
          const receipt = await simpleApi.addReceipt(payload)
          table.reload()
          loadDues()
          setViewNo(receipt.no)
          toast.success('Money receipt saved.')
        }}
      />

      <ReasonModal
        open={Boolean(voiding)}
        onOpenChange={(open) => !open && setVoiding(null)}
        title={`Void receipt ${voiding?.no ?? ''}`}
        subtitle="The receipt stays in the history, marked as voided."
        confirmLabel="Void receipt"
        onConfirm={async (reason) => {
          await simpleApi.voidReceipt(voiding.id, reason)
          table.reload()
          loadDues()
          toast.success('Receipt voided. The client due is back.')
        }}
      >
        {voiding ? (
          <p className="text-sm text-slate-600">
            The client due goes up by {formatMoney(voiding.totalApplied)} and the money is taken out of {voiding.paymentType}.
          </p>
        ) : null}
      </ReasonModal>

      <ReceiptViewModal open={Boolean(viewNo)} onOpenChange={(open) => !open && setViewNo('')} receiptNo={viewNo} />

    </div>
  )
}
