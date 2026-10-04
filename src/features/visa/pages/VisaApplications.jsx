import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import TablePagination from '../../../components/tables/TablePagination'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import VisaTable from '../components/VisaTable'
import { visaApi } from '../visa.api'
import { useDebounce } from '../../../hooks/useDebounce'
import { usePagination } from '../../../hooks/usePagination'
import { APP_ROUTES, VISA_STATUSES } from '../../../utils/constants'
import { titleCase } from '../../../utils/formatters'
import NewVisaTable from '../components/NewVisaTable'

export default function VisaApplications() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const debouncedSearch = useDebounce(search, 350)
  const { page, pageSize, goToPage, changePageSize } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await visaApi.list({ page, pageSize, search: debouncedSearch, status: status || undefined })
      setRows(result.items ?? [])
      setTotal(result.total ?? 0)
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, status])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    goToPage(1)
  }, [debouncedSearch, status, goToPage])

  return (
    <div className="stack">
      <PageHeader
        title="Visa applications"
        description="Track every application from submission to decision."
        breadcrumbs={[{ label: 'Visa' }, { label: 'Applications' }]}
      />

      <div className="card stack">
        <div className="filters">
          <Input
            label="Search"
            type="search"
            placeholder="Passport, applicant, country…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            label="Status"
            placeholder="All statuses"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={VISA_STATUSES.map((value) => ({ value, label: titleCase(value) }))}
          />
        </div>
        <NewVisaTable/>
        {/* <VisaTable
          rows={rows}
          loading={loading}
          error={error}
          onRetry={load}
          onView={(row) => navigate(APP_ROUTES.VISA_APPLICATION_DETAILS(row.id))}
        /> */}
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      </div>
    </div>
  )
}
