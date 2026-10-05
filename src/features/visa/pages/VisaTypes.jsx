import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Select from '../../../components/common/Select'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import VisaTypeDialog from '../components/VisaTypeDialog'
import { visaApi } from '../visa.api'
import { formatCurrency } from '../../../utils/formatters'

export default function VisaTypes() {
  const [countries, setCountries] = useState([])
  const [types, setTypes] = useState([])
  const [countryId, setCountryId] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [countryResult, typeResult] = await Promise.all([
        visaApi.listCountries(),
        visaApi.listVisaTypes(countryId ? { countryId } : {}),
      ])
      setCountries(countryResult.items ?? [])
      setTypes(typeResult.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [countryId])

  useEffect(() => {
    load()
  }, [load])

  const countryById = useCallback(
    (id) => countries.find((country) => country.id === id),
    [countries],
  )

  async function toggleStatus(type) {
    await visaApi.updateVisaType(type.id, { status: type.status === 'active' ? 'paused' : 'active' })
    await load()
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await visaApi.removeVisaType(pendingDelete.id)
      setPendingDelete(null)
      await load()
    } finally {
      setDeleting(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  return (
    <div className="stack">
      <PageHeader
        title="Visa types"
        // description="Visa services per country with B2C and B2B pricing. Paused services stop new applications but keep history."
        breadcrumbs={[{ label: 'Visa' }, { label: 'Visa types' }]}
        actions={<Button onClick={openCreate}>+ Add visa type</Button>}
      />

      <div className="card stack">
        <div className="filters">
          <Select
            label="Country"
            placeholder="All countries"
            value={countryId}
            onChange={(event) => setCountryId(event.target.value)}
            options={countries.map((country) => ({ value: country.id, label: `${country.flag} ${country.name}` }))}
          />
        </div>
        <DataTable
          loading={loading}
          data={types}
          emptyTitle="No visa types configured"
          emptyDescription="Add a visa type so this country can accept applications."
          columns={[
            {
              key: 'countryId',
              header: 'Country',
              render: (row) => {
                const country = countryById(row.countryId)
                return (
                  <span className="row" style={{ gap: 8 }}>
                    {/* <span aria-hidden style={{ fontSize: 16 }}>{country?.flag}</span> */}
                    <span className="strong">{country?.name ?? '—'}</span>
                  </span>
                )
              },
            },
            {
              key: 'name',
              header: 'Visa type',
              render: (row) => (
                <span>
                  <span className="strong">{row.name}</span>
                  <br />
                  {/* <span className="muted small">{row.description}</span> */}
                </span>
              ),
            },
            { key: 'processingTime', header: 'Processing time' },
            { key: 'entries', header: 'Entries', render: (row) => (row.entries === 'multiple' ? 'Multiple' : 'Single') },
            {
              key: 'b2cPrice',
              header: 'B2C price',
              render: (row) => <span className="strong">{formatCurrency(row.b2cPrice, row.currency)}</span>,
            },
            {
              key: 'b2bNetPrice',
              header: 'B2B net',
              render: (row) =>
                row.b2bNetPrice == null ? <span className="muted">—</span> : formatCurrency(row.b2bNetPrice, row.currency),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) =>
                row.status === 'active' ? (
                  <Badge tone="success">Active</Badge>
                ) : (
                  <Badge tone="warning">Paused</Badge>
                ),
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <span className="table-actions">
                  <Button size="sm" variant="ghost" onClick={() => {
                    setEditing(row)
                    setDialogOpen(true)
                  }}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleStatus(row)}>
                    {row.status === 'active' ? 'Pause' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setPendingDelete(row)}>
                    Delete
                  </Button>
                </span>
              ),
            },
          ]}
        />
      </div>

      <VisaTypeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        visaType={editing}
        countries={countries}
        defaultCountryId={countryId || undefined}
        onSaved={load}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete visa type"
        message={`Delete “${pendingDelete?.name ?? 'this visa type'}”? Its checklists will be removed; historical applications are kept.`}
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
