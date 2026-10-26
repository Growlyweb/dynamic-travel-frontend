import React, { useState, useMemo } from 'react';
import ReTableCard from './ReTableCard';
import ReTableHeader from './ReTableHeader';
import ReTableToolbar from './ReTableToolbar';
import ReTable from './ReTable';
import ReTablePagination from './ReTablePagination';

/**
 * ReTableFull Component
 * An all-in-one smart component combining Header + Toolbar + Table + Pagination.
 * Supports automated client-side searching, filtering, and pagination out of the box,
 * or full server-side controlled execution.
 */
export function ReTableFull({
  // Header props
  title,
  subtitle,
  icon,
  actionText,
  onAction,
  actionIcon,
  headerExtra,

  // Table props
  columns = [],
  data = [],
  rowKey,
  loading = false,
  emptyText,
  emptyDescription,
  headerClassName,
  onRowClick,

  // Search & Filter props
  searchable = true,
  searchPlaceholder = 'Search by country, title...',
  searchFields = ['country', 'countryName', 'title'],
  filters = [], // [{ id, value, placeholder, options, onChange, filterFn }]
  toolbarChildren,

  // Pagination props
  paginated = true,
  pageSize = 10,
  initialPage = 1,

  // Server-side / controlled overrides
  controlled = false,
  controlledPage,
  controlledTotalEntries,
  onControlledPageChange,
  controlledSearch,
  onControlledSearchChange,

  className = '',
}) {
  // Client-side state
  const [internalSearch, setInternalSearch] = useState('');
  const [internalPage, setInternalPage] = useState(initialPage);
  const [internalFilterValues, setInternalFilterValues] = useState({});

  const activeSearch = controlled ? (controlledSearch ?? '') : internalSearch;
  const activePage = controlled ? (controlledPage ?? 1) : internalPage;

  // Handle client-side filtering
  const filteredData = useMemo(() => {
    if (controlled) return data;

    let result = [...data];

    // Search filter
    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase().trim();
      result = result.filter((row) => {
        return searchFields.some((field) => {
          const val = row[field];
          if (val == null) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Dropdown filters
    filters.forEach((filter) => {
      const selectedVal = filter.value !== undefined ? filter.value : internalFilterValues[filter.id];
      if (!selectedVal) return;

      if (typeof filter.filterFn === 'function') {
        result = result.filter((row) => filter.filterFn(row, selectedVal));
      } else {
        result = result.filter((row) => {
          const rowVal = row[filter.id];
          return String(rowVal).toLowerCase() === String(selectedVal).toLowerCase();
        });
      }
    });

    return result;
  }, [controlled, data, activeSearch, searchFields, filters, internalFilterValues]);

  // Handle client-side pagination
  const paginatedData = useMemo(() => {
    if (controlled || !paginated) return filteredData;
    const startIndex = (activePage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [controlled, paginated, filteredData, activePage, pageSize]);

  const totalEntries = controlled ? (controlledTotalEntries ?? data.length) : filteredData.length;

  // Handle page change
  const handlePageChange = (newPage) => {
    if (controlled) {
      onControlledPageChange?.(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  // Handle search change
  const handleSearchChange = (val) => {
    if (controlled) {
      onControlledSearchChange?.(val);
    } else {
      setInternalSearch(val);
      setInternalPage(1); // Reset to page 1 on search
    }
  };

  // Toolbar filters setup
  const preparedFilters = filters.map((f) => ({
    ...f,
    value: f.value !== undefined ? f.value : (internalFilterValues[f.id] || ''),
    onChange: (val) => {
      if (f.onChange) f.onChange(val);
      if (!controlled) {
        setInternalFilterValues((prev) => ({ ...prev, [f.id]: val }));
        setInternalPage(1);
      }
    },
  }));

  return (
    <ReTableCard className={className}>
      {/* Top Header */}
      {(title || actionText) && (
        <ReTableHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          actionText={actionText}
          onAction={onAction}
          actionIcon={actionIcon}
          extraActions={headerExtra}
        />
      )}

      {/* Toolbar / Search / Filters */}
      {(searchable || preparedFilters.length > 0 || toolbarChildren) && (
        <ReTableToolbar
          showSearch={searchable}
          search={activeSearch}
          onSearchChange={handleSearchChange}
          searchPlaceholder={searchPlaceholder}
          filters={preparedFilters}
        >
          {toolbarChildren}
        </ReTableToolbar>
      )}

      {/* Main Table */}
      <ReTable
        columns={columns}
        data={paginatedData}
        rowKey={rowKey}
        loading={loading}
        emptyText={emptyText}
        emptyDescription={emptyDescription}
        headerClassName={headerClassName}
        onRowClick={onRowClick}
      />

      {/* Pagination Footer */}
      {paginated && (
        <ReTablePagination
          currentPage={activePage}
          totalEntries={totalEntries}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      )}
    </ReTableCard>
  );
}

export default ReTableFull;
