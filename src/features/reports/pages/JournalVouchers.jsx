import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Ban,
  BookOpenCheck,
  CheckCircle2,
  Eye,
  Filter,
  PlusCircle,
  Printer,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { printReportDocument } from '@/utils/exportEngine'

import AccountingTabs from '../components/AccountingTabs'
import ExportButtons from '../components/ExportButtons'
import VoucherModal from '../components/VoucherModal'
import VoucherDetailModal from '../components/VoucherDetailModal'
import { reportsApi, formatMoney } from '../reports.api'
import { formatDateShort, firstOfMonth, todayISO } from '../accounting/dates'
import { SEGMENTS, VOUCHER_TYPE_OPTIONS } from '../accounting/coa'
import { printJournalVoucher } from '../reports.print'
import {
  Table,
  TableBadge,
  TablePagination,
} from '@/components/re-table'

const PAGE_SIZE = 15

const TYPE_LABEL = {
  OB: 'Opening',
  SV: 'Sale',
  RV: 'Receipt',
  PV: 'Payment',
  JV: 'Journal',
  CV: 'Contra',
}

const TYPE_TONE = { OB: 'gray', SV: 'blue', RV: 'green', PV: 'rose', JV: 'purple', CV: 'amber' }

const inputClass =
  'h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15'

const now = new Date()

const initialFilters = () => ({
  search: '',
  type: '',
  segment: '',
  status: '',
  from: firstOfMonth(now.getFullYear(), now.getMonth()),
  to: todayISO(),
})

export default function JournalVouchers() {
  const [filters, setFilters] = useState(initialFilters)
  const [data, setData] = useState({ rows: [], summary: { count: 0, debit: 0, credit: 0 } })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [voucherOpen, setVoucherOpen] = useState(false)
  const [journalId, setJournalId] = useState(null)
  const [lookups, setLookups] = useState({ accounts: [], parties: [], files: [] })
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await reportsApi.getJournals(filters)
      if (response.success) setData(response.data)
    } catch (err) {
      console.error(err)
      setNotice({ type: 'error', text: err?.message || 'Could not load the journal register.' })
    } finally {
      setLoading(false)
    }
  }, [filters])

  const loadLookups = useCallback(async () => {
    try {
      const [accountsRes, partiesRes, filesRes] = await Promise.all([
        reportsApi.getChartOfAccounts(),
        reportsApi.getParties(),
        reportsApi.getFiles({}),
      ])
      setLookups({
        accounts: accountsRes.data.rows,
        parties: partiesRes.data,
        files: filesRes.data.rows,
      })
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadLookups()
  }, [loadLookups])

  useEffect(() => {
    setPage(1)
  }, [filters])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3200)
    return () => clearTimeout(timer)
  }, [notice])

  const setFilter = (key) => (event) => {
    const value = event?.target ? event.target.value : event
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const clearFilters = () => setFilters(initialFilters())

  const pages = Math.max(1, Math.ceil(data.rows.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const pageRows = useMemo(
    () => data.rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [data.rows, current]
  )

  const posted = data.rows.filter((row) => row.status !== 'void').length
  const voided = data.rows.filter((row) => row.status === 'void').length

  const handleSave = async (payload) => {
    await reportsApi.createJournal(payload)
    setNotice({ type: 'success', text: 'Voucher posted to the ledger.' })
    await Promise.all([load(), loadLookups()])
  }

  const handleVoid = async (row) => {
    if (!window.confirm(`Void ${row.no}? The voucher stays in the register but stops affecting reports.`)) {
      return
    }
    try {
      await reportsApi.voidJournal(row.id)
      setNotice({ type: 'success', text: `${row.no} voided.` })
      await load()
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not void the voucher.' })
    }
  }

  const handlePrint = async (row) => {
    try {
      const response = await reportsApi.getJournal(row.id)
      printJournalVoucher(response.data)
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not print this voucher.' })
    }
  }

  const printRegister = () => {
    printReportDocument({
      title: 'Journal Register',
      subtitle: 'All vouchers in the selected period',
      dateRange: `${formatDateShort(filters.from)} — ${formatDateShort(filters.to)}`,
      headers: [
        { key: 'date', label: 'Date' },
        { key: 'no', label: 'Voucher' },
        { key: 'type', label: 'Type' },
        { key: 'narration', label: 'Narration' },
        { key: 'debit', label: 'Debit', align: 'right', isCurrency: true },
        { key: 'credit', label: 'Credit', align: 'right', isCurrency: true },
      ],
      rows: data.rows.map((row) => ({
        date: formatDateShort(row.date),
        no: row.no,
        type: TYPE_LABEL[row.type] || row.type,
        narration: row.narration,
        debit: formatMoney(row.debit),
        credit: formatMoney(row.credit),
      })),
      summaryTotals: [
        { value: `${data.rows.length} vouchers`, colspan: 4 },
        { value: formatMoney(data.summary.debit), align: 'right' },
        { value: formatMoney(data.summary.credit), align: 'right' },
      ],
      metadata: {
        Posted: posted,
        Voided: voided,
        Segment: filters.segment ? SEGMENTS.find((segment) => segment.id === filters.segment)?.name : 'All',
      },
    })
  }

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => (
        <span className="whitespace-nowrap text-[11.5px] font-medium text-slate-600">
          {formatDateShort(row.date)}
        </span>
      ),
    },
    {
      key: 'no',
      header: 'Voucher',
      render: (row) => (
        <div>
          <span className="font-mono text-[11px] font-bold text-slate-800">{row.no}</span>
          {row.ref ? <span className="block text-[10px] text-slate-400">{row.ref}</span> : null}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <TableBadge type="pill" variant={TYPE_TONE[row.type] || 'gray'} className="!px-2 !py-0.5 !text-[10px]">
          {TYPE_LABEL[row.type] || row.type}
        </TableBadge>
      ),
    },
    {
      key: 'narration',
      header: 'Narration',
      render: (row) => (
        <div className="max-w-[280px]">
          <span className={`block truncate text-[12px] ${row.status === 'void' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
            {row.narration}
          </span>
          <span className="block text-[10px] text-slate-400">
            {row.partyName || row.fileNo || row.segmentName}
          </span>
        </div>
      ),
    },
    {
      key: 'segment',
      header: 'Segment',
      render: (row) => (
        <span className="text-[11px] font-medium text-slate-500">{row.segmentName || 'General'}</span>
      ),
    },
    {
      key: 'debit',
      header: 'Debit',
      align: 'right',
      render: (row) => (
        <span className="text-[11.5px] font-semibold tabular-nums text-slate-800">{formatMoney(row.debit)}</span>
      ),
    },
    {
      key: 'credit',
      header: 'Credit',
      align: 'right',
      render: (row) => (
        <span className="text-[11.5px] font-semibold tabular-nums text-slate-800">{formatMoney(row.credit)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <TableBadge type="status" variant={row.status === 'void' ? 'danger' : 'success'} showDot={false}>
          {row.status}
        </TableBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-0.5" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={() => setJournalId(row.id)}
            className="grid size-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-primary"
            title="View voucher"
          >
            <Eye className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handlePrint(row)}
            className="grid size-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="Print voucher"
          >
            <Printer className="size-3.5" />
          </button>
          {row.status !== 'void' ? (
            <button
              type="button"
              onClick={() => handleVoid(row)}
              className="grid size-7 place-items-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              title="Void voucher"
            >
              <Ban className="size-3.5" />
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Journal Vouchers"
        description="Every debit and credit posted to the books, with supporting narration and links to files."
        breadcrumbs={[{ label: 'Accounts', to: '/reports/overview' }, { label: 'Journal' }]}
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <ExportButtons
              onCsv={() => reportsApi.exportJournals(filters, 'csv')}
              onExcel={() => reportsApi.exportJournals(filters, 'excel')}
              onPrint={printRegister}
              csvLabel="Export"
            />
            <Button size="sm" onClick={() => setVoucherOpen(true)} className="gap-1.5 bg-primary text-white">
              <PlusCircle className="size-3.5" /> New voucher
            </Button>
          </div>
        }
      />

      <AccountingTabs />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_4px_24px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={setFilter('search')}
              placeholder="Search voucher no, narration, party or file…"
              className={`${inputClass} w-full pl-9`}
            />
            {filters.search ? (
              <button
                type="button"
                onClick={() => setFilter('search')('')}
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-slate-400 hover:bg-slate-100"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select value={filters.type} onChange={setFilter('type')} className={inputClass} aria-label="Voucher type">
              <option value="">All types</option>
              {VOUCHER_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select value={filters.segment} onChange={setFilter('segment')} className={inputClass} aria-label="Segment">
              <option value="">All segments</option>
              {SEGMENTS.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
            <select value={filters.status} onChange={setFilter('status')} className={inputClass} aria-label="Status">
              <option value="">All statuses</option>
              <option value="posted">Posted</option>
              <option value="void">Void</option>
            </select>
            <input
              type="date"
              value={filters.from}
              onChange={setFilter('from')}
              className={inputClass}
              aria-label="From"
            />
            <span className="text-[11px] text-slate-400">to</span>
            <input type="date" value={filters.to} onChange={setFilter('to')} className={inputClass} aria-label="To" />
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
            >
              <Filter className="size-3.5" /> Reset
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-slate-100 pt-3 text-[11px]">
          <span className="text-slate-500">
            Vouchers <strong className="ml-1 tabular-nums text-slate-800">{data.rows.length}</strong>
          </span>
          <span className="text-emerald-700">
            Posted <strong className="ml-1 tabular-nums">{posted}</strong>
          </span>
          {voided > 0 ? (
            <span className="text-rose-600">
              Void <strong className="ml-1 tabular-nums">{voided}</strong>
            </span>
          ) : null}
          <span className="text-slate-500">
            Debit <strong className="ml-1 tabular-nums text-slate-800">{formatMoney(data.summary.debit)}</strong>
          </span>
          <span className="text-slate-500">
            Credit <strong className="ml-1 tabular-nums text-slate-800">{formatMoney(data.summary.credit)}</strong>
          </span>
          <span
            className={`ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold ${
              Math.abs(data.summary.debit - data.summary.credit) < 1
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            <CheckCircle2 className="size-3" />
            {Math.abs(data.summary.debit - data.summary.credit) < 1 ? 'Register balanced' : 'Check totals'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center">
          <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-500">Loading journal register…</p>
        </div>
      ) : (
        <Table
          columns={columns}
          data={pageRows}
          headerClassName="bg-[#0F172A] text-white"
          emptyText="No vouchers match these filters"
          emptyDescription="Change the period or clear the filters to see more."
          onRowClick={(row) => setJournalId(row.id)}
        />
      )}

      <TablePagination
        currentPage={current}
        totalEntries={data.rows.length}
        pageSize={PAGE_SIZE}
        itemLabel="vouchers"
        onPageChange={setPage}
      />

      <VoucherModal
        open={voucherOpen}
        onOpenChange={setVoucherOpen}
        accounts={lookups.accounts}
        parties={lookups.parties}
        files={lookups.files}
        onSave={handleSave}
      />
      <VoucherDetailModal
        open={Boolean(journalId)}
        onOpenChange={(open) => !open && setJournalId(null)}
        journalId={journalId}
        onChanged={load}
        onPrint={printJournalVoucher}
      />

      {notice ? (
        <div
          role="status"
          className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[12px] font-semibold shadow-lg ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 className="size-4" /> : <RefreshCw className="size-4" />}
          {notice.text}
        </div>
      ) : null}

      <p className="flex items-center justify-center gap-1.5 text-[10.5px] text-slate-400">
        <BookOpenCheck className="size-3" />
        {data.rows.length} vouchers · showing {pageRows.length} on this page
      </p>
    </div>
  )
}
