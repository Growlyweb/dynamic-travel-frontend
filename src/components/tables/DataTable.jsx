import EmptyState from '../common/EmptyState'
import Loader from '../common/Loader'

export default function DataTable({
  columns,
  data = [],
  rowKey = (row) => row.id,
  loading = false,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  onRowClick,
  compact = false,
  refreshing = false,
}) {
  if (loading) {
    return (
      <div className="table-loading">
        <Loader />
      </div>
    )
  }

  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className={`table-wrap${compact ? ' table-wrap--compact' : ''}${refreshing ? ' is-refreshing' : ''}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ width: column.width, textAlign: column.align }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={rowKey(row) ?? index}
              className={onRowClick ? 'table__row--clickable' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} style={{ textAlign: column.align }}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
