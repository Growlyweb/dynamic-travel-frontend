import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import VisaTypeDialog from '../components/VisaTypeDialog'
import { visaApi } from '../visa.api'
import { formatDate, formatCurrency } from '../../../utils/formatters'

export default function VisaPricing() {
  const [countries, setCountries] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [countryResult, typeResult] = await Promise.all([visaApi.listCountries(), visaApi.listVisaTypes()])
      setCountries(countryResult.items ?? [])
      setTypes(typeResult.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const countryById = useCallback((id) => countries.find((country) => country.id === id), [countries])

  return (
    <div className="stack">
      <PageHeader
        title="Visa pricing"
        // description="B2C and B2B prices with the fee breakdown. Customers only ever see the total — the backend recalculates it by role."
        breadcrumbs={[{ label: 'Visa' }, { label: 'Pricing' }]}
      />

      <div className="card">
        <DataTable
          loading={loading}
          data={types}
          emptyTitle="No pricing configured"
          emptyDescription="Add a visa type to set its pricing."
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
            { key: 'name', header: 'Visa type', render: (row) => <span className="strong">{row.name}</span> },
            { key: 'currency', header: 'Currency' },
            { key: 'embassy', header: 'Embassy fee', render: (row) => formatCurrency(row.fees?.embassy ?? 0, row.currency) },
            { key: 'service', header: 'Service fee', render: (row) => formatCurrency(row.fees?.service ?? 0, row.currency) },
            { key: 'vat', header: 'VAT', render: (row) => formatCurrency(row.fees?.vat ?? 0, row.currency) },
            {
              key: 'b2cPrice',
              header: 'B2C total',
              render: (row) => <span className="strong">{formatCurrency(row.b2cPrice, row.currency)}</span>,
            },
            {
              key: 'b2bNetPrice',
              header: 'B2B total',
              render: (row) =>
                row.b2bNetPrice == null ? <span className="muted">—</span> : <span className="strong">{formatCurrency(row.b2bNetPrice, row.currency)}</span>,
            },
            { key: 'validFrom', header: 'Effective from', render: (row) => (row.validFrom ? formatDate(row.validFrom) : '—') },
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
                <Button size="sm" variant="ghost" onClick={() => {
                  setEditing(row)
                  setDialogOpen(true)
                }}>
                  Edit pricing
                </Button>
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
        onSaved={load}
      />
    </div>
  )
}
