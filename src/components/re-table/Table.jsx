import React from 'react';

/**
 * Table / DataTable Component
 * Signature vibrant blue header (#2F80ED), rounded container, and flexible column rendering.
 */
export function Table({
  columns = [],
  data = [],
  rowKey = (row, index) => row.id ?? index,
  loading = false,
  emptyText = 'No entries found',
  emptyDescription = 'Try adjusting your search or filters.',
  headerClassName = 'bg-[#2F80ED] text-white',
  hoverable = true,
  onRowClick,
  className = '',
}) {
  const getAlignmentClass = (align) => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'left':
      default:
        return 'text-left';
    }
  };

  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-200/90 shadow-2xs bg-white ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {/* Table Header */}
          <thead>
            <tr className={`${headerClassName} font-semibold text-xs tracking-wider select-none`}>
              {columns.map((col, idx) => {
                const alignClass = getAlignmentClass(col.align);
                return (
                  <th
                    key={col.key || idx}
                    scope="col"
                    style={{
                      width: col.width,
                      minWidth: col.minWidth,
                      maxWidth: col.maxWidth,
                    }}
                    className={`py-3.5 px-4 font-semibold text-sm ${alignClass} ${col.headerClassName || ''}`}
                  >
                    {typeof col.header === 'function' ? col.header(col) : col.header}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-slate-600">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <p className="text-base font-semibold text-slate-700">{emptyText}</p>
                    {emptyDescription && (
                      <p className="text-xs text-slate-400 max-w-sm">{emptyDescription}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const key = typeof rowKey === 'function' ? rowKey(row, index) : row[rowKey] ?? index;
                const isClickable = Boolean(onRowClick);

                return (
                  <tr
                    key={key}
                    onClick={isClickable ? () => onRowClick(row, index) : undefined}
                    className={`bg-white transition-colors duration-150 ${
                      hoverable ? 'hover:bg-slate-50/70' : ''
                    } ${isClickable ? 'cursor-pointer' : ''}`}
                  >
                    {columns.map((col, colIdx) => {
                      const alignClass = getAlignmentClass(col.align);
                      return (
                        <td
                          key={col.key || colIdx}
                          style={{
                            width: col.width,
                            minWidth: col.minWidth,
                            maxWidth: col.maxWidth,
                          }}
                          className={`py-3.5 px-4 align-middle text-sm whitespace-nowrap ${alignClass} ${col.cellClassName || ''}`}
                        >
                          {col.render
                            ? col.render(row, index, col)
                            : row[col.key] ?? '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { Table as DataTable };
export default Table;
