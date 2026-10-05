import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import Badge from '../../../components/common/Badge'
import Select from '../../../components/common/Select'
import Input from '../../../components/common/Input'
import { visaApi, SMS_LOG_STATUSES } from '../visa.api'
import { formatDateTime, truncate } from '../../../utils/formatters'
import { useDebounce } from '../../../hooks/useDebounce'

const LOG_TONES = { sent: 'info', delivered: 'success', failed: 'danger' }

export default function SmsLogs() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const debouncedSearch = useDebounce(search, 300)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await visaApi.listSmsLogs({ status: status || undefined, search: debouncedSearch || undefined })
      setRows(result.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [status, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="stack">
      <PageHeader
        title="SMS logs"
        // description="Every notification sent through the SMS service layer, with provider reference and delivery status."
        breadcrumbs={[{ label: 'Visa' }, { label: 'SMS logs' }]}
      />

      <div className="card stack">
        <div className="filters">
          <Input
            label="Search"
            type="search"
            placeholder="Application, recipient, phone…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            label="Status"
            placeholder="All statuses"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={SMS_LOG_STATUSES.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))}
          />
        </div>
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No SMS sent yet"
          emptyDescription="SMS entries appear here when notifications are sent from applications."
          columns={[
            { key: 'sentAt', header: 'Sent', render: (row) => formatDateTime(row.sentAt) },
            { key: 'applicationNumber', header: 'Application', render: (row) => <span className="strong">{row.applicationNumber}</span> },
            {
              key: 'recipient',
              header: 'Recipient',
              render: (row) => (
                <span>
                  {row.recipient}
                  <br />
                  <span className="muted small">{row.phone}</span>
                </span>
              ),
            },
            { key: 'template', header: 'Template' },
            { key: 'message', header: 'Message', render: (row) => <span className="muted small">{truncate(row.message, 70)}</span> },
            { key: 'provider', header: 'Provider', render: (row) => <span>{row.provider}<br /><span className="muted small">{row.providerMessageId}</span></span> },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <span>
                  <Badge tone={LOG_TONES[row.status] ?? 'neutral'}>{row.status}</Badge>
                  {row.status === 'delivered' && row.deliveredAt ? (
                    <span className="muted small" style={{ display: 'block' }}>{formatDateTime(row.deliveredAt)}</span>
                  ) : null}
                  {row.status === 'failed' && row.error ? (
                    <span className="small" style={{ display: 'block', color: 'var(--color-danger, #dc2626)' }}>{row.error}</span>
                  ) : null}
                </span>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
