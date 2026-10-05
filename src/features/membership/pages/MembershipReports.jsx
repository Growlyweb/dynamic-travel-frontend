import { useCallback, useEffect, useState } from 'react'
import { BadgeCheck, Banknote, Clock3, UserX } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import StatCard from '../../../components/charts/StatCard'
import BarChart from '../../../components/charts/BarChart'
import DonutChart from '../../../components/charts/DonutChart'
import DataTable from '../../../components/tables/DataTable'
import { membershipApi } from '../membership.api'
import { formatCurrency, formatNumber } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function MembershipReports() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStats(await membershipApi.getStats())
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Loader fullPage label="Loading membership reports…" />
  if (error) return <ErrorState title="Could not load membership reports" message={getApiErrorMessage(error)} onRetry={load} />
  if (!stats) return null

  const hasRevenue = stats.revenueByMonth.some((point) => point.value > 0)

  return (
    <div className="stack">
      <PageHeader
        title="Membership reports"
        description="Membership performance at a glance. Discount application on bookings is recorded per booking once the booking module is connected."
        breadcrumbs={[{ label: 'Membership' }, { label: 'Reports' }]}
      />

      <div className="grid grid--4">
        <StatCard label="Active members" value={formatNumber(stats.active)} hint={`${formatNumber(stats.total)} all-time`} icon={<BadgeCheck size={20} aria-hidden />} />
        <StatCard label="Expiring in 7 days" value={formatNumber(stats.expiringIn7)} hint="renewal calls" icon={<Clock3 size={20} aria-hidden />} />
        <StatCard label="Expired this month" value={formatNumber(stats.expiredThisMonth)} icon={<UserX size={20} aria-hidden />} />
        <StatCard label="Revenue this month" value={formatCurrency(stats.revenueThisMonth, 'BDT')} hint="paid memberships" icon={<Banknote size={20} aria-hidden />} />
      </div>

      <div className="grid grid--2">
        <div className="card">
          <p className="card__title">Membership revenue · last 6 months</p>
          {hasRevenue ? (
            <BarChart data={stats.revenueByMonth} formatValue={(value) => `${value}`} />
          ) : (
            <p className="muted small">No paid memberships recorded in the last 6 months.</p>
          )}
        </div>
        <div className="card">
          <p className="card__title">Memberships by plan</p>
          <div className="row" style={{ gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <DonutChart data={stats.planDistribution} centerLabel="Memberships" />
            <ul className="chart-legend">
              {stats.planDistribution.map((segment, index) => (
                <li key={segment.label}>
                  <span
                    className="chart-legend__dot"
                    style={{ background: ['#4f46e5', '#0ea5e9', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'][index % 6] }}
                  />
                  <span>{segment.label}</span>
                  <span>{segment.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card__title">Plan configuration</p>
        <PlanSummaryTable />
      </div>
    </div>
  )
}

function PlanSummaryTable() {
  const [plans, setPlans] = useState([])

  useEffect(() => {
    membershipApi.listPlans().then((result) => setPlans(result.items ?? []))
  }, [])

  return (
    <DataTable
      data={plans}
      rowKey={(row) => row.id}
      emptyTitle="No plans configured"
      columns={[
        { key: 'name', header: 'Plan', render: (row) => <span className="strong">{row.name}</span> },
        { key: 'duration', header: 'Duration', render: (row) => `${row.durationValue} ${row.durationUnit}(s)` },
        { key: 'price', header: 'Price', render: (row) => formatCurrency(row.price, 'BDT') },
        { key: 'tourDiscountPercent', header: 'Tour %', render: (row) => `${row.tourDiscountPercent}%` },
        { key: 'visaDiscountPercent', header: 'Visa %', render: (row) => `${row.visaDiscountPercent}%` },
        {
          key: 'isActive',
          header: 'Status',
          render: (row) => (row.isActive ? 'Active' : 'Inactive'),
        },
      ]}
    />
  )
}
