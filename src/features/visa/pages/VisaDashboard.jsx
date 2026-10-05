import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, BadgeCheck, FileStack, SearchCheck } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import StatCard from '../../../components/charts/StatCard'
import DonutChart from '../../../components/charts/DonutChart'
import DataTable from '../../../components/tables/DataTable'
import VisaStatusBadge from '../components/VisaStatusBadge'
import { visaApi } from '../visa.api'
import { APP_ROUTES } from '../../../utils/constants'
import { formatDate, formatNumber } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function VisaDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStats(await visaApi.getDashboardStats())
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Loader fullPage label="Loading visa overview…" />
  if (error) return <ErrorState title="Could not load the visa overview" message={getApiErrorMessage(error)} onRetry={load} />
  if (!stats) return null

  const pipeline = [
    { label: 'Submitted', value: stats.submitted },
    { label: 'Under review', value: stats.underReview },
    { label: 'Action required', value: stats.actionRequired },
    { label: 'Processing', value: stats.processing },
    { label: 'Submitted to embassy', value: stats.submittedToEmbassy },
    { label: 'Approved', value: stats.approved },
    { label: 'Completed', value: stats.completed },
  ]
  const maxPipeline = Math.max(...pipeline.map((step) => step.value), 1)

  return (
    <div className="stack">
      <PageHeader
        title="Visa overview"
        // description="Live view of the visa operation: pipeline, channels and pending work."
        breadcrumbs={[{ label: 'Visa' }, { label: 'Overview' }]}
      />

      <div className="grid grid--4">
        <StatCard label="Total applications" value={formatNumber(stats.total)} hint={`${stats.b2c} B2C · ${stats.b2b} B2B`} icon={<FileStack size={20} aria-hidden />} />
        <StatCard label="Under review" value={formatNumber(stats.underReview + stats.processing)} hint="review + processing" icon={<SearchCheck size={20} aria-hidden />} />
        <StatCard label="Action required" value={formatNumber(stats.actionRequired)} hint={`${stats.unassigned} unassigned`} icon={<AlertTriangle size={20} aria-hidden />} />
        <StatCard label="Approved" value={formatNumber(stats.approved)} hint={`${stats.decisionRate}% decided`} icon={<BadgeCheck size={20} aria-hidden />} />
      </div>

      <div className="grid grid--2">
        <div className="card">
          <p className="card__title">Application pipeline</p>
          <ul className="stack stack--sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {pipeline.map((step) => {
              const value = step.value
              return (
                <li key={step.label} className="row" style={{ gap: 12, alignItems: 'center' }}>
                  <span className="small" style={{ width: 150, flexShrink: 0 }}>{step.label}</span>
                  <div style={{ flex: 1, height: 8, background: 'var(--color-border, #e2e8f0)', borderRadius: 999 }}>
                    <div
                      style={{
                        width: `${Math.round((value / maxPipeline) * 100)}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: 'var(--color-primary, #4f46e5)',
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <span className="small strong" style={{ width: 24, textAlign: 'right' }}>{value}</span>
                </li>
              )
            })}
          </ul>
          <p className="muted small mt-3">{stats.total > 0
            ? `${stats.rejected} rejected · ${stats.completed} completed`
            : 'No applications yet.'}
          </p>
        </div>

        <div className="card">
          <p className="card__title">Channel breakdown</p>
          <div className="row" style={{ gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <DonutChart
              data={[
                { label: 'B2C', value: stats.b2c },
                { label: 'B2B', value: stats.b2b },
              ]}
              centerLabel="Applications"
            />
            <ul className="chart-legend">
              <li>
                <span className="chart-legend__dot" style={{ background: '#4f46e5' }} />
                <span>B2C (direct customers)</span>
                <span>{formatNumber(stats.b2c)}</span>
              </li>
              <li>
                <span className="chart-legend__dot" style={{ background: '#0ea5e9' }} />
                <span>B2B (partners)</span>
                <span>{formatNumber(stats.b2b)}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid--2">
        <div className="card">
          <div className="row between mb-3">
            <p className="card__title" style={{ marginBottom: 0 }}>Country performance</p>
            <Link className="small" to={APP_ROUTES.VISA_COUNTRIES}>Manage countries</Link>
          </div>
          <DataTable
            data={stats.countries}
            rowKey={(row) => row.country}
            emptyTitle="No applications yet"
            columns={[
              { key: 'flag', header: '', width: 40, render: (row) => <span aria-hidden>{row.flag}</span> },
              { key: 'country', header: 'Country', render: (row) => <span className="strong">{row.country}</span> },
              { key: 'applications', header: 'Applications' },
              { key: 'approved', header: 'Approved' },
              { key: 'approvalRate', header: 'Approval rate', render: (row) => `${row.approvalRate}%` },
            ]}
          />
        </div>

        <div className="card">
          <div className="row between mb-3">
            <p className="card__title" style={{ marginBottom: 0 }}>Pending actions</p>
            <Link className="small" to={APP_ROUTES.VISA_APPLICATIONS}>All applications</Link>
          </div>
          <ul className="stack stack--sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {stats.recent
              .filter((application) => application.status === 'action_required' || !application.assignedStaff)
              .map((application) => (
                <li key={application.id} className="row between">
                  <div>
                    <Link to={APP_ROUTES.VISA_APPLICATION_DETAILS(application.id)} className="strong">
                      {application.number}
                    </Link>
                    <p className="muted small" style={{ margin: 0 }}>
                      {application.applicant.fullName} · {application.country}
                      {!application.assignedStaff ? ' · unassigned' : ''}
                    </p>
                  </div>
                  <VisaStatusBadge status={application.status} />
                </li>
              ))}
            {!stats.recent.some((application) => application.status === 'action_required' || !application.assignedStaff) ? (
              <p className="muted small">Nothing pending — all clear.</p>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="row between mb-3">
          <p className="card__title" style={{ marginBottom: 0 }}>Recent applications</p>
          <Link className="small" to={APP_ROUTES.VISA_APPLICATIONS}>View all</Link>
        </div>
        <DataTable
          data={stats.recent}
          emptyTitle="No applications yet"
          columns={[
            { key: 'number', header: 'Application', render: (row) => <Link to={APP_ROUTES.VISA_APPLICATION_DETAILS(row.id)} className="strong">{row.number}</Link> },
            { key: 'applicant', header: 'Applicant', render: (row) => row.applicant.fullName },
            { key: 'country', header: 'Country' },
            { key: 'channel', header: 'Channel', render: (row) => (row.channel === 'b2b' ? `B2B · ${row.partner}` : 'B2C') },
            { key: 'submittedAt', header: 'Submitted', render: (row) => formatDate(row.submittedAt) },
            { key: 'status', header: 'Status', render: (row) => <VisaStatusBadge status={row.status} /> },
          ]}
        />
      </div>
    </div>
  )
}
