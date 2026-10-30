import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import StatusChangeDialog from '../components/StatusChangeDialog'
import { visaApi } from '../visa.api'
import { usePermission } from '../../../hooks/usePermission'
import { useToast } from '../../../context/ToastContext'
import { nextStatuses } from '../statusRules'
import { APP_ROUTES, VISA_STATUS_TONES } from '../../../utils/constants'
import { PERMISSIONS } from '../../../utils/permissions'
import { errorMessage } from '../../../utils/errors'
import { formatDate } from '../../../utils/formatters'

// Every active status as a column, with the applications that are in it. It shows the 500 newest applications: use the
// Applications page to search the rest.
export default function VisaStatus() {
  const navigate = useNavigate()
  const toast = useToast()
  const { can, isAdmin } = usePermission()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusChange, setStatusChange] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [applications, statusResult] = await Promise.all([visaApi.listApplications({ pageSize: 500 }), visaApi.listStatusConfigs()])
      setRows(applications.items)
      setTotal(applications.total)
      setStatuses(statusResult.items)
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const columns = useMemo(
    () => statuses.filter((status) => status.active || rows.some((row) => row.status === status.key)).map((status) => ({ status, items: rows.filter((row) => row.status === status.key) })),
    [statuses, rows],
  )

  if (loading) return <Loader fullPage label="Loading the board…" />
  if (error) return <ErrorState title="Could not load the board" message={errorMessage(error)} onRetry={load} />

  return (
    <div className="stack">
      <PageHeader
        title="Status board"
        description={total > rows.length ? `The ${rows.length} newest of ${total} applications.` : `${total} applications.`}
        breadcrumbs={[{ label: 'Visa' }, { label: 'Status board' }]}
      />

      <div className="row" style={{ gap: 12, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 12 }}>
        {columns.map(({ status, items }) => (
          <div key={status.key} className="card" style={{ minWidth: 260, maxWidth: 300, flex: '0 0 auto' }}>
            <div className="row between">
              <Badge tone={VISA_STATUS_TONES[status.key] ?? 'neutral'}>{status.displayName}</Badge>
              <span className="muted small">{items.length}</span>
            </div>
            <div className="stack stack--sm mt-2" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {items.map((application) => (
                <div key={application.id} className="card" style={{ padding: 10 }}>
                  <p className="strong" style={{ margin: 0 }}>{application.applicant.fullName}</p>
                  <p className="muted small" style={{ margin: 0 }}>{application.number} · {application.country}</p>
                  <p className="muted small" style={{ margin: 0 }}>{formatDate(application.submittedAt)} · {application.assignedStaff ?? 'Unassigned'}</p>
                  <div className="row" style={{ gap: 6, marginTop: 6 }}>
                    <Button size="sm" variant="ghost" onClick={() => navigate(APP_ROUTES.VISA_APPLICATION_DETAILS(application.id || application._id))}>Open</Button>
                    {can(PERMISSIONS.VISA_UPDATE) && nextStatuses(application.status, statuses, { isAdmin }).length ? (
                      <Button size="sm" variant="ghost" onClick={() => setStatusChange({ application })}>Move</Button>
                    ) : null}
                  </div>
                </div>
              ))}
              {!items.length ? <p className="muted small">Nothing here.</p> : null}
            </div>
          </div>
        ))}
      </div>

      <StatusChangeDialog
        open={Boolean(statusChange)}
        onClose={() => setStatusChange(null)}
        application={statusChange?.application}
        statusOptions={statuses}
        onSaved={() => {
          setStatusChange(null)
          toast.success('Status updated.')
          load()
        }}
      />
    </div>
  )
}
