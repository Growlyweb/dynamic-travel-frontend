import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Input from '../../../components/common/Input'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import { visaApi } from '../visa.api'
import { CountryDialog } from '../components/AddCountryDialogue'

export default function NewVisaCountries() {
  const [rows, setRows] = useState([])
  const [typeCounts, setTypeCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [countryResult, typeResult] = await Promise.all([visaApi.listCountries(), visaApi.listVisaTypes()])
      setRows(countryResult.items ?? [])
      const counts = {}
      for (const type of typeResult.items ?? []) {
        counts[type.countryId] = counts[type.countryId] ?? { total: 0, active: 0 }
        counts[type.countryId].total += 1
        if (type.status === 'active') counts[type.countryId].active += 1
      }
      setTypeCounts(counts)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // displayOrder decides the default sequence (China first); the column itself is hidden.
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.displayOrder - b.displayOrder),
    [rows],
  )
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return sortedRows
    return sortedRows.filter((row) => row.name.toLowerCase().includes(query))
  }, [sortedRows, search])

  async function toggleStatus(row) {
    await visaApi.updateCountry(row.id, { status: row.status === 'active' ? 'paused' : 'active' })
    await load()
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await visaApi.removeCountry(pendingDelete.id)
      setPendingDelete(null)
      await load()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Visa countries"
        breadcrumbs={[{ label: 'Visa' }, { label: 'Countries' }]}
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            + Add country
          </Button>
        }
      />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <p className="card__title" style={{ marginBottom: 0 }}>
            {filteredRows.length} {filteredRows.length === 1 ? 'country' : 'countries'}
          </p>
          <Input
            type="search"
            placeholder="Search country…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ maxWidth: 280 }}
          />
        </div>
        <div className="table-premium">
          <DataTable
            loading={loading}
            data={filteredRows}
            emptyTitle={search ? 'No countries match your search' : 'No countries configured'}
            columns={[
              {
                key: 'name',
                header: 'Country',
                render: (row) => (
                  <span>
                    <span className="strong" style={{ fontSize: 15 }}>{row.name}</span>
                    <br />
                    {/* <span className="muted small">{row.description}</span> */}
                  </span>
                ),
              },
              {
                key: 'visaTypes',
                header: 'Visa types',
                render: (row) => {
                  const count = typeCounts[row.id]
                  if (!count) return <span className="muted">None</span>
                  return (
                    <span>
                      <span className="strong">{count.active}</span> active
                      {/* <span className="muted small"> · {count.total} configured</span> */}
                    </span>
                  )
                },
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
      </div>

      <CountryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        country={editing}
        positionMax={editing ? rows.length : rows.length + 1}
        onSaved={load}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete country"
        message={`Delete ${pendingDelete?.name ?? 'this country'} and its visa types? Historical applications are kept, but the country disappears from the service list.`}
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
