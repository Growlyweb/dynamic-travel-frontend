export function cn(...classes) {
  return classes.flat(Infinity).filter(Boolean).join(' ')
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function groupBy(list, getKey) {
  return list.reduce((groups, item) => {
    const key = getKey(item)
    groups[key] = groups[key] ?? []
    groups[key].push(item)
    return groups
  }, {})
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function toCsv(rows = [], columns = []) {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const header = columns.map((column) => escape(column.label ?? column.key)).join(',')
  const body = rows
    .map((row) =>
      columns
        .map((column) => escape(typeof column.value === 'function' ? column.value(row) : row[column.key]))
        .join(','),
    )
    .join('\n')
  return [header, body].filter(Boolean).join('\n')
}

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.data?.message || error?.message || fallback
}
