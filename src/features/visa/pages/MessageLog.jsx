import { useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import TablePagination from '../../../components/tables/TablePagination'
import ErrorState from '../../../components/common/ErrorState'
import Badge from '../../../components/common/Badge'
import Button from '../../../components/common/Button'
import Select from '../../../components/common/Select'
import Input from '../../../components/common/Input'
import { visaApi, MESSAGE_CHANNELS, MESSAGE_STATUSES } from '../visa.api'
import { MESSAGE_TONES } from '../components/ApplicationMessages'
import { useServerTable } from '../../../hooks/useServerTable'
import { useAction } from '../../../hooks/useAction'
import { usePermission } from '../../../hooks/usePermission'
import { PERMISSIONS } from '../../../utils/permissions'
import { formatDateTime, truncate } from '../../../utils/formatters'
import { errorMessage } from '../../../utils/errors'

// Every email and SMS the visa module made. An SMS waits as "pending" until someone sends it and marks it as sent.
export default function MessageLog() {
  const run = useAction()
  const { can } = usePermission()
  const [channel, setChannel] = useState('')
  const [status, setStatus] = useState('')
  const table = useServerTable({ table: 'visa-messages', fetcher: visaApi.listMessages, filters: { channel, status } })

  async function act(action, success) {
    const { ok } = await run(action, { success })
    if (ok) table.reload()
  }

  return (
    <div className="stack">
      <PageHeader title="Message log" breadcrumbs={[{ label: 'Visa' }, { label: 'Message log' }]} />

      <div className="card stack">
        <div className="filters">
          <Input label="Search" type="search" placeholder="Application, recipient, text…" value={table.search} onChange={(event) => table.setSearch(event.target.value)} />
          <Select label="Channel" placeholder="Email and SMS" value={channel} onChange={(event) => setChannel(event.target.value)} options={MESSAGE_CHANNELS.map((value) => ({ value, label: value === 'email' ? 'Email' : 'SMS' }))} />
          <Select label="Status" placeholder="All statuses" value={status} onChange={(event) => setStatus(event.target.value)} options={MESSAGE_STATUSES.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} />
        </div>
        {table.error ? (
          <ErrorState title="Could not load the log" message={errorMessage(table.error)} onRetry={table.reload} />
        ) : (
          <>
            <DataTable
              loading={table.loading}
              refreshing={table.refreshing}
              data={table.rows}
              emptyTitle="No messages yet"
              emptyDescription="Messages appear here when an application reaches a status with a template, or when staff send one."
              columns={[
                { key: 'createdAt', header: 'When', render: (row) => formatDateTime(row.sentAt ?? row.createdAt) },
                { key: 'applicationNumber', header: 'Application', render: (row) => <span className="strong">{row.applicationNumber}</span> },
                { key: 'to', header: 'To', render: (row) => <span>{row.toName}<br /><span className="muted small">{row.to}</span></span> },
                { key: 'channel', header: 'Channel', render: (row) => (row.channel === 'email' ? 'Email' : 'SMS') },
                { key: 'templateName', header: 'Template', render: (row) => <span>{row.templateName}{row.source === 'auto' ? <span className="muted small"> (automatic)</span> : null}</span> },
                { key: 'body', header: 'Message', render: (row) => <span className="muted small">{truncate(row.subject ? `${row.subject}: ${row.body}` : row.body, 70)}</span> },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <span>
                      <Badge tone={MESSAGE_TONES[row.status] ?? 'neutral'}>{row.status}</Badge>
                      {row.status === 'failed' && row.error ? <span className="small" style={{ display: 'block', color: 'var(--color-danger, #dc2626)' }}>{row.error}</span> : null}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  render: (row) =>
                    can(PERMISSIONS.VISA_EDIT) ? (
                      <span className="table-actions">
                        {row.channel === 'sms' && row.status === 'pending' ? (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => act(() => visaApi.markMessage(row.id, { status: 'sent' }), 'Marked as sent.')}>Mark as sent</Button>
                            <Button size="sm" variant="ghost" onClick={() => act(() => visaApi.markMessage(row.id, { status: 'failed', error: 'Not delivered' }), 'Marked as failed.')}>Mark as failed</Button>
                          </>
                        ) : null}
                        {row.channel === 'email' && row.status === 'failed' ? <Button size="sm" variant="ghost" onClick={() => act(() => visaApi.resendMessage(row.id), 'Email sent again.')}>Send again</Button> : null}
                      </span>
                    ) : null,
                },
              ]}
            />
            <TablePagination {...table.paginationProps} />
          </>
        )}
      </div>
    </div>
  )
}
