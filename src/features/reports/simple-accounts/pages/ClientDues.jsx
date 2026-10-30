import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { HandCoins, Search } from 'lucide-react'

import SimpleTabs from '../components/SimpleTabs'
import MoneyReceiptModal from '../components/MoneyReceiptModal'
import BigCard from '../components/BigCard'
import SectionCard from '@/features/reports/components/SectionCard'
import ReportDonutChart from '@/features/reports/components/ReportDonutChart'
import AgingBars from '@/features/reports/components/AgingBars'
import { simpleApi } from '../simple.api'
import { usePermission } from '@/hooks/usePermission'
import { useServerTable } from '@/hooks/useServerTable'
import { useToast } from '@/context/ToastContext'
import { PERMISSIONS } from '@/utils/permissions'
import { errorMessage } from '@/utils/errors'
import { formatMoney } from '@/features/reports/lib/format'
import { formatDateShort } from '@/features/reports/lib/dates'
import { Table, TablePagination } from '@/components/re-table'

export default function ClientDues() {
  const { can } = usePermission()
  const toast = useToast()
  const [typeFilter, setTypeFilter] = useState('')
  const [aging, setAging] = useState([])
  const [receiptFor, setReceiptFor] = useState(null)

  const table = useServerTable({ table: 'accounts-dues', fetcher: simpleApi.listDue, filters: { type: typeFilter } })
  const totals = table.extras.totals ?? {}
  const canReceive = can(PERMISSIONS.ACCOUNTS_EDIT)

  // How long money has been waiting, counted from each file's due date, over everything that is owed today.
  useEffect(() => {
    simpleApi.getHome().then((home) => setAging(home.aging ?? [])).catch((error) => toast.error(errorMessage(error)))
  }, [toast, table.rows])

  const columns = [
    {
      key: 'fileNo',
      header: 'Invoice',
      render: (row) => <span className="text-sm font-bold text-slate-900">{row.fileNo}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => <span className="whitespace-nowrap text-sm text-slate-600">{formatDateShort(row.date)}</span>,
    },
    {
      key: 'client',
      header: 'Client',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-slate-900">{row.partyName}</p>
          <p className="text-xs text-slate-400">{row.partyType === 'B2B' ? 'B2B Agent' : 'B2C Customer'}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span className="text-sm text-slate-600">{row.category}</span>,
    },
    {
      key: 'sale',
      header: 'Selling Price',
      align: 'right',
      render: (row) => <span className="text-sm tabular-nums text-slate-700">{formatMoney(row.sale)}</span>,
    },
    {
      key: 'received',
      header: 'Received',
      align: 'right',
      render: (row) => <span className="text-sm tabular-nums text-emerald-700">{formatMoney(row.received)}</span>,
    },
    {
      key: 'due',
      header: 'Due',
      align: 'right',
      render: (row) => (
        <span className={`text-sm font-bold tabular-nums ${row.due > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
          {formatMoney(row.due)}
        </span>
      ),
    },
    {
      key: 'days',
      header: 'Days Waiting',
      align: 'center',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
            row.daysOverdue > 0 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {row.daysWaiting} days
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      render: (row) => (
        canReceive ? (
          <button
            type="button"
            onClick={() => setReceiptFor(row)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#2F80ED] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1d6fd0]"
          >
            <HandCoins className="size-3.5" /> Money Receipt
          </button>
        ) : null
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Client Dues"
        description="Every client who still owes money, oldest first."
        breadcrumbs={[{ label: 'Accounts', to: '/accounts' }, { label: 'Client Dues' }]}
        actions={
          canReceive ? (
            <button
              type="button"
              onClick={() => setReceiptFor({})}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#2F80ED] px-5 text-base font-semibold text-white hover:bg-[#1d6fd0]"
            >
              <HandCoins className="size-5" /> Money Receipt
            </button>
          ) : null
        }
      />

      <SimpleTabs />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigCard label="Total Due" value={formatMoney(totals.due || 0)} hint={`${totals.count || 0} sales with due`} tone="red" />
        <BigCard label="B2B Due" value={formatMoney(totals.b2b || 0)} hint="Agents who owe us" tone="blue" />
        <BigCard label="B2C Due" value={formatMoney(totals.b2c || 0)} hint="Customers who owe us" tone="green" />
        <BigCard label="Overdue" value={formatMoney(totals.overdue || 0)} hint="Past the due date" tone="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="B2B and B2C Dues" subtitle="Where the unpaid money sits">
          <ReportDonutChart
            bare
            title=""
            segments={[
              { label: 'B2B Agents', value: totals.b2b || 0, color: '#0879E8' },
              { label: 'B2C Customers', value: totals.b2c || 0, color: '#16A34A' },
            ]}
            centerSub="Total Due"
          />
        </SectionCard>
        <SectionCard title="How Long Money Has Been Waiting" subtitle="Counted from the due date of each file">
          <AgingBars aging={aging} total={totals.due || 0} columns={5} />
        </SectionCard>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={table.search}
            onChange={(event) => table.setSearch(event.target.value)}
            placeholder="Search invoice, client or category…"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-base outline-none focus:border-[#2F80ED]"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none focus:border-[#2F80ED]"
        >
          <option value="">All clients</option>
          <option value="B2B">B2B Agents</option>
          <option value="B2C">B2C Customers</option>
        </select>
      </div>

      {table.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          {errorMessage(table.error)}{' '}
          <button type="button" onClick={table.reload} className="font-semibold underline">Try again</button>
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-500 lg:hidden">Swipe the table sideways to see the Due and Money Receipt button.</p>
          <Table
            columns={columns}
            data={table.rows}
            loading={table.loading}
            refreshing={table.refreshing}
            headerClassName="bg-[#2F80ED] text-white"
            emptyText="No client dues"
            emptyDescription="Everybody has paid. Good."
          />
          <TablePagination {...table.paginationProps} itemLabel="dues" />
        </>
      )}

      <MoneyReceiptModal
        open={Boolean(receiptFor)}
        onOpenChange={(open) => !open && setReceiptFor(null)}
        sale={receiptFor && receiptFor.id ? receiptFor : null}
        sales={table.rows}
        onSave={async (payload) => {
          await simpleApi.addReceipt(payload)
          table.reload()
          toast.success('Money receipt saved. Due updated.')
        }}
      />

    </div>
  )
}
