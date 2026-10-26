import Button from '../common/Button'
import { PAGINATION_PAGE_SIZES } from '../../utils/constants'

export default function TablePagination({
  page: pageProp,
  pageSize,
  total: totalProp,
  // The names the other kit and useServerTable use work here too.
  currentPage,
  totalEntries,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGINATION_PAGE_SIZES,
}) {
  const page = pageProp ?? currentPage ?? 1
  const total = totalProp ?? totalEntries ?? 0
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="table-pagination">
      <span>
        Showing {from.toLocaleString()} to {to.toLocaleString()} of {total.toLocaleString()}
      </span>
      <div className="table-pagination__controls">
        <select
          value={pageSize}
          aria-label="Rows per page"
          onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
        <Button variant="ghost" size="sm" onClick={() => onPageChange?.(page - 1)} disabled={page <= 1}>
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button variant="ghost" size="sm" onClick={() => onPageChange?.(page + 1)} disabled={page >= totalPages}>
          Next
        </Button>
      </div>
    </div>
  )
}
