import { useCallback, useState } from 'react'
import { config } from '../app/config'

export function usePagination({ initialPage = 1, initialPageSize = config.defaultPageSize } = {}) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const goToPage = useCallback((next) => setPage(Math.max(1, Number(next) || 1)), [])

  const nextPage = useCallback(() => setPage((current) => current + 1), [])
  const prevPage = useCallback(() => setPage((current) => Math.max(1, current - 1)), [])

  const changePageSize = useCallback((size) => {
    setPageSize(Number(size))
    setPage(1)
  }, [])

  return { page, pageSize, goToPage, nextPage, prevPage, changePageSize }
}
