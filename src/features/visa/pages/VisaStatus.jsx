import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ChevronDown,
  Clock3,
  Download,
  FileStack,
  Kanban,
  LayoutList,
  Milestone,
  RefreshCw,
  SearchCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import StatCard from '../../../components/charts/StatCard'
import VisaApplicationsTable from '../components/VisaApplicationsTable'
import StatusChangeDialog from '../components/StatusChangeDialog'
import { visaApi, VISA_STAFF } from '../visa.api'
import { APP_ROUTES, VISA_STATUS_TONES } from '../../../utils/constants'
import { formatDate, formatNumber } from '../../../utils/formatters'
import { cn, downloadBlob, getApiErrorMessage, toCsv } from '../../../utils/helpers'

// Shadcn UI components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusSelect } from '@/components/tables/ShadcnDataTable'

export default function VisaStatus() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [statusConfigs, setStatusConfigs] = useState([])
  const [countryOptions, setCountryOptions] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeDatePreset, setActiveDatePreset] = useState(null) // 'today' | '7days' | 'lastMonth' | null
  const [selectedStatuses, setSelectedStatuses] = useState([]) // array of status keys, e.g. ['submitted', 'under_review']
  const [viewMode, setViewMode] = useState('table') // 'table' | 'board'
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [statusChange, setStatusChange] = useState(null) // { application, presetStatus? }

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const [applicationResult, statusResult, countryResult] = await Promise.all([
        visaApi.listApplications(),
        visaApi.listStatusConfigs(),
        visaApi.listCountries(),
      ])
      setRows(applicationResult.items ?? [])
      setStatusConfigs(
        (statusResult.items ?? [])
          .filter((config) => config.active)
          .sort((a, b) => a.displayOrder - b.displayOrder),
      )
      setCountryOptions(
        (countryResult.items ?? []).map((country) => ({
          label: country.name,
          value: country.id,
        })),
      )
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Real-time submission statistics for admin overview cards
  const stats = useMemo(() => {
    const byStatus = (key) => rows.filter((r) => r.status === key).length
    const decided = rows.filter((r) =>
      ['approved', 'passport_ready', 'completed', 'rejected'].includes(r.status),
    ).length

    return {
      total: rows.length,
      submitted: byStatus('submitted'),
      underReview: byStatus('under_review'),
      actionRequired: byStatus('action_required'),
      processing: byStatus('processing'),
      submittedToEmbassy: byStatus('submitted_to_embassy'),
      approved: byStatus('approved') + byStatus('passport_ready') + byStatus('completed'),
      rejected: byStatus('rejected'),
      completed: byStatus('completed'),
      b2c: rows.filter((r) => r.channel === 'b2c').length,
      b2b: rows.filter((r) => r.channel === 'b2b').length,
      unassigned: rows.filter((r) => !r.assignedStaff).length,
      decisionRate: rows.length ? Math.round((decided / rows.length) * 100) : 0,
    }
  }, [rows])

  const statusOptions = useMemo(
    () =>
      statusConfigs.map((config) => ({
        label: config.displayName,
        value: config.key,
        tone: VISA_STATUS_TONES[config.key] ?? 'neutral',
      })),
    [statusConfigs],
  )

  const staffOptions = useMemo(
    () => [
      ...VISA_STAFF.map((staff) => ({ label: staff, value: staff })),
      { label: 'Unassigned', value: '__unassigned__' },
    ],
    [],
  )

  // Unfiltered counts per status for multi-select dropdown badges
  const allGroupedCounts = useMemo(() => {
    return rows.reduce((groups, row) => {
      groups[row.status] = (groups[row.status] ?? 0) + 1
      return groups
    }, {})
  }, [rows])

  // In-progress statuses group for the 3rd stat card
  const inProgressKeys = useMemo(
    () => ['under_review', 'processing', 'submitted_to_embassy', 'documents_completed'],
    [],
  )

  // Filter rows based on date range and multi-select statuses
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (dateFrom && row.submittedAt < dateFrom) return false
      if (dateTo && row.submittedAt > dateTo) return false

      if (selectedStatuses.length > 0) {
        return selectedStatuses.includes(row.status)
      }

      return true
    })
  }, [rows, dateFrom, dateTo, selectedStatuses])

  // Grouped rows for Kanban board view
  const grouped = useMemo(() => {
    return filteredRows.reduce((groups, row) => {
      groups[row.status] = groups[row.status] ?? []
      groups[row.status].push(row)
      return groups
    }, {})
  }, [filteredRows])

  // Date helper formatting YYYY-MM-DD in local time
  const formatYMD = (d) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Toggle button handler for Today, 7 Days, Last Month
  function handleDatePresetToggle(preset) {
    if (activeDatePreset === preset) {
      // Toggle off if already active
      setActiveDatePreset(null)
      setDateFrom('')
      setDateTo('')
      return
    }

    setActiveDatePreset(preset)
    const now = new Date()
    const today = formatYMD(now)

    if (preset === 'today') {
      setDateFrom(today)
      setDateTo(today)
    } else if (preset === '7days') {
      const past = new Date(now)
      past.setDate(past.getDate() - 7)
      setDateFrom(formatYMD(past))
      setDateTo(today)
    } else if (preset === 'lastMonth') {
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      setDateFrom(formatYMD(prevMonthStart))
      setDateTo(formatYMD(prevMonthEnd))
    }
  }

  // Card click sync with status filter
  function handleCardClick(type) {
    if (type === 'all') {
      setSelectedStatuses([])
    } else if (type === 'submitted') {
      if (selectedStatuses.length === 1 && selectedStatuses[0] === 'submitted') {
        setSelectedStatuses([])
      } else {
        setSelectedStatuses(['submitted'])
      }
    } else if (type === 'in_progress') {
      const isAlready =
        selectedStatuses.length === inProgressKeys.length &&
        inProgressKeys.every((k) => selectedStatuses.includes(k))
      if (isAlready) {
        setSelectedStatuses([])
      } else {
        setSelectedStatuses([...inProgressKeys])
      }
    } else if (type === 'action_required') {
      if (selectedStatuses.length === 1 && selectedStatuses[0] === 'action_required') {
        setSelectedStatuses([])
      } else {
        setSelectedStatuses(['action_required'])
      }
    }
  }

  function handleStatusChange(application, nextStatus) {
    if (nextStatus === application.status) return
    setStatusChange({ application, presetStatus: nextStatus })
  }

  function handleResetAllFilters() {
    setSelectedStatuses([])
    setActiveDatePreset(null)
    setDateFrom('')
    setDateTo('')
  }

  function handleExportCsv() {
    const exportColumns = [
      { key: 'number', label: 'Application Number' },
      { key: 'applicant', label: 'Applicant Name', value: (row) => row.applicant?.fullName ?? '' },
      { key: 'email', label: 'Email', value: (row) => row.applicant?.email ?? '' },
      { key: 'mobile', label: 'Mobile', value: (row) => row.applicant?.mobile ?? '' },
      { key: 'passport', label: 'Passport', value: (row) => row.passport?.number ?? '' },
      { key: 'country', label: 'Country' },
      { key: 'visaType', label: 'Visa Type' },
      { key: 'channel', label: 'Channel', value: (row) => (row.channel === 'b2b' ? `B2B (${row.partner ?? ''})` : 'B2C') },
      { key: 'status', label: 'Status' },
      { key: 'staff', label: 'Assigned Staff', value: (row) => row.assignedStaff || 'Unassigned' },
      { key: 'submittedAt', label: 'Submitted Date', value: (row) => formatDate(row.submittedAt) },
      { key: 'updatedAt', label: 'Last Updated', value: (row) => formatDate(row.updatedAt) },
    ]
    const csv = toCsv(filteredRows, exportColumns)
    downloadBlob(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      `visa-status-submissions-${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  if (loading && rows.length === 0) {
    return <Loader fullPage label="Loading visa submission statuses…" />
  }

  if (error && rows.length === 0) {
    return (
      <ErrorState
        title="Could not load visa status information"
        message={getApiErrorMessage(error)}
        onRetry={() => load()}
      />
    )
  }

  const inProgressCount = stats.underReview + stats.processing + stats.submittedToEmbassy

  const isAllCardActive = selectedStatuses.length === 0
  const isSubmittedCardActive = selectedStatuses.length === 1 && selectedStatuses[0] === 'submitted'
  const isInProgressCardActive =
    selectedStatuses.length === inProgressKeys.length &&
    inProgressKeys.every((k) => selectedStatuses.includes(k))
  const isActionRequiredCardActive =
    selectedStatuses.length === 1 && selectedStatuses[0] === 'action_required'

  return (
    <div className="stack">
      <PageHeader
        title="Visa Status Tracking"
        breadcrumbs={[{ label: 'Visa', to: APP_ROUTES.VISA_OVERVIEW }, { label: 'Status Tracking' }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Switcher: Table vs Board */}
            <div className="inline-flex rounded-lg border border-border bg-muted p-1 gap-1">
              <Button
                type="button"
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="xs"
                className={cn(
                  'gap-1.5 text-xs',
                  viewMode === 'table' && 'bg-background shadow-xs font-semibold text-foreground',
                )}
                onClick={() => setViewMode('table')}
                aria-label="Table view"
              >
                <LayoutList className="size-3.5" />
                Table view
              </Button>
              <Button
                type="button"
                variant={viewMode === 'board' ? 'secondary' : 'ghost'}
                size="xs"
                className={cn(
                  'gap-1.5 text-xs',
                  viewMode === 'board' && 'bg-background shadow-xs font-semibold text-foreground',
                )}
                onClick={() => setViewMode('board')}
                aria-label="Board view"
              >
                <Kanban className="size-3.5" />
                Board view
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              title="Export visible submissions to CSV"
              className="text-xs gap-1.5"
            >
              <Download className="size-3.5" />
              Export CSV
            </Button>

            <Link
              to={APP_ROUTES.VISA_STATUSES}
              className="inline-flex items-center gap-1.5 rounded-4xl border border-border bg-input/30 hover:bg-input/50 px-3 py-1.5 text-xs font-medium text-foreground transition-colors"
              title="Manage status workflow configuration"
            >
              <Milestone className="size-3.5" />
              Workflow Statuses
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => load(true)}
              disabled={refreshing}
              title="Refresh submissions"
              className="text-xs gap-1.5"
            >
              <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Top Stat Cards: Submissions by Count */}
      <div className="grid grid--4">
        <StatCard
          label="Total Submissions"
          value={formatNumber(stats.total)}
          hint={`${stats.b2c} B2C · ${stats.b2b} B2B`}
          icon={<FileStack size={20} aria-hidden />}
          active={isAllCardActive}
          onClick={() => handleCardClick('all')}
          className="cursor-pointer"
        />
        <StatCard
          label="New Submissions"
          value={formatNumber(stats.submitted)}
          hint="Awaiting triage & initial review"
          icon={<Clock3 size={20} aria-hidden />}
          active={isSubmittedCardActive}
          onClick={() => handleCardClick('submitted')}
          className="cursor-pointer"
        />
        <StatCard
          label="Under Review & Processing"
          value={formatNumber(inProgressCount)}
          hint={`${stats.underReview} review · ${stats.processing} processing`}
          icon={<SearchCheck size={20} aria-hidden />}
          active={isInProgressCardActive}
          onClick={() => handleCardClick('in_progress')}
          className="cursor-pointer"
        />
        <StatCard
          label="Action Required"
          value={formatNumber(stats.actionRequired)}
          hint={`${stats.unassigned} unassigned applications`}
          icon={<AlertTriangle size={20} aria-hidden />}
          active={isActionRequiredCardActive}
          onClick={() => handleCardClick('action_required')}
          className="cursor-pointer"
        />
      </div>

      {/* Main Content Section: Data Table or Kanban Board */}
      <div className="card space-y-4">
        {/* Filters bar: Dropdown Menu with Multiple Selection + Toggle Buttons for Dates */}
        <div className="space-y-3 pb-3 border-b border-border/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Multi-Select Dropdown Menu (shadcn) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 border-border text-xs font-medium bg-card hover:bg-muted"
                  >
                    <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                    <span>Status:</span>
                    {selectedStatuses.length === 0 ? (
                      <span className="text-muted-foreground font-normal">All statuses</span>
                    ) : (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[11px] font-semibold">
                        {selectedStatuses.length} selected
                      </Badge>
                    )}
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 p-1.5">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Filter by Status</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedStatuses(statusConfigs.map((c) => c.key))}
                        className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                      >
                        Select all
                      </button>
                      <span className="text-muted-foreground text-[10px]">·</span>
                      <button
                        type="button"
                        onClick={() => setSelectedStatuses([])}
                        className="text-[11px] text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="max-h-72 overflow-y-auto">
                    {statusConfigs.map((config) => {
                      const isChecked = selectedStatuses.includes(config.key)
                      const count = allGroupedCounts[config.key] ?? 0
                      const tone = VISA_STATUS_TONES[config.key] ?? 'neutral'
                      const dotColor =
                        tone === 'danger'
                          ? '#ef4444'
                          : tone === 'warning'
                            ? '#f59e0b'
                            : tone === 'success'
                              ? '#10b981'
                              : '#3b82f6'

                      return (
                        <DropdownMenuCheckboxItem
                          key={config.id}
                          checked={isChecked}
                          closeOnClick={false}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStatuses((prev) => [...prev, config.key])
                            } else {
                              setSelectedStatuses((prev) => prev.filter((k) => k !== config.key))
                            }
                          }}
                          className="flex items-center justify-between py-1.5 text-xs cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2 rounded-full inline-block shrink-0"
                              style={{ background: dotColor }}
                            />
                            <span>{config.displayName}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground ml-auto mr-2 font-mono">
                            {count}
                          </span>
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                  </div>
                  {selectedStatuses.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="p-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedStatuses([])}
                          className="w-full text-xs text-muted-foreground hover:text-foreground"
                        >
                          Reset status filter
                        </Button>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-5 w-px bg-border hidden sm:block" />

              {/* Date Presets Toggle Buttons (Today, 7 Day, Last Month) */}
              <div className="inline-flex items-center rounded-lg border border-border/80 bg-muted/50 p-0.5 gap-0.5 shadow-2xs">
                <Button
                  type="button"
                  variant={activeDatePreset === 'today' ? 'default' : 'ghost'}
                  size="xs"
                  className={cn(
                    'h-7 px-2.5 text-xs rounded-md transition-all',
                    activeDatePreset === 'today'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                  )}
                  onClick={() => handleDatePresetToggle('today')}
                  aria-pressed={activeDatePreset === 'today'}
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant={activeDatePreset === '7days' ? 'default' : 'ghost'}
                  size="xs"
                  className={cn(
                    'h-7 px-2.5 text-xs rounded-md transition-all',
                    activeDatePreset === '7days'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                  )}
                  onClick={() => handleDatePresetToggle('7days')}
                  aria-pressed={activeDatePreset === '7days'}
                >
                  7 Days
                </Button>
                <Button
                  type="button"
                  variant={activeDatePreset === 'lastMonth' ? 'default' : 'ghost'}
                  size="xs"
                  className={cn(
                    'h-7 px-2.5 text-xs rounded-md transition-all',
                    activeDatePreset === 'lastMonth'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                  )}
                  onClick={() => handleDatePresetToggle('lastMonth')}
                  aria-pressed={activeDatePreset === 'lastMonth'}
                >
                  Last Month
                </Button>
              </div>

              {/* Date Range Inputs */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium">From:</span>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => {
                      setDateFrom(event.target.value)
                      setActiveDatePreset(null)
                    }}
                    className="h-8 w-36 text-xs bg-card"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium">To:</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(event) => {
                      setDateTo(event.target.value)
                      setActiveDatePreset(null)
                    }}
                    className="h-8 w-36 text-xs bg-card"
                  />
                </div>
              </div>
            </div>

            {/* Reset All Filters Button */}
            {(selectedStatuses.length > 0 || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetAllFilters}
                className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1.5"
              >
                <X className="size-3.5" />
                Reset all filters
              </Button>
            )}
          </div>

          {/* Active status tags list (removable badges) */}
          {selectedStatuses.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-xs text-muted-foreground font-medium mr-1">Filtered by:</span>
              {selectedStatuses.map((key) => {
                const config = statusConfigs.find((c) => c.key === key)
                const tone = VISA_STATUS_TONES[key] ?? 'neutral'
                const dotColor =
                  tone === 'danger'
                    ? '#ef4444'
                    : tone === 'warning'
                      ? '#f59e0b'
                      : tone === 'success'
                        ? '#10b981'
                        : '#3b82f6'
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="gap-1.5 pl-2 pr-1 py-0.5 text-xs font-medium bg-muted/80 text-foreground border border-border/60"
                  >
                    <span className="size-1.5 rounded-full" style={{ background: dotColor }} />
                    <span>{config?.displayName ?? key}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedStatuses((prev) => prev.filter((k) => k !== key))}
                      className="rounded-full hover:bg-muted-foreground/20 p-0.5 ml-0.5 cursor-pointer"
                      aria-label={`Remove ${config?.displayName ?? key} filter`}
                    >
                      <X className="size-3 text-muted-foreground" />
                    </button>
                  </Badge>
                )
              })}
              <button
                type="button"
                onClick={() => setSelectedStatuses([])}
                className="text-xs text-muted-foreground hover:text-destructive underline ml-1 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* View mode 1: Data Table (default) */}
        {viewMode === 'table' ? (
          <VisaApplicationsTable
            data={filteredRows}
            statusOptions={statusOptions}
            countryOptions={countryOptions}
            staffOptions={staffOptions}
            onView={(row) => navigate(APP_ROUTES.VISA_APPLICATION_DETAILS(row.id))}
            onStatusChange={handleStatusChange}
            columns={[
              {
                key: "number",
                header: "Application",
                className: "font-medium whitespace-nowrap",
                // One search hit for: application number, passport, mobile, email.
                searchValue: (row) =>
                  `${row.number} ${row.passport?.number ?? ""} ${row.applicant?.mobile ?? ""} ${row.applicant?.email ?? ""}`,
              },
              {
                key: "applicant",
                header: "Applicant",
                cell: (row) => (
                  <span>
                    <span className="font-medium">{row.applicant?.fullName}</span>
                    {/* <span className="block text-xs text-muted-foreground">
                        {row.partner ? `B2B · ${row.partner}` : "B2C"}
                      </span> */}
                  </span>
                ),
                sortValue: (row) => row.applicant?.fullName ?? "",
              },
              { key: "country", header: "Country" },
              {
                key: "channel",
                header: "Channel",
                cell: (row) => (row.channel === "b2b" ? "B2B" : "B2C"),
                sortValue: (row) => row.channel,
              },
              {
                key: "assignedStaff",
                header: "Staff",
                cell: (row) => row.assignedStaff || "Unassigned",
                sortValue: (row) => row.assignedStaff ?? "",
              },
              {
                key: "status",
                header: "Status",
                sortable: false,
                searchValue: () => "", // don't search on raw status keys
                cell: (row) => (
                  <StatusSelect
                    value={row.status}
                    options={statusOptions}
                    label={`Status for ${row.applicant?.fullName}`}
                    onChange={(value) => onStatusChange?.(row, value)}
                  />
                ),
              },
              {
                key: "updatedAt",
                header: "Updated",
                cell: (row) => formatDate(row.updatedAt),
                sortValue: (row) => row.updatedAt ?? "",
                className: "text-muted-foreground whitespace-nowrap",
              },
            ]}

          />
        ) : (
          /* View mode 2: Kanban Board */
          <div className="kanban">
            {statusConfigs.map((config) => {
              const columnItems = grouped[config.key] ?? []
              return (
                <div className="kanban__column" key={config.id}>
                  <div className="kanban__column-header">
                    <span>{config.displayName}</span>
                    <span className="kanban__count">{columnItems.length}</span>
                  </div>

                  {columnItems.map((application) => (
                    <Link
                      key={application.id}
                      to={APP_ROUTES.VISA_APPLICATION_DETAILS(application.id)}
                      className="kanban__card"
                      style={{
                        display: 'block',
                        color: 'inherit',
                        textDecoration: 'none',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      <div className="row between mb-1" style={{ alignItems: 'flex-start' }}>
                        <p className="kanban__card-title" style={{ margin: 0 }}>
                          {application.applicant.fullName}
                        </p>
                        <span className="badge badge--neutral" style={{ fontSize: 10 }}>
                          {application.channel === 'b2b' ? 'B2B' : 'B2C'}
                        </span>
                      </div>

                      <p className="kanban__card-meta" style={{ margin: '4px 0' }}>
                        <span className="strong">{application.number}</span> · {application.country}
                      </p>

                      <div className="row between" style={{ alignItems: 'center', marginTop: 8 }}>
                        <span className="small muted" style={{ fontSize: 11 }}>
                          {application.assignedStaff || 'Unassigned'}
                        </span>
                        <span className="small muted" style={{ fontSize: 11 }}>
                          {formatDate(application.submittedAt)}
                        </span>
                      </div>

                      {application.actionRequired ? (
                        <div style={{ marginTop: 6 }}>
                          <Badge variant="destructive" className="text-[10px]">
                            action required
                          </Badge>
                        </div>
                      ) : null}
                    </Link>
                  ))}

                  {columnItems.length === 0 ? (
                    <p className="muted small" style={{ textAlign: 'center', padding: '16px 0' }}>
                      No applications here.
                    </p>
                  ) : null}
                </div>
              )
            })}

            {/* Inactive statuses fallback */}
            {Object.entries(grouped)
              .filter(([key]) => !statusConfigs.some((config) => config.key === key))
              .map(([key, items]) => (
                <div className="kanban__column" key={key}>
                  <div className="kanban__column-header">
                    <span>{key.replace(/_/g, ' ')}</span>
                    <span className="kanban__count">{items.length}</span>
                  </div>
                  {items.map((application) => (
                    <Link
                      key={application.id}
                      to={APP_ROUTES.VISA_APPLICATION_DETAILS(application.id)}
                      className="kanban__card"
                      style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
                    >
                      <p className="kanban__card-title">{application.applicant.fullName}</p>
                      <p className="kanban__card-meta">
                        {application.number} · {application.country}
                      </p>
                    </Link>
                  ))}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Status Change Dialog with notes, message and timeline recording */}
      <StatusChangeDialog
        open={Boolean(statusChange)}
        onClose={() => setStatusChange(null)}
        application={statusChange?.application}
        statusOptions={statusConfigs}
        initialStatus={statusChange?.presetStatus}
        onSaved={() => load()}
      />
    </div>
  )
}
