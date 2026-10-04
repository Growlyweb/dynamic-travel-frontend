import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import { visaApi } from '../visa.api'
import { APP_ROUTES, VISA_STATUSES } from '../../../utils/constants'
import { groupBy, getApiErrorMessage } from '../../../utils/helpers'
import { titleCase } from '../../../utils/formatters'

export default function VisaStatus() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await visaApi.list({ page: 1, pageSize: 50 })
      setRows(result.items ?? [])
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

  const grouped = groupBy(rows, (row) => row.status)

  return (
    <div className="stack">
      <PageHeader
        title="Application status board"
        description="Pipeline view of where each application stands."
        breadcrumbs={[{ label: 'Visa' }, { label: 'Status board' }]}
      />
      <div className="kanban">
        {VISA_STATUSES.map((status) => (
          <div className="kanban__column" key={status}>
            <div className="kanban__column-header">
              <span>{titleCase(status)}</span>
              <span className="kanban__count">{grouped[status]?.length ?? 0}</span>
            </div>
            {(grouped[status] ?? []).map((application) => (
              <Link
                key={application.id}
                to={APP_ROUTES.VISA_APPLICATION_DETAILS(application.id)}
                className="kanban__card"
                style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
              >
                <p className="kanban__card-title">{application.applicant}</p>
                <p className="kanban__card-meta">
                  {application.reference} · {application.country}
                </p>
              </Link>
            ))}
            {!grouped[status]?.length ? <p className="muted small">Nothing here.</p> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
