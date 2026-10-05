import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Badge from '../../../components/common/Badge'
import { visaApi } from '../visa.api'
import { APP_ROUTES } from '../../../utils/constants'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function VisaStatus() {
  const [rows, setRows] = useState([])
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [applicationResult, statusResult] = await Promise.all([visaApi.listApplications(), visaApi.listStatusConfigs()])
      setRows(applicationResult.items ?? [])
      setColumns((statusResult.items ?? []).filter((config) => config.active).sort((a, b) => a.displayOrder - b.displayOrder))
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Loader fullPage label="Loading board…" />
  if (error) return <ErrorState title="Could not load the status board" message={getApiErrorMessage(error)} onRetry={load} />

  const grouped = rows.reduce((groups, row) => {
    groups[row.status] = groups[row.status] ?? []
    groups[row.status].push(row)
    return groups
  }, {})

  return (
    <div className="stack">
      <PageHeader
        title="Application status board"
        // description="Pipeline view of where each application stands. Columns follow the configured workflow statuses."
        breadcrumbs={[{ label: 'Visa' }, { label: 'Status board' }]}
      />
      <div className="kanban">
        {columns.map((config) => (
          <div className="kanban__column" key={config.id}>
            <div className="kanban__column-header">
              <span>{config.displayName}</span>
              <span className="kanban__count">{grouped[config.key]?.length ?? 0}</span>
            </div>
            {(grouped[config.key] ?? []).map((application) => (
              <Link
                key={application.id}
                to={APP_ROUTES.VISA_APPLICATION_DETAILS(application.id)}
                className="kanban__card"
                style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
              >
                <p className="kanban__card-title">{application.applicant.fullName}</p>
                <p className="kanban__card-meta">
                  {application.number} · {application.country}
                </p>
                {application.actionRequired ? <Badge tone="danger">action required</Badge> : null}
              </Link>
            ))}
            {!grouped[config.key]?.length ? <p className="muted small">Nothing here.</p> : null}
          </div>
        ))}
        {/* Applications sitting on inactive statuses still need to be visible. */}
        {Object.entries(grouped)
          .filter(([key]) => !columns.some((config) => config.key === key))
          .map(([key, items]) => (
            <div className="kanban__column" key={key}>
              <div className="kanban__column-header">
                <span>{key.replace(/_/g, ' ')}</span>
                <span className="kanban__count">{items.length}</span>
              </div>
              {items.map((application) => (
                <Link
                  key={application.id}
                  to={APP_ROUTES.VISA_APPLICATION_DETAILS(application.id)}
                  className="kanban__card"
                  style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
                >
                  <p className="kanban__card-title">{application.applicant.fullName}</p>
                  <p className="kanban__card-meta">{application.number} · {application.country}</p>
                </Link>
              ))}
            </div>
          ))}
      </div>
    </div>
  )
}
