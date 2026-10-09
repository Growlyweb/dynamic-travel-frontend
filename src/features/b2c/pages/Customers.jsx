import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import TablePagination from '../../../components/tables/TablePagination'
import Input from '../../../components/common/Input'
import CustomerTable from '../components/CustomerTable'
import { b2cApi } from '../b2c.api'
import { activeMembershipMap } from '../../membership/membership.api'
import { useDebounce } from '../../../hooks/useDebounce'
import { usePagination } from '../../../hooks/usePagination'
import { APP_ROUTES } from '../../../utils/constants'

export default function Customers() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])
  const [memberIds, setMemberIds] = useState(() => new Set())
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const debouncedSearch = useDebounce(search, 350)
  const { page, pageSize, goToPage, changePageSize } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [result, members] = await Promise.all([b2cApi.list({ page, pageSize, search: debouncedSearch }), activeMembershipMap()])
      setRows(result.items ?? [])
      setMemberIds(members)
      setTotal(result.total ?? 0)
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    goToPage(1)
  }, [debouncedSearch, goToPage])

  return (
    <div className="stack">
      <PageHeader
        title="Customers"
        // description="Direct travelers booking through your channels."
        breadcrumbs={[{ label: 'Customers · B2C' }, { label: 'Customers' }]}
      />
      <div className="card stack">
        <Input
          label="Search"
          type="search"
          placeholder="Name, email or country…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <CustomerTable
          rows={rows}
          memberIds={memberIds}
          loading={loading}
          error={error}
          onRetry={load}
          onView={(row) => navigate(APP_ROUTES.B2C_CUSTOMER_DETAILS(row.id))}
        />
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
