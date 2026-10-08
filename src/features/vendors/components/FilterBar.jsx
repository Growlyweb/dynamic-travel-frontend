import { Button } from '@/components/ui/button'
import { Filter, RotateCcw } from 'lucide-react'

export default function FilterBar({
  filters,
  onChange,
  onReset,
  vendors = [],
  services = [],
  showDueToggle = true,
}) {
  const handleChange = (key, value) => {
    onChange({
      ...filters,
      [key]: value,
    })
  }

  const hasActiveFilters = Boolean(
    filters.from ||
    filters.to ||
    (filters.vendorId && filters.vendorId !== 'all') ||
    (filters.serviceId && filters.serviceId !== 'all') ||
    filters.onlyDue
  )

  return (
    <div className="bg-white border border-border rounded-xl p-3.5 mb-6 shadow-xs">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mr-1">
          <Filter className="size-3.5 text-primary" />
          <span>Filters:</span>
        </div>

        {/* Date From */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-from" className="text-xs text-muted-foreground whitespace-nowrap">
            From:
          </label>
          <input
            id="filter-from"
            type="date"
            value={filters.from || ''}
            onChange={(e) => handleChange('from', e.target.value)}
            className="h-8 px-2 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-to" className="text-xs text-muted-foreground whitespace-nowrap">
            To:
          </label>
          <input
            id="filter-to"
            type="date"
            value={filters.to || ''}
            onChange={(e) => handleChange('to', e.target.value)}
            className="h-8 px-2 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Vendor Dropdown */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-vendor" className="text-xs text-muted-foreground whitespace-nowrap">
            Vendor:
          </label>
          <select
            id="filter-vendor"
            value={filters.vendorId || 'all'}
            onChange={(e) => handleChange('vendorId', e.target.value)}
            className="h-8 px-2.5 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.vendorCode})
              </option>
            ))}
          </select>
        </div>

        {/* Segment Dropdown */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-segment" className="text-xs text-muted-foreground whitespace-nowrap">
            Segment:
          </label>
          <select
            id="filter-segment"
            value={filters.serviceId || 'all'}
            onChange={(e) => handleChange('serviceId', e.target.value)}
            className="h-8 px-2.5 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Segments</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Show Only Vendors with Due Toggle */}
        {showDueToggle && (
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground ml-auto select-none">
            <input
              type="checkbox"
              checked={Boolean(filters.onlyDue)}
              onChange={(e) => handleChange('onlyDue', e.target.checked)}
              className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
            />
            <span>Show only with due</span>
          </label>
        )}

        {/* Reset button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <RotateCcw className="size-3 mr-1" /> Reset
          </Button>
        )}
      </div>
    </div>
  )
}
