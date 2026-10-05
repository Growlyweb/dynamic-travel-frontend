import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Modal from '../../../components/common/Modal'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { formatCurrency } from '../../../utils/formatters'
import { membershipApi, DURATION_UNITS } from '../membership.api'

const EMPTY_VALUES = {
  name: '',
  durationValue: '30',
  durationUnit: 'day',
  price: '',
  tourDiscountPercent: '5',
  visaDiscountPercent: '5',
  maxDiscountAmount: '',
  description: '',
  features: '',
  isActive: true,
}

function valuesFromPlan(plan) {
  if (!plan) return { ...EMPTY_VALUES }
  return {
    name: plan.name ?? '',
    durationValue: plan.durationValue == null ? '30' : String(plan.durationValue),
    durationUnit: plan.durationUnit ?? 'day',
    price: plan.price == null ? '' : String(plan.price),
    tourDiscountPercent: plan.tourDiscountPercent == null ? '0' : String(plan.tourDiscountPercent),
    visaDiscountPercent: plan.visaDiscountPercent == null ? '0' : String(plan.visaDiscountPercent),
    maxDiscountAmount: plan.maxDiscountAmount == null ? '' : String(plan.maxDiscountAmount),
    description: plan.description ?? '',
    features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
    isActive: plan.isActive ?? true,
  }
}

export default function MembershipPlans() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deletingPlan, setDeletingPlan] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await membershipApi.listPlans()
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
    setValues({ ...EMPTY_VALUES })
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(plan) {
    setEditing(plan)
    setValues(valuesFromPlan(plan))
    setErrors({})
    setDialogOpen(true)
  }

  function setValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function validate() {
    const next = {}
    if (!values.name.trim()) next.name = 'Plan name is required.'
    if (!Number(values.durationValue) || Number(values.durationValue) < 1) next.durationValue = 'Duration must be at least 1.'
    if (values.price === '' || Number.isNaN(Number(values.price))) next.price = 'Price is required.'
    const tour = Number(values.tourDiscountPercent)
    const visa = Number(values.visaDiscountPercent)
    if (Number.isNaN(tour) || tour < 0 || tour > 100) next.tourDiscountPercent = '0–100.'
    if (Number.isNaN(visa) || visa < 0 || visa > 100) next.visaDiscountPercent = '0–100.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await membershipApi.savePlan({
        ...(editing ?? {}),
        name: values.name.trim(),
        durationValue: Number(values.durationValue),
        durationUnit: values.durationUnit,
        price: Number(values.price),
        tourDiscountPercent: Number(values.tourDiscountPercent),
        visaDiscountPercent: Number(values.visaDiscountPercent),
        maxDiscountAmount: values.maxDiscountAmount === '' ? null : Number(values.maxDiscountAmount),
        description: values.description.trim(),
        features: values.features.split('\n').map((feature) => feature.trim()).filter(Boolean),
        isActive: values.isActive,
      })
      setDialogOpen(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deletingPlan) return
    setDeleting(true)
    try {
      await membershipApi.deletePlan(deletingPlan.id)
      setDeletingPlan(null)
      await load()
    } finally {
      setDeleting(false)
    }
  }

  async function toggleActive(plan) {
    await membershipApi.togglePlan(plan.id)
    await load()
  }

  return (
    <div className="stack">
      <PageHeader
        title="Membership plans"
        breadcrumbs={[{ label: 'Membership' }, { label: 'Plans' }]}
        actions={<Button onClick={openCreate}>+ Add plan</Button>}
      />

      <div className="card">
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No plans yet"
          emptyDescription="Create the first membership plan to start selling memberships."
          columns={[
            {
              key: 'name',
              header: 'Plan',
              render: (row) => (
                <span>
                  <span className="strong">{row.name}</span>
                </span>
              ),
            },
            {
              key: 'duration',
              header: 'Duration',
              render: (row) => `${row.durationValue} ${row.durationUnit}${row.durationValue > 1 ? 's' : ''}`,
            },
            { key: 'price', header: 'Price', render: (row) => <span className="strong">{formatCurrency(row.price, 'BDT')}</span> },
            { key: 'tourDiscountPercent', header: 'Tour discount', render: (row) => `${row.tourDiscountPercent}%` },
            { key: 'visaDiscountPercent', header: 'Visa discount', render: (row) => `${row.visaDiscountPercent}%` },
            {
              key: 'maxDiscountAmount',
              header: 'Max cap',
              render: (row) => (row.maxDiscountAmount ? formatCurrency(row.maxDiscountAmount, 'BDT') : <span className="muted">—</span>),
            },
            {
              key: 'isActive',
              header: 'Status',
              render: (row) => (
                <label className="checkbox">
                  <input type="checkbox" checked={row.isActive} onChange={() => toggleActive(row)} />
                  {row.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
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
                  <Button size="sm" variant="danger" onClick={() => setDeletingPlan(row)}>Delete</Button>
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* Edit / Create Modal */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? `Edit “${editing.name}”` : 'Add membership plan'}
        description="Tour and visa discounts are stored per plan, so visa 5% / tour 10% is possible without code changes."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editing ? 'Save changes' : 'Add plan'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="stack">
          <div className="grid grid--2">
            <Input
              label="Plan name"
              value={values.name}
              error={errors.name}
              onChange={(event) => setValue('name', event.target.value)}
              placeholder="Gold"
            />
            <Input
              label="Price (BDT)"
              type="number"
              min="0"
              value={values.price}
              error={errors.price}
              onChange={(event) => setValue('price', event.target.value)}
              placeholder="4500"
            />
          </div>
          <div className="grid grid--3">
            <Input
              label="Duration"
              type="number"
              min="1"
              value={values.durationValue}
              error={errors.durationValue}
              onChange={(event) => setValue('durationValue', event.target.value)}
            />
            <Select
              label="Unit"
              value={values.durationUnit}
              onChange={(event) => setValue('durationUnit', event.target.value)}
              options={DURATION_UNITS.map((unit) => ({ value: unit, label: `${unit}s` }))}
            />
            <Input
              label="Max discount cap (optional)"
              type="number"
              min="0"
              value={values.maxDiscountAmount}
              onChange={(event) => setValue('maxDiscountAmount', event.target.value)}
              placeholder="No cap"
              hint="Per-booking cap in BDT."
            />
          </div>
          <div className="grid grid--2">
            <Input
              label="Tour discount %"
              type="number"
              min="0"
              max="100"
              value={values.tourDiscountPercent}
              error={errors.tourDiscountPercent}
              onChange={(event) => setValue('tourDiscountPercent', event.target.value)}
            />
            <Input
              label="Visa discount %"
              type="number"
              min="0"
              max="100"
              value={values.visaDiscountPercent}
              error={errors.visaDiscountPercent}
              onChange={(event) => setValue('visaDiscountPercent', event.target.value)}
            />
          </div>
          <Input
            label="Description"
            value={values.description}
            onChange={(event) => setValue('description', event.target.value)}
            placeholder="Short description shown on the buy page later."
          />
          <div className="field">
            <label className="field__label" htmlFor="plan-features">Features (one per line)</label>
            <textarea
              id="plan-features"
              className="field__control"
              rows={3}
              value={values.features}
              onChange={(event) => setValue('features', event.target.value)}
              placeholder={'10% off tour packages\nFree pickup service'}
            />
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(event) => setValue('isActive', event.target.checked)}
            />
            Active — available for assignment
          </label>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deletingPlan)}
        onClose={() => setDeletingPlan(null)}
        title="Delete membership plan"
        description={deletingPlan ? `Are you sure you want to delete the plan "${deletingPlan.name}"? This action cannot be undone.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingPlan(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={deleting}>Delete plan</Button>
          </>
        }
      >
        <p className="muted small" style={{ margin: 0 }}>
          Deleting this plan will permanently remove it from the available membership plans.
        </p>
      </Modal>
    </div>
  )
}
