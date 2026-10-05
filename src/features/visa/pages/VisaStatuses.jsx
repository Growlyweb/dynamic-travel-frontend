import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Modal from '../../../components/common/Modal'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import { visaApi, STATUS_CATEGORIES } from '../visa.api'

const CATEGORY_TONES = {
  in_progress: 'info',
  action_required: 'danger',
  success: 'success',
  failed: 'danger',
  cancelled: 'neutral',
}

const EMPTY_VALUES = { displayName: '', key: '', customerMessage: '', internalDescription: '', category: 'in_progress', displayOrder: '', active: true }

function valuesFromConfig(config) {
  if (!config) return { ...EMPTY_VALUES }
  return {
    displayName: config.displayName ?? '',
    key: config.key ?? '',
    customerMessage: config.customerMessage ?? '',
    internalDescription: config.internalDescription ?? '',
    category: config.category ?? 'in_progress',
    displayOrder: config.displayOrder == null ? '' : String(config.displayOrder),
    active: config.active ?? true,
  }
}

export default function VisaStatuses() {
  const [rows, setRows] = useState([])
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
      const result = await visaApi.listStatusConfigs()
      setRows(result.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setValues({ ...EMPTY_VALUES, displayOrder: String((rows.at(-1)?.displayOrder ?? 0) + 10) })
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(config) {
    setEditing(config)
    setValues(valuesFromConfig(config))
    setErrors({})
    setDialogOpen(true)
  }

  function setValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function validate() {
    const next = {}
    if (!values.displayName.trim()) next.displayName = 'Display name is required.'
    if (values.displayOrder === '' || Number.isNaN(Number(values.displayOrder))) next.displayOrder = 'Numeric order required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await visaApi.saveStatusConfig({
        ...(editing ?? {}),
        displayName: values.displayName.trim(),
        customerMessage: values.customerMessage.trim(),
        internalDescription: values.internalDescription.trim(),
        category: values.category,
        displayOrder: Number(values.displayOrder),
        active: values.active,
        ...(editing ? {} : { key: values.key.trim() }),
      })
      setDialogOpen(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(config) {
    await visaApi.updateStatusConfig(config.id, { active: !config.active })
    await load()
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await visaApi.removeStatusConfig(pendingDelete.id)
      setPendingDelete(null)
      await load()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Application statuses"
        // description="Configure the labels and customer messages for every workflow status. System statuses keep the logic working; custom statuses let you add your own steps."
        breadcrumbs={[{ label: 'Visa' }, { label: 'Application statuses' }]}
        actions={<Button onClick={openCreate}>+ New status</Button>}
      />

      <div className="card">
        <DataTable
          loading={loading}
          data={rows}
          rowKey={(row) => row.id}
          emptyTitle="No statuses configured"
          columns={[
            { key: 'displayOrder', header: 'Order', width: 70 },
            {
              key: 'displayName',
              header: 'Status',
              render: (row) => (
                <span>
                  <span className="strong">{row.displayName}</span>
                  {row.isSystem ? <Badge tone="neutral">system</Badge> : null}
                  <br />
                  <span className="muted small">key: {row.key}</span>
                </span>
              ),
            },
            {
              key: 'category',
              header: 'Category',
              render: (row) => <Badge tone={CATEGORY_TONES[row.category] ?? 'neutral'}>{row.category.replace('_', ' ')}</Badge>,
            },
            {
              key: 'customerMessage',
              header: 'Customer message',
              render: (row) => <span className="muted small">{row.customerMessage || '—'}</span>,
            },
            {
              key: 'active',
              header: 'Active',
              render: (row) => (
                <label className="checkbox">
                  <input type="checkbox" checked={row.active} onChange={() => toggleActive(row)} />
                  {row.active ? 'Active' : 'Inactive'}
                </label>
              ),
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <span className="table-actions">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
                    Edit
                  </Button>
                  {!row.isSystem ? (
                    <Button size="sm" variant="danger" onClick={() => setPendingDelete(row)}>
                      Delete
                    </Button>
                  ) : null}
                </span>
              ),
            },
          ]}
        />
      </div>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? `Edit “${editing.displayName}”` : 'New status'}
        description="Display names and messages are shown to customers; the system key is what integrations rely on."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editing ? 'Save changes' : 'Create status'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="stack">
          <div className="grid grid--2">
            <Input
              label="Display name"
              value={values.displayName}
              error={errors.displayName}
              onChange={(event) => setValue('displayName', event.target.value)}
              placeholder="Passport Submitted"
            />
            <Input
              label="System key"
              value={values.key}
              onChange={(event) => setValue('key', event.target.value)}
              placeholder="passport_submitted"
              disabled={Boolean(editing)}
              hint={editing ? 'System keys cannot change after creation.' : 'Lowercase, underscores. Auto-derived from the name if left blank.'}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="status-customer-message">Customer message</label>
            <textarea
              id="status-customer-message"
              className="field__control"
              rows={2}
              value={values.customerMessage}
              onChange={(event) => setValue('customerMessage', event.target.value)}
              placeholder="Your passport has been submitted to the embassy."
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="status-internal-description">Internal description</label>
            <textarea
              id="status-internal-description"
              className="field__control"
              rows={2}
              value={values.internalDescription}
              onChange={(event) => setValue('internalDescription', event.target.value)}
              placeholder="What this status means for staff (never shown to customers)."
            />
          </div>
          <div className="grid grid--3">
            <Select
              label="Category"
              value={values.category}
              onChange={(event) => setValue('category', event.target.value)}
              options={STATUS_CATEGORIES.map((category) => ({
                value: category,
                label: category.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
              }))}
            />
            <Input
              label="Display order"
              type="number"
              value={values.displayOrder}
              error={errors.displayOrder}
              onChange={(event) => setValue('displayOrder', event.target.value)}
            />
            <div className="field">
              <span className="field__label">Visibility</span>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={values.active}
                  onChange={(event) => setValue('active', event.target.checked)}
                />
                Active and available for selection
              </label>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete status"
        message={`Delete the custom status “${pendingDelete?.displayName ?? ''}”? Applications already using it keep their status.`}
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
