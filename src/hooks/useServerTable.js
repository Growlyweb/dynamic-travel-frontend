import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadPageSize, savePageSize } from '../utils/pageSize'
import { useDebounce } from './useDebounce'

const LIST_KEYS = ['items', 'total', 'totalPages', 'page', 'pageSize']

/**
 * One behaviour for every list that the server pages.
 *
 *   const table = useServerTable({ table: 'visa-applications', fetcher: visaApi.listApplications, filters: { status } })
 *   <Table data={table.rows} loading={table.loading} refreshing={table.refreshing} />
 *   <TablePagination {...table.paginationProps} itemLabel="applications" />
 *
 * - The page, the rows per page (50 to 500, remembered per table) and the search text live here.
 * - A change of filter or search goes back to page 1. Search is sent after a short pause.
 * - A slow earlier answer never replaces a newer one.
 * - The old rows stay on screen while the next page loads.
 * - If the total shrinks below the current page, it moves to the last page.
 */
export function useServerTable({ table, fetcher, filters = {}, searchDelay = 350, enabled = true }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(() => loadPageSize(table))
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, searchDelay)

  const [state, setState] = useState({ rows: [], total: 0, totalPages: 1, extras: {}, loaded: false })
  const [status, setStatus] = useState({ loading: enabled, error: null })
  const [reloadKey, setReloadKey] = useState(0)
  const latest = useRef(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const filterKey = JSON.stringify(filters)

  // A new filter or search is a new list, so it starts at page 1.
  const previous = useRef({ filterKey, debouncedSearch })
  useEffect(() => {
    if (previous.current.filterKey !== filterKey || previous.current.debouncedSearch !== debouncedSearch) {
      previous.current = { filterKey, debouncedSearch }
      setPage(1)
    }
  }, [filterKey, debouncedSearch])

  useEffect(() => {
    if (!enabled) return undefined
    const ticket = ++latest.current
    setStatus({ loading: true, error: null })
    Promise.resolve(fetcherRef.current({ ...JSON.parse(filterKey), search: debouncedSearch || undefined, page, pageSize }))
      .then((result) => {
        if (ticket !== latest.current) return
        const { items = [], total = items.length, totalPages = 1 } = result ?? {}
        const extras = Object.fromEntries(Object.entries(result ?? {}).filter(([key]) => !LIST_KEYS.includes(key)))
        setState({ rows: items, total, totalPages, extras, loaded: true })
        setStatus({ loading: false, error: null })
        if (page > totalPages) setPage(Math.max(1, totalPages))
      })
      .catch((error) => {
        if (ticket !== latest.current) return
        setStatus({ loading: false, error })
      })
    return undefined
  }, [enabled, filterKey, debouncedSearch, page, pageSize, reloadKey])

  const setPageSize = useCallback(
    (size) => {
      savePageSize(table, size)
      setPageSizeState(size)
      setPage(1)
    },
    [table],
  )

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  const paginationProps = useMemo(
    () => ({ currentPage: page, totalEntries: state.total, pageSize, onPageChange: setPage, onPageSizeChange: setPageSize }),
    [page, state.total, pageSize, setPageSize],
  )

  return {
    rows: state.rows,
    total: state.total,
    totalPages: state.totalPages,
    // Whatever else the server sent with the list, for example `summary` or `totals`.
    extras: state.extras,
    page,
    pageSize,
    setPage,
    setPageSize,
    search,
    setSearch,
    // The first load shows a spinner. A later load keeps the rows and only dims them.
    loading: status.loading && !state.loaded,
    refreshing: status.loading && state.loaded,
    error: status.error,
    reload,
    paginationProps,
  }
}
