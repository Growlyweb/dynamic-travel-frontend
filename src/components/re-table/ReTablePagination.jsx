import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ReTablePagination Component
 * Renders the pagination footer with entry counts and interactive page buttons
 */
export function ReTablePagination({
  currentPage = 1,
  totalEntries = 0,
  pageSize = 10,
  onPageChange,
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const current = Math.min(Math.max(1, currentPage), totalPages);

  const startEntry = totalEntries === 0 ? 0 : (current - 1) * pageSize + 1;
  const endEntry = Math.min(current * pageSize, totalEntries);

  // Generate page numbers with ellipsis when total pages > 7
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 text-sm text-slate-500 ${className}`}
    >
      {/* Entries Info */}
      <div className="font-normal text-slate-600">
        Showing <span className="font-medium text-slate-800">{startEntry}</span> to{' '}
        <span className="font-medium text-slate-800">{endEntry}</span> of{' '}
        <span className="font-medium text-slate-800">{totalEntries}</span> entries
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5 select-none">
        {/* Prev Button */}
        <button
          type="button"
          onClick={() => onPageChange?.(current - 1)}
          disabled={current <= 1}
          className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="w-8 h-8 flex items-center justify-center text-slate-400"
              >
                ...
              </span>
            );
          }

          const isActive = page === current;

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange?.(page)}
              className={`w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-[#0066FF] text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange?.(current + 1)}
          disabled={current >= totalPages}
          className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default ReTablePagination;
