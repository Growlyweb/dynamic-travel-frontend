import React from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

/**
 * TableToolbar Component
 * Search bar on left and filter dropdowns / custom actions on right.
 */
export function TableToolbar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search by country, title...',
  showSearch = true,
  filters = [], // Array of { id, value, placeholder, options: [{ value, label }], onChange }
  children,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 pb-4 ${className}`}
    >
      {/* Search Input */}
      {showSearch && (
        <div className="relative w-full md:w-80 lg:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-9 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
          />
          {search && onSearchChange && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        {filters.map((filter) => (
          <div key={filter.id} className="relative min-w-[140px] sm:min-w-[160px]">
            <select
              value={filter.value ?? ''}
              onChange={(e) => filter.onChange?.(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-normal rounded-lg pl-3.5 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-2xs"
            >
              {filter.placeholder && (
                <option value="">{filter.placeholder}</option>
              )}
              {filter.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        ))}

        {children}
      </div>
    </div>
  );
}

export default TableToolbar;
