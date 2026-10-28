import { DEFAULT_PAGE_SIZE, PAGINATION_PAGE_SIZES } from './constants'

const key = (table) => `travel-dashboard.page-size.${table}`

// The rows per page a person chose for one table, remembered in the browser. Anything else falls back to 50.
export function loadPageSize(table) {
  try {
    const stored = Number(localStorage.getItem(key(table)))
    return PAGINATION_PAGE_SIZES.includes(stored) ? stored : DEFAULT_PAGE_SIZE
  } catch {
    return DEFAULT_PAGE_SIZE
  }
}

export function savePageSize(table, size) {
  try {
    localStorage.setItem(key(table), String(size))
  } catch {
    // A browser that refuses storage still works. The choice is just not kept.
  }
}
