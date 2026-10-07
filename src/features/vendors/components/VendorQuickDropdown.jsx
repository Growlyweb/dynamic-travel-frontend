import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import VendorDueBadge from './VendorDueBadge'
import {
  Building2,
  ChevronDown,
  Plus,
  Search,
  ExternalLink,
  Layers,
  Phone,
  FileText,
  CreditCard,
  Briefcase,
  Check,
} from 'lucide-react'
import { cn } from '@/utils/helpers'
import { formatCurrency } from '@/utils/formatters'

export default function VendorQuickDropdown({
  vendors = [],
  selectedVendorId,
  onSelectVendor,
  onAddNewVendor,
  className,
}) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const segments = ['ALL', 'Air Tickets', 'Visas', 'Passports', 'Umrah', 'Hajj', 'Hotels', 'Transport']

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0]

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      !search ||
      vendor.company?.toLowerCase().includes(search.toLowerCase()) ||
      vendor.name?.toLowerCase().includes(search.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(search.toLowerCase())

    const matchesSegment =
      segmentFilter === 'ALL' || (vendor.segments && vendor.segments.includes(segmentFilter))

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'due' && (vendor.dynamicDue > 0 || vendor._calculated?.dynamicDue > 0)) ||
      (statusFilter === 'settled' && (vendor.dynamicDue === 0 || vendor._calculated?.dynamicDue === 0)) ||
      (statusFilter === 'advance' && (vendor.dynamicDue < 0 || vendor._calculated?.dynamicDue < 0))

    return matchesSearch && matchesSegment && matchesStatus
  })

  return (
    <div className={cn('relative inline-flex items-center gap-2', className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="default"
              className="h-10 px-3.5 gap-2.5 rounded-xl border-border/80 bg-background hover:bg-muted/60 text-left font-normal shadow-xs min-w-[260px] justify-between cursor-pointer"
            />
          }
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="size-3.5" />
            </div>
            <div className="truncate leading-tight text-left">
              <p className="text-xs font-semibold text-foreground truncate">
                {selectedVendor ? selectedVendor.company : 'Select Vendor…'}
              </p>
              {selectedVendor && (
                <p className="text-[10.5px] text-muted-foreground truncate">
                  {selectedVendor.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {selectedVendor && (
              <VendorDueBadge
                amount={selectedVendor.dynamicDue ?? selectedVendor._calculated?.dynamicDue ?? 0}
                showIcon={false}
                className="text-[10px] px-1.5 py-0"
              />
            )}
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-96 p-3 rounded-2xl bg-popover text-popover-foreground shadow-2xl border border-border/80"
        >
          {/* Header & Quick Add */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Vendor Directory ({vendors.length})
            </span>
            {onAddNewVendor && (
              <Button
                variant="ghost"
                size="xs"
                className="h-7 px-2 text-xs text-primary gap-1 cursor-pointer hover:bg-primary/10"
                onClick={() => {
                  setOpen(false)
                  onAddNewVendor()
                }}
              >
                <Plus className="size-3.5" />
                <span>New Vendor</span>
              </Button>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Filter by name, agency, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-2 text-xs rounded-lg"
              autoFocus
            />
          </div>

          {/* Segment Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 border-b border-border/60 scrollbar-none">
            {segments.map((seg) => (
              <button
                key={seg}
                type="button"
                onClick={() => setSegmentFilter(seg)}
                className={cn(
                  'text-[10.5px] px-2 py-0.5 rounded-md whitespace-nowrap font-medium transition-colors cursor-pointer',
                  segmentFilter === seg
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {seg}
              </button>
            ))}
          </div>

          {/* Status Filter Toggle */}
          <div className="flex items-center justify-between px-1 mb-2 text-[11px] text-muted-foreground">
            <span>Filter Balance:</span>
            <div className="flex items-center gap-1">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'due', label: 'Due (Red)' },
                { id: 'settled', label: 'Settled (Green)' },
                { id: 'advance', label: 'Advance (Blue)' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-colors',
                    statusFilter === st.id
                      ? 'bg-foreground/10 text-foreground font-bold'
                      : 'hover:text-foreground'
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vendor List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {filteredVendors.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No vendors match filter criteria.
              </div>
            ) : (
              filteredVendors.map((vendor) => {
                const isSelected = selectedVendor?.id === vendor.id
                const dynamicDue = vendor.dynamicDue ?? vendor._calculated?.dynamicDue ?? 0

                return (
                  <div
                    key={vendor.id}
                    onClick={() => {
                      onSelectVendor?.(vendor)
                      setOpen(false)
                    }}
                    className={cn(
                      'p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs',
                      isSelected
                        ? 'bg-primary/10 text-primary-foreground font-medium'
                        : 'hover:bg-muted/60 text-foreground'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground truncate">{vendor.company}</span>
                        {isSelected && <Check className="size-3 text-primary shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground">
                        <span className="truncate">{vendor.name}</span>
                        <span>•</span>
                        <span>{vendor.segments?.slice(0, 2).join(', ')}</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <VendorDueBadge amount={dynamicDue} showIcon={false} className="text-[10px] px-1.5 py-0" />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Action Footer for Selected Vendor */}
          {selectedVendor && (
            <div className="pt-2.5 mt-2 border-t border-border/60 flex items-center justify-between text-xs">
              <Button
                variant="ghost"
                size="xs"
                className="text-[11px] h-7 gap-1 text-primary cursor-pointer"
                onClick={() => {
                  setOpen(false)
                  navigate(`/vendors/${selectedVendor.id}`)
                }}
              >
                <ExternalLink className="size-3" />
                <span>View Full Service Details</span>
              </Button>

              <span className="text-[10.5px] text-muted-foreground">
                ID: {selectedVendor.id}
              </span>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Direct Quick Details Button if vendor is selected */}
      {selectedVendor && (
        <Button
          variant="outline"
          size="sm"
          className="h-10 px-3 rounded-xl gap-1.5 text-xs cursor-pointer border-border/80 hidden sm:flex"
          onClick={() => navigate(`/vendors/${selectedVendor.id}`)}
          title="View Service Details & Ledger"
        >
          <Layers className="size-3.5 text-primary" />
          <span>Service Details</span>
        </Button>
      )}

      {/* Direct Quick Add Button */}
      {onAddNewVendor && (
        <Button
          size="sm"
          className="h-10 px-3.5 rounded-xl gap-1.5 text-xs shadow-xs cursor-pointer"
          onClick={onAddNewVendor}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Add Vendor</span>
        </Button>
      )}
    </div>
  )
}
