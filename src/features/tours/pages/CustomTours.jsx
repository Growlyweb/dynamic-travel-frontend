import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import TablePagination from '../../../components/tables/TablePagination'
import TableActions from '../../../components/tables/TableActions'
import Badge from '../../../components/common/Badge'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { toursApi } from '../tours.api'
import { usePagination } from '../../../hooks/usePagination'
import { formatDate, formatNumber, initials } from '../../../utils/formatters'
import { downloadPdf, formatDurationNights, padDay } from '../../../utils/itineraryPdf'
import { config } from '../../../app/config'

const STATUS_TONES = {
  pending: 'warning',
  quoted: 'info',
  booked: 'success',
  closed: 'neutral',
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'booked', label: 'Booked' },
  { value: 'closed', label: 'Closed' },
]

const HOTEL_LABELS = {
  budget: 'Budget / Guesthouse',
  '3-star': '3-Star Hotel',
  '4-star': '4-Star Hotel',
  '5-star': '5-Star Luxury',
  resort: 'Beach Resort',
  villa: 'Private Villa',
}

function requestPdf(request) {
  downloadPdf({
    fileName: `custom-tour-${(request.customer || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
    brand: config.appName,
    infoBar: [
      ['Destination', request.destination],
      ['Duration', formatDurationNights(request.itinerary?.length || 1)],
      ['Pax', `${request.travelers} pax`],
    ],
    title: `Custom Tour Request — ${request.destination}`,
    subtitle: `Requested on ${formatDate(request.requestedAt)}`,
    footerLabel: `Custom tour request — ${request.customer}`,
    blocks: [
      { bar: 'Client Contact Information' },
      {
        rows: [
          ['Customer', request.customer],
          ['Phone', request.phone ?? '—'],
          ['Pax / travelers', `${request.travelers} pax`],
        ],
      },
      { bar: 'Trip Preferences' },
      {
        rows: [
          ['Travel dates', `${formatDate(request.startDate)} – ${formatDate(request.endDate)}`],
          ['Hotel preference', HOTEL_LABELS[request.hotel] ?? request.hotel ?? '—'],
          ['Transportation', request.transportation ?? '—'],
          ['Activities', Array.isArray(request.activities) ? request.activities.join(', ') : '—'],
          ['Special requirements', request.requirements || 'None'],
        ],
      },
      ...(Array.isArray(request.itinerary) && request.itinerary.length
        ? [
            { bar: 'Day-by-day Itinerary' },
            ...request.itinerary.map((item) => ({
              day: `Day ${padDay(item.day)}: ${item.title}`,
              lines: item.description ? [item.description] : [],
            })),
          ]
        : []),
      { lines: ['This is a custom trip draft prepared for the client. Contact our travel specialist to finalize.'] },
    ],
  })
}

/* ── Status Selector Dropdown ───────────────────────────── */
function StatusDropdown({ value, onChange }) {
  const tone = STATUS_TONES[value] ?? 'neutral'
  const toneColors = {
    warning: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
    info: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
    success: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
    neutral: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  }
  const style = toneColors[tone] ?? toneColors.neutral

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        borderRadius: 99,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        outline: 'none',
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath fill='%23475569' d='M0 0l4 5 4-5z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        paddingRight: 22,
      }}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: '#fff', color: '#101828' }}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

/* ── Minimal Itinerary Modal ─────────────────────────────── */
function ItineraryModal({ request, onClose, onStatusChange }) {
  if (!request) return null

  return (
    <Modal
      open
      onClose={onClose}
      title={`Custom Tour — ${request.destination}`}
      description={`Submitted by ${request.customer} on ${formatDate(request.requestedAt)}`}
      size="lg"
      footer={
        <div className="row between row--wrap align-center" style={{ width: '100%' }}>
          <span className="muted small">
            Client: <strong>{request.customer}</strong> ({request.phone ?? 'No phone'})
          </span>
          <Button size="sm" onClick={() => requestPdf(request)}>
            Download PDF
          </Button>
        </div>
      }
    >
      <div className="stack" style={{ gap: 18 }}>
        {/* Info Grid */}
        <div
          className="grid grid--3"
          style={{
            gap: 12,
            background: '#fafbfc',
            padding: 16,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div>
            <span className="muted small uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.04em' }}>
              Travelers
            </span>
            <p className="strong" style={{ margin: '2px 0 0', fontSize: 14 }}>
              {request.travelers} Pax
            </p>
          </div>
          <div>
            <span className="muted small uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.04em' }}>
              Travel Dates
            </span>
            <p className="strong" style={{ margin: '2px 0 0', fontSize: 14 }}>
              {formatDate(request.startDate)} → {formatDate(request.endDate)}
            </p>
          </div>
          <div>
            <span className="muted small uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.04em' }}>
              Status
            </span>
            <div style={{ marginTop: 4 }}>
              <StatusDropdown
                value={request.status}
                onChange={(newStatus) => onStatusChange(request.id, newStatus)}
              />
            </div>
          </div>
          <div>
            <span className="muted small uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.04em' }}>
              Hotel Style
            </span>
            <p className="strong" style={{ margin: '2px 0 0', fontSize: 14 }}>
              {HOTEL_LABELS[request.hotel] ?? request.hotel ?? 'Standard'}
            </p>
          </div>
          <div>
            <span className="muted small uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.04em' }}>
              Transportation
            </span>
            <p className="strong" style={{ margin: '2px 0 0', fontSize: 14 }}>
              {request.transportation ?? 'Private vehicle'}
            </p>
          </div>
          <div>
            <span className="muted small uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.04em' }}>
              Phone Number
            </span>
            <p className="strong" style={{ margin: '2px 0 0', fontSize: 14 }}>
              {request.phone ?? '—'}
            </p>
          </div>
        </div>

        {/* Special Requirements */}
        {request.requirements && (
          <div
            style={{
              padding: 12,
              background: '#f8fafc',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '3px solid var(--color-primary)',
              fontSize: 13,
              color: 'var(--color-text)',
            }}
          >
            <strong>Special Requirements:</strong> {request.requirements}
          </div>
        )}

        {/* Day-by-Day Itinerary */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: 'var(--color-text)' }}>
            Day-by-Day Itinerary ({request.itinerary?.length || 0} Days)
          </h4>

          {Array.isArray(request.itinerary) && request.itinerary.length ? (
            <div className="stack" style={{ gap: 10 }}>
              {request.itinerary.map((item) => (
                <div
                  key={item.day}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: 14,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      fontWeight: 700,
                      fontSize: 11,
                      padding: '3px 8px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Day {padDay(item.day)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 4px', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>
                      {item.title}
                    </h5>
                    {item.description && (
                      <p className="muted small" style={{ margin: 0, lineHeight: 1.45, fontSize: 12.5 }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted small">No itinerary has been generated for this request yet.</p>
          )}
        </div>
      </div>
    </Modal>
  )
}

/* ── CustomTours Main Page Component ─────────────────────── */
export default function CustomTours() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)
  const { page, pageSize, goToPage, changePageSize } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await toursApi.listCustom({ page, pageSize })
      setRows(result.items ?? [])
      setTotal(result.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  const handleStatusChange = async (id, newStatus) => {
    try {
      await toursApi.updateCustom(id, { status: newStatus })
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      )
      if (active && active.id === id) {
        setActive((prev) => ({ ...prev, status: newStatus }))
      }
    } catch (err) {
      console.error('Failed to update status', err)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Custom Tour Requests"
        description="Client itinerary requests submitted from the B2C website."
        breadcrumbs={[{ label: 'Tours' }, { label: 'Custom tours' }]}
      />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No custom requests"
          emptyDescription="Custom itinerary requests from website visitors will appear here."
          columns={[
            {
              key: 'customer',
              header: 'Customer',
              render: (row) => (
                <div className="cell-user">
                  <span
                    className="avatar avatar--sm"
                    style={{
                      background: 'var(--color-primary-soft)',
                      color: 'var(--color-primary)',
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {initials(row.customer)}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--color-text)' }}>
                      {row.customer}
                    </span>
                    <span className="muted small" style={{ fontSize: 12 }}>
                      {row.phone ?? '—'}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              key: 'destination',
              header: 'Destination',
              render: (row) => (
                <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--color-text)' }}>
                  {row.destination}
                </span>
              ),
            },
            {
              key: 'travelers',
              header: 'Pax',
              render: (row) => (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'var(--color-bg)',
                    padding: '2px 8px',
                    borderRadius: 99,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {formatNumber(row.travelers)} Pax
                </span>
              ),
            },
            {
              key: 'dates',
              header: 'Travel Dates',
              render: (row) => (
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
                  <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                    {formatDate(row.startDate)} – {formatDate(row.endDate)}
                  </span>
                </div>
              ),
            },
            {
              key: 'itinerary',
              header: 'Itinerary',
              render: (row) => (
                <Badge tone={row.itinerary?.length ? 'primary' : 'neutral'}>
                  {row.itinerary?.length ? `${row.itinerary.length} Days Plan` : 'No Plan'}
                </Badge>
              ),
            },
            {
              key: 'requestedAt',
              header: 'Requested Date',
              render: (row) => (
                <span className="muted small" style={{ fontSize: 12 }}>
                  {formatDate(row.requestedAt)}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <StatusDropdown
                  value={row.status}
                  onChange={(newStatus) => handleStatusChange(row.id, newStatus)}
                />
              ),
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <TableActions
                  actions={[
                    {
                      label: 'View Plan',
                      tone: 'subtle',
                      onClick: () => setActive(row),
                    },
                    {
                      label: 'PDF',
                      tone: 'ghost',
                      onClick: () => requestPdf(row),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
        <div style={{ padding: '0 16px 14px' }}>
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
          />
        </div>
      </div>

      <ItineraryModal
        request={active}
        onClose={() => setActive(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
