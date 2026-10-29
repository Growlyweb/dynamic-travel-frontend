import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Modal from '../../../components/common/Modal'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import { visaApi, MESSAGE_VARIABLES, MESSAGE_CHANNELS, TEMPLATE_SERVICE_OPTIONS, SERVICE_LABELS } from '../visa.api'
import { useAction } from '../../../hooks/useAction'
import { truncate } from '../../../utils/formatters'
import { errorMessage, fieldErrors } from '../../../utils/errors'

const EMPTY_VALUES = { name: '', channel: 'email', trigger: '', serviceType: 'all', subject: '', message: '', active: true }

// Words the server fills in, shown with an example so a person sees what the applicant will read.
const SAMPLE_VALUES = {
  applicantName: 'Rahim Ahmed',
  applicationNumber: 'VISA-2026-000102',
  country: 'China',
  visaType: 'Tourist Visa',
  status: 'Under Review',
  trackingUrl: 'https://example.com/visa-status/VISA-2026-000102',
}

const renderTemplate = (text) => Object.entries(SAMPLE_VALUES).reduce((result, [key, value]) => result.replaceAll(`{{${key}}}`, value), text ?? '')

// A template belongs to a status (its trigger). An email template is sent by itself when an application reaches that
// status. An SMS template only prepares the text: staff send it by hand and mark it as sent.
export default function MessageTemplates() {
  const run = useAction()
  const [rows, setRows] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const { ok, value } = await run(() => Promise.all([visaApi.listTemplates(), visaApi.listStatusConfigs()]))
    if (ok) {
      setRows(value[0].items)
      setStatuses(value[1].items)
    }
    setLoading(false)
  }, [run])

  useEffect(() => {
    load()
  }, [load])

  const statusName = useMemo(() => Object.fromEntries(statuses.map((status) => [status.key, status.displayName])), [statuses])

  function openCreate() {
    setEditing(null)
    setValues(EMPTY_VALUES)
    setErrors({})
    setFormError(null)
    setDialogOpen(true)
  }

  function openEdit(template) {
    setEditing(template)
    setValues({ name: template.name, channel: template.channel, trigger: template.trigger, serviceType: template.serviceType ?? 'visa', subject: template.subject ?? '', message: template.message, active: template.active })
    setErrors({})
    setFormError(null)
    setDialogOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    setFormError(null)
    try {
      await visaApi.saveTemplate({
        id: editing?.id,
        name: values.name.trim(),
        channel: values.channel,
        trigger: values.trigger,
        serviceType: values.serviceType,
        subject: values.channel === 'email' ? values.subject.trim() : undefined,
        message: values.message.trim(),
        active: values.active,
      })
      setDialogOpen(false)
      await load()
    } catch (error) {
      setErrors(fieldErrors(error))
      setFormError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(template) {
    const { ok } = await run(() => visaApi.updateTemplate(template.id, { active: !template.active }))
    if (ok) await load()
  }

  async function handleDelete() {
    setDeleting(true)
    const { ok } = await run(() => visaApi.removeTemplate(pendingDelete.id), { success: 'Template deleted.' })
    setPendingDelete(null)
    if (ok) await load()
    setDeleting(false)
  }

  return (
    <div className="stack">
      <PageHeader title="Message templates" breadcrumbs={[{ label: 'Visa' }, { label: 'Message templates' }]} actions={<Button onClick={openCreate}>+ New template</Button>} />

      <div className="card">
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No templates yet"
          columns={[
            { key: 'name', header: 'Template', render: (row) => <span className="strong">{row.name}</span> },
            { key: 'channel', header: 'Channel', render: (row) => <Badge tone={row.channel === 'email' ? 'info' : 'neutral'}>{row.channel === 'email' ? 'Email' : 'SMS'}</Badge> },
            { key: 'serviceType', header: 'Service', render: (row) => (row.serviceType === 'all' ? 'All services' : SERVICE_LABELS[row.serviceType] ?? row.serviceType) },
            { key: 'trigger', header: 'When', render: (row) => statusName[row.trigger] ?? row.trigger },
            { key: 'message', header: 'Message', render: (row) => <span className="muted small">{truncate(row.subject ? `${row.subject}: ${row.message}` : row.message, 80)}</span> },
            {
              key: 'active',
              header: 'On',
              render: (row) => (
                <label className="checkbox">
                  <input type="checkbox" checked={row.active} onChange={() => toggleActive(row)} />
                  {row.active ? 'On' : 'Off'}
                </label>
              ),
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <span className="table-actions">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => setPendingDelete(row)}>Delete</Button>
                </span>
              ),
            },
          ]}
        />
      </div>

      <Modal
        open={dialogOpen}
        onClose={saving ? undefined : () => setDialogOpen(false)}
        title={editing ? `Edit “${editing.name}”` : 'New template'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editing ? 'Save changes' : 'Create template'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="stack" noValidate>
          {formError ? <div className="alert alert--danger">{formError}</div> : null}
          <div className="grid grid--3">
            <Input label="Name" value={values.name} error={errors.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
            <Select label="Channel" value={values.channel} error={errors.channel} onChange={(event) => setValues({ ...values, channel: event.target.value })} options={MESSAGE_CHANNELS.map((channel) => ({ value: channel, label: channel === 'email' ? 'Email (sent by itself)' : 'SMS (sent by hand)' }))} />
            <Select label="When the application reaches" placeholder="Choose a status" value={values.trigger} error={errors.trigger} onChange={(event) => setValues({ ...values, trigger: event.target.value })} options={statuses.map((status) => ({ value: status.key, label: status.displayName }))} />
          </div>
          <Select
            label="Service"
            value={values.serviceType}
            error={errors.serviceType}
            hint="A template for one service is used for that service. “All services” is used for any service that has no template of its own on the same channel."
            onChange={(event) => setValues({ ...values, serviceType: event.target.value })}
            options={TEMPLATE_SERVICE_OPTIONS}
          />
          {values.channel === 'email' ? <Input label="Subject" value={values.subject} error={errors.subject} onChange={(event) => setValues({ ...values, subject: event.target.value })} /> : null}
          <div className="field">
            <label className="field__label" htmlFor="template-message">Message</label>
            <textarea id="template-message" className="field__control" rows={5} value={values.message} onChange={(event) => setValues({ ...values, message: event.target.value })} />
            {errors.message ? <p className="field__error">{errors.message}</p> : null}
            <p className="field__hint">Words you can use: {MESSAGE_VARIABLES.map((variable) => `{{${variable}}}`).join(' ')}. Any other word in double braces is refused.</p>
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={values.active} onChange={(event) => setValues({ ...values, active: event.target.checked })} />
            On
          </label>
          <div className="alert alert--info">
            <p className="small" style={{ margin: 0 }}>
              <strong>Preview:</strong> {values.channel === 'email' && values.subject ? `${renderTemplate(values.subject)} · ` : ''}{renderTemplate(values.message)}
            </p>
            {values.channel === 'sms' ? <p className="small muted" style={{ margin: 0 }}>{values.message.length} characters, about {Math.max(1, Math.ceil(values.message.length / 160))} SMS.</p> : null}
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(pendingDelete)} title="Delete template" message={`Delete “${pendingDelete?.name ?? ''}”? Messages already sent stay in the log.`} confirmLabel="Delete" tone="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setPendingDelete(null)} />
    </div>
  )
}
