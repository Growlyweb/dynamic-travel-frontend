import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import { visaApi } from '../visa.api'

export default function VisaCountries() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await visaApi.listCountries()
      setRows(result.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function toggleActive(row) {
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, active: !item.active } : item)))
  }

  return (
    <div className="stack">
      <PageHeader
        title="Visa countries"
        description="Destinations the agency currently supports."
        breadcrumbs={[{ label: 'Visa' }, { label: 'Countries' }]}
      />
      <div className="card">
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No countries configured"
          columns={[
            { key: 'name', header: 'Country', render: (row) => <span className="strong">{row.name}</span> },
            { key: 'code', header: 'Code' },
            { key: 'visaTypes', header: 'Visa types' },
            { key: 'processingTime', header: 'Processing time' },
            {
              key: 'active',
              header: 'Status',
              render: (row) => <Badge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Active' : 'Paused'}</Badge>,
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <Button size="sm" variant="ghost" onClick={() => toggleActive(row)}>
                  {row.active ? 'Pause' : 'Activate'}
                </Button>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
