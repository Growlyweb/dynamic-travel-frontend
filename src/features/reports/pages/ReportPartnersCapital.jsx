import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Landmark,
  Plus,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Trash2,
  Info,
  Users,
  CheckCircle2,
} from 'lucide-react'

import { reportsApi, formatMoney } from '../reports.api'
import ReportTabs from '../components/ReportTabs'
import ReportMetricCard from '../components/ReportMetricCard'
import ReportDonutChart from '../components/ReportDonutChart'
import AddPartnerCapitalModal from '../components/AddPartnerCapitalModal'
import {
  Table,
  TableCard,
  TableHeader,
  TableBadge,
} from '@/components/re-table'

export default function ReportPartnersCapital() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await reportsApi.getPartnersCapital()
      if (res.success) {
        setData(res.data)
      }
    } catch (err) {
      console.error('Failed to load partner capital data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddRecord = async (recordData) => {
    await reportsApi.addPartnerRecord(recordData)
    loadData()
  }

  const handleDeleteRecord = async (date, partner, amount) => {
    if (window.confirm(`Delete capital transaction of ${formatMoney(amount)} for Partner ${partner}?`)) {
      await reportsApi.deletePartnerRecord(date, partner, amount)
      loadData()
    }
  }

  const handleExport = (format) => {
    reportsApi.exportPartnersCapital(format)
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Partners & Capital"
          description="Capital investments, partner drawings, equity ownership shares, and monthly profit entitlements."
          breadcrumbs={[{ label: 'Reports', to: '/reports/overview' }, { label: 'Partners & Capital' }]}
        />
        <ReportTabs />
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Loading partner accounts...</p>
        </div>
      </div>
    )
  }

  const {
    partners = [],
    partnerA,
    partnerB,
    totalInvested = 0,
    totalWithdrawn = 0,
    totalNetCapital = 0,
    monthlyProfitPool = 0,
    history = [],
  } = data || {}

  const equitySegments = [
    {
      label: 'Partner A',
      value: partnerA?.net || 0,
      color: '#0879E8',
    },
    {
      label: 'Partner B',
      value: partnerB?.net || 0,
      color: '#16a34a',
    },
  ]

  const historyColumns = [
    {
      key: 'd',
      header: 'Transaction Date',
      render: (row) => <span className="font-medium text-foreground text-sm">{row.d}</span>,
    },
    {
      key: 'p',
      header: 'Partner',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${row.p === 'A'
            ? 'bg-primary-soft text-primary'
            : 'bg-emerald-50 text-emerald-700'
            }`}
        >
          Partner {row.p}
        </span>
      ),
    },
    {
      key: 't',
      header: 'Type',
      render: (row) => {
        const isInv = row.t === 'Investment'
        return (
          <div className="flex items-center gap-1.5">
            {isInv ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ArrowDownLeft className="size-3" />
                <span>Investment</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <ArrowUpRight className="size-3" />
                <span>Withdrawal</span>
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'a',
      header: 'Amount',
      align: 'right',
      render: (row) => {
        const isInv = row.t === 'Investment'
        return (
          <span className={`font-bold ${isInv ? 'text-emerald-700' : 'text-rose-600'}`}>
            {isInv ? '+' : '−'}
            {formatMoney(row.a)}
          </span>
        )
      },
    },
    {
      key: 'note',
      header: 'Purpose / Description',
      render: (row) => (
        <span className="text-muted-foreground text-xs">{row.note || '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'center',
      render: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteRecord(row.d, row.p, row.a)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
          title="Delete record"
        >
          <Trash2 className="size-3.5" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partners & Capital"
        // description="Two-partner equity distribution, capital contribution accounts, drawings history, and monthly net profit allocations."
        breadcrumbs={[
          { label: 'Reports', to: '/reports/overview' },
          { label: 'Partners & Capital' },
        ]}
      />

      {/* 2. Ownership Distribution & Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ownership Donut Chart */}
        <div className="space-y-4">
          <ReportDonutChart
            title="Equity Ownership Ratio"
            segments={equitySegments}
            centerLabel={formatMoney(totalNetCapital)}
            centerSub="Net Capital"
          />

          {/* Stacked Ownership Bar */}
          <div className="card space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-[#0879E8]">
                Partner A: {(partnerA?.sharePercent || 50).toFixed(1)}%
              </span>
              <span className="text-[#16a34a]">
                Partner B: {(partnerB?.sharePercent || 50).toFixed(1)}%
              </span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
              <div
                style={{ width: `${partnerA?.sharePercent || 50}%` }}
                className="bg-[#0879E8] transition-all"
                title={`Partner A: ${(partnerA?.sharePercent || 50).toFixed(1)}%`}
              />
              <div
                style={{ width: `${partnerB?.sharePercent || 50}%` }}
                className="bg-[#16a34a] transition-all"
                title={`Partner B: ${(partnerB?.sharePercent || 50).toFixed(1)}%`}
              />
            </div>
          </div>
        </div>

        {/* Partner Summary Table Card */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <p className="card__title mb-0">Partner Balances & Profit Share</p>
            <span className="text-xs font-medium text-muted-foreground">Current Period</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Partner</th>
                  <th className="py-2.5 px-3 text-right">Invested</th>
                  <th className="py-2.5 px-3 text-right">Withdrawn</th>
                  <th className="py-2.5 px-3 text-right">Net Capital</th>
                  <th className="py-2.5 px-3 text-right">Share %</th>
                  <th className="py-2.5 px-3 text-right">Profit Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {partners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span>{p.name}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium">{formatMoney(p.invested)}</td>
                    <td className="py-3 px-3 text-right font-medium text-rose-600">
                      {formatMoney(p.withdrawn)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-foreground">
                      {formatMoney(p.net)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-primary">
                      {p.sharePercent.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      {formatMoney(p.profitShare)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-bold bg-slate-50 text-foreground">
                  <td className="py-3 px-3">Total Consolidated</td>
                  <td className="py-3 px-3 text-right">{formatMoney(totalInvested)}</td>
                  <td className="py-3 px-3 text-right text-rose-600">{formatMoney(totalWithdrawn)}</td>
                  <td className="py-3 px-3 text-right">{formatMoney(totalNetCapital)}</td>
                  <td className="py-3 px-3 text-right">100.0%</td>
                  <td className="py-3 px-3 text-right text-emerald-700">
                    {formatMoney(monthlyProfitPool)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="p-3 bg-primary-soft/30 border border-primary/20 rounded-lg text-xs text-primary flex items-start gap-2">
            <Info className="size-4 shrink-0 mt-0.5" />
            <span>
              Net profit is distributed dynamically proportional to each partner's Net Capital Employed balance. If an alternative fixed ratio is mutually agreed, it can be adjusted in the partnership deed.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Transaction History */}
      <TableCard>
        <TableHeader
          title="Capital Transactions & Ledger History"
          description={`Showing ${history.length} logged investment and withdrawal records`}
          actions={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                className="gap-1.5 text-xs h-9 bg-white"
              >
                <Download className="size-3.5" />
                <span>Export CSV</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExport('excel')}
                className="gap-1.5 text-xs h-9 bg-white"
              >
                <Download className="size-3.5" />
                <span>Export Excel</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary-strong text-white"
              >
                <Plus className="size-3.5" />
                <span>Add Record</span>
              </Button>
            </div>
          }
        />

        <Table
          columns={historyColumns}
          data={history}
          emptyMessage="No capital transactions recorded yet."
        />
      </TableCard>

      {/* Modal */}
      <AddPartnerCapitalModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleAddRecord}
      />
    </div>
  )
}
