import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import { visaApi, SMS_VARIABLES } from '../visa.api'
import { truncate } from '../../../utils/formatters'

const EMPTY_VALUES = { name: '', trigger: '', message: '' }

// Sample data used to preview a template the way the applicant will read it.
const SAMPLE_VALUES = {
  applicantName: 'Rahim Ahmed',
  applicationNumber: 'VISA-2026-000102',
  country: 'China',
  visaType: 'Tourist Visa',
  status: 'Under Review',
  trackingUrl: 'dynamic.travel/track/VISA-2026-000102',
}

function renderTemplate(message, values = SAMPLE_VALUES) {
  return Object.entries(values).reduce(
    (text, [key, value]) => String(text ?? '').replaceAll(`{{${key}}}`, value),
    message ?? '',
  )
}

// GSM-7 SMS: 160 chars per single segment.
function smsSegmentInfo(text) {
  const length = String(text ?? '').length
  return `${length} chars · ~${Math.max(1, Math.ceil(length / 160))} SMS`
}

export default function SmsTemplates() {
  const [rows, setRows] = useState([])
  const [statusConfigs, setStatusConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [templateResult, statusResult] = await Promise.all([visaApi.listSmsTemplates(), visaApi.listStatusConfigs()])
      setRows(templateResult.items ?? [])
      setStatusConfigs(statusResult.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setValues({ ...EMPTY_VALUES, trigger: statusConfigs[0]?.key ?? '' })
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(template) {
    setEditing(template)
    setValues({ name: template.name, trigger: template.trigger, message: template.message })
    setErrors({})
    setDialogOpen(true)
  }

  function insertVariable(variable) {
    setValues((current) => ({ ...current, message: `${current.message}{{${variable}}}` }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const next = {}
    if (!values.name.trim()) next.name = 'Template name is required.'
    if (!values.message.trim()) next.message = 'Message text is required.'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    try {
      await visaApi.saveSmsTemplate({
        ...(editing ?? {}),
        name: values.name.trim(),
        trigger: values.trigger,
        message: values.message.trim(),
      })
      setDialogOpen(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(template) {
    await visaApi.updateSmsTemplate(template.id, { active: !template.active })
    await load()
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await visaApi.removeSmsTemplate(pendingDelete.id)
      setPendingDelete(null)
      await load()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="SMS templates"
        // description="Reusable messages with dynamic variables. Templates are triggered when an application reaches the matching status, or can be sent manually."
        breadcrumbs={[{ label: 'Visa' }, { label: 'SMS templates' }]}
        actions={<Button onClick={openCreate}>+ New template</Button>}
      />

      <div className="card">
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No SMS templates"
          columns={[
            { key: 'name', header: 'Template', render: (row) => <span className="strong">{row.name}</span> },
            {
              key: 'trigger',
              header: 'Trigger status',
              render: (row) => {
                const config = statusConfigs.find((item) => item.key === row.trigger)
                return config?.displayName ?? row.trigger ?? '—'
              },
            },
            { key: 'message', header: 'Message', render: (row) => (
              <span>
                <span className="muted small">{truncate(row.message, 70)}</span>
                <br />
                <span className="muted small">{smsSegmentInfo(row.message)}</span>
              </span>
            ) },
            {
              key: 'active',
              header: 'Active',
              render: (row) => (
                <label className="checkbox">
                  <input type="checkbox" checked={row.active} onChange={() => toggleActive(row)} />
                  {row.active ? 'Active' : 'Off'}
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
        onClose={() => setDialogOpen(false)}
        title={editing ? `Edit “${editing.name}”` : 'New SMS template'}
        description="Click a variable to append it — values are filled in when the SMS is sent."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editing ? 'Save changes' : 'Create template'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="stack">
          <div className="grid grid--2">
            <Input
              label="Template name"
              value={values.name}
              error={errors.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              placeholder="Visa Application Approved"
            />
            <Select
              label="Trigger status"
              value={values.trigger}
              onChange={(event) => setValues((current) => ({ ...current, trigger: event.target.value }))}
              placeholder="No automatic trigger"
              options={statusConfigs.map((config) => ({ value: config.key, label: config.displayName }))}
              hint="An SMS is suggested whenever the application reaches this status."
            />
          </div>
          <div className="field">
            <span className="field__label">Variables</span>
            <div className="row row--wrap" style={{ gap: 6 }}>
              {SMS_VARIABLES.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  className="badge badge--primary"
                  style={{ cursor: 'pointer', border: 'none' }}
                  onClick={() => insertVariable(variable)}
                >
                  {`{{${variable}}}`}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="sms-template-message">Message</label>
            <textarea
              id="sms-template-message"
              className="field__control"
              rows={4}
              value={values.message}
              onChange={(event) => setValues((current) => ({ ...current, message: event.target.value }))}
              placeholder="Dear {{applicantName}}, your {{country}} visa application {{applicationNumber}} has been approved."
            />
            {errors.message ? <p className="field__error">{errors.message}</p> : null}
          </div>
          {values.message ? (
            <div className="alert alert--info">
              <p className="small" style={{ margin: 0 }}><strong>Preview:</strong> {renderTemplate(values.message)}</p>
              <p className="muted small" style={{ margin: 0 }}>{smsSegmentInfo(values.message)}</p>
            </div>
          ) : null}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete template"
        message={`Delete the template “${pendingDelete?.name ?? ''}”? Sent SMS logs are not affected.`}
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
