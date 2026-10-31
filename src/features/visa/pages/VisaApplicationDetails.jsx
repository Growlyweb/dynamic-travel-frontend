import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Select from '../../../components/common/Select'
import VisaStatusBadge from '../components/VisaStatusBadge'
import VisaTimeline from '../components/VisaTimeline'
import StatusChangeDialog from '../components/StatusChangeDialog'
import PassportManageDialog from '../components/PassportManageDialog'
import ApplicationPayments from '../components/ApplicationPayments'
import ApplicationDocuments from '../components/ApplicationDocuments'
import ApplicationMessages from '../components/ApplicationMessages'
import { visaApi, PASSPORT_STATUS_LABELS, PASSPORT_STATUS_TONES, PASSPORT_METHOD_LABELS, PASSPORT_REQUIREMENT_LABELS } from '../visa.api'
import { nextStatuses } from '../statusRules'
import { usePermission } from '../../../hooks/usePermission'
import { useToast } from '../../../context/ToastContext'
import { PERMISSIONS } from '../../../utils/permissions'
import { APP_ROUTES } from '../../../utils/constants'
import { formatDate, formatDateTime, formatCurrency } from '../../../utils/formatters'
import { cn } from '../../../utils/helpers'
import { errorMessage } from '../../../utils/errors'

const WORKFLOW_STEPS = [
  { key: 'submitted', label: 'Application submitted' },
  { key: 'under_review', label: 'Under review' },
  { key: 'processing', label: 'Processing' },
  { key: 'submitted_to_embassy', label: 'Submitted to embassy' },
  { key: 'approved', label: 'Approved' },
  { key: 'completed', label: 'Completed' },
]
const STATUS_ORDER = {
  submitted: 0,
  under_review: 1,
  action_required: 1,
  documents_completed: 1,
  processing: 2,
  submitted_to_embassy: 3,
  approved: 4,
  passport_ready: 4,
  completed: 5,
}

const DOC_TONES = { verified: 'success', pending: 'warning', rejected: 'danger', missing: 'neutral' }
const DOC_ICONS = { verified: '✓', pending: '⚠', rejected: '✕', missing: '—' }
const VISIBILITY_TONES = { internal: 'neutral', customer: 'info', both: 'primary' }

function normalizeTokens(text) {
  return String(text)
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2)
}

function matchDocumentForItem(item, documents) {
  const itemTokens = new Set(normalizeTokens(item.label))
  let best = null
  for (const document of documents) {
    const docTokens = normalizeTokens(document.type)
    const overlap = docTokens.filter((token) => itemTokens.has(token)).length
    const score = overlap / Math.max(docTokens.length, itemTokens.size)
    if (overlap > 0 && (!best || score > best.score)) best = { document, score }
  }
  return best && best.score >= 0.4 ? best.document : null
}

// The details of a ticket, a hotel booking or a tour package, as the form collected them.
function serviceRows(application) {
  const { ticket, hotel, tour } = application
  if (application.serviceType === 'ticket' && ticket) {
    const base = [
      ['Trip type', ticket.tripType],
      ['Travel class', ticket.travelClass],
    ]
    if (ticket.tripType === 'Multi City' && Array.isArray(ticket.legs) && ticket.legs.length > 0) {
      ticket.legs.forEach((leg, index) => {
        base.push([`Flight ${index + 1}`, `${leg.departure} → ${leg.arrival}`])
      })
    } else {
      base.push(['Departure', ticket.departure])
      base.push(['Arrive', ticket.arrival])
    }
    return base
  }
  if (application.serviceType === 'hotel' && hotel) {
    return [['Hotel', hotel.name], ['Country', hotel.country], ['City / location', hotel.city], ['Stay duration', hotel.stay]]
  }
  if (application.serviceType === 'tour' && tour) {
    return [
      ['Package', tour.packageName || '—'],
      ['Duration', tour.duration],
      ...tour.destinations.map((stop, index) => [`Destination ${index + 1}`, [stop.city, stop.country].filter(Boolean).join(', ')]),
    ]
  }
  return []
}

function passportValidityWarning(passport) {
  if (!passport?.expiry) return null
  const expiry = new Date(passport.expiry)
  if (Number.isNaN(expiry.getTime())) return null
  const sixMonthsLater = new Date()
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)
  return expiry < sixMonthsLater
}

export default function VisaApplicationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { can, isAdmin } = usePermission()
  const [application, setApplication] = useState(null)
  const [checklist, setChecklist] = useState(null)
  const [statusConfigs, setStatusConfigs] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [noteDrafts, setNoteDrafts] = useState({ internal: '', customer: '' })
  const [savingAction, setSavingAction] = useState(false)
  const [visaType, setVisaType] = useState(null)
  const [passportDialogOpen, setPassportDialogOpen] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const applicationResult = await visaApi.getApplication(id)
      if (!applicationResult) throw new Error('Application not found')
      setApplication(applicationResult)
      const isVisa = !applicationResult.serviceType || applicationResult.serviceType === 'visa'
      const countryId = applicationResult.countryId || (typeof applicationResult.country === 'object' ? applicationResult.country?._id : applicationResult.country)
      const visaTypeId = applicationResult.visaTypeId || (typeof applicationResult.visaType === 'object' ? applicationResult.visaType?._id : applicationResult.visaType)
      const applicantType = applicationResult.applicant?.applicantType || 'individual'

      const [checklistResult, statusResult, typeResult, staffResult] = await Promise.all([
        isVisa && countryId && visaTypeId
          ? visaApi.getChecklist({ countryId, visaTypeId, applicantType }).catch(() => null)
          : Promise.resolve(null),
        visaApi.listStatusConfigs().catch(() => ({ items: [] })),
        isVisa && countryId
          ? visaApi.listVisaTypes({ countryId }).catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] }),
        visaApi.listStaff ? visaApi.listStaff().catch(() => []) : Promise.resolve([]),
      ])
      setChecklist(checklistResult)
      setStatusConfigs(statusResult?.items ?? [])
      setVisaType((typeResult?.items ?? []).find((type) => (type.id === visaTypeId || type._id === visaTypeId)) ?? null)
      setStaff(staffResult ?? [])
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // Something changed: read the application again, and say what happened.
  const changed = useCallback(
    async (message) => {
      await load()
      if (message) toast.success(message)
    },
    [load, toast],
  )

  async function runAction(action, done) {
    setSavingAction(true)
    try {
      await action()
      await changed(done)
    } catch (failure) {
      toast.error(errorMessage(failure))
    } finally {
      setSavingAction(false)
    }
  }

  if (loading) return <Loader fullPage label="Loading application…" />
  if (error) return <ErrorState title="Could not load this application" message={errorMessage(error)} onRetry={load} />
  if (!application) return null

  const isVisa = application.serviceType === 'visa'
  const isRejected = application.status === 'rejected'
  // Only a visa goes to an embassy; the other services skip that step.
  const workflow = isVisa ? WORKFLOW_STEPS : WORKFLOW_STEPS.filter((step) => step.key !== 'submitted_to_embassy')
  const embassyIndex = WORKFLOW_STEPS.findIndex((step) => step.key === 'submitted_to_embassy')
  const statusOrder = STATUS_ORDER[application.status] ?? 0
  const order = isRejected ? workflow.length - 1 : isVisa || statusOrder < embassyIndex ? statusOrder : statusOrder - 1
  const steps = workflow.map((step, index) => ({
    label: isRejected && index === order ? 'Rejected' : step.label,
    state: index <= order ? 'done' : 'todo',
  }))

  const detailRows = serviceRows(application)
  const applicant = application.applicant
  const passport = application.passport
  const passportWarning = isVisa ? passportValidityWarning(passport) : null
  const price = application.price
  const canEdit = can(PERMISSIONS.VISA_EDIT)
  const canChangeStatus = can(PERMISSIONS.VISA_UPDATE) && nextStatuses(application.status, statusConfigs, { isAdmin }).length > 0

  async function addNote(type) {
    const text = noteDrafts[type].trim()
    if (!text) return
    await runAction(() => visaApi.addNote(application.id, { type, text }), 'Note added.')
    setNoteDrafts((current) => ({ ...current, [type]: '' }))
  }

  return (
    <div className="stack">
      <PageHeader
        title={application.number}
        description={isVisa ? `${applicant.fullName} · ${application.country} · ${application.visaType}` : `${applicant.fullName} · ${application.serviceLabel} · ${application.serviceSummary}`}
        breadcrumbs={[
          { label: 'Visa', to: APP_ROUTES.VISA_APPLICATIONS },
          { label: 'Applications', to: APP_ROUTES.VISA_APPLICATIONS },
          { label: application.number },
        ]}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate(APP_ROUTES.VISA_APPLICATIONS)}>Back</Button>
            {canChangeStatus ? <Button onClick={() => setStatusDialogOpen(true)}>Change status</Button> : null}
          </>
        }
      />

      {/* Header summary */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <VisaStatusBadge status={application.status} />
            <Badge tone={application.channel === 'b2b' ? 'info' : 'primary'}>
              {application.channel === 'b2b' ? `B2B · ${application.partner}` : 'B2C'}
            </Badge>
            {checklist?.isDefault ? <Badge tone="warning">checklist template</Badge> : null}
          </div>
          <span className="text-xs text-slate-500">
            Submitted {formatDate(application.submittedAt)} · Updated {formatDate(application.updatedAt)}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Application no.</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{application.number}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{isVisa ? 'Country / visa type' : 'Service'}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {isVisa ? `${application.country} — ${application.visaType}` : `${application.serviceLabel}${application.country ? ` — ${application.country}` : ''}`}
            </p>
          </div>
          {isVisa || passport.number ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Passport number</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{passport.number || '—'}</p>
            </div>
          ) : null}
          {isVisa ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Passport expiry</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatDate(passport.expiry)}
                {passportWarning ? <span className="ml-1 text-xs font-semibold text-rose-600"> · under 6 months</span> : null}
              </p>
            </div>
          ) : null}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Assigned staff</p>
            <div className="mt-1">
              <Select
                value={application.assignedStaffId ?? ''}
                aria-label="Assigned staff"
                disabled={!canEdit || savingAction}
                onChange={(event) => runAction(() => visaApi.assignStaff(application.id, event.target.value || null), 'Staff updated.')}
                options={[{ value: '', label: 'Unassigned' }, ...staff.map((person) => ({ value: person.id ?? person._id, label: person.name }))]}
              />
            </div>
          </div>
          {isVisa ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{application.channel === 'b2b' ? 'B2B net price' : 'B2C price'}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{formatCurrency(application.channel === 'b2b' ? price.b2b : price.b2c, price.currency)}</p>
            </div>
          ) : null}
        </div>
        {passportWarning ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
            Passport should have at least 6 months validity for this visa application.
          </p>
        ) : null}
      </div>

      {/* Action required / rejection banners */}
      {application.actionRequired ? (
        <div className="alert alert--danger">
          <strong>Action required:</strong> {application.actionRequired.message}
          <span className="muted small" style={{ display: 'block' }}>
            Requested by {application.actionRequired.requestedBy} · {formatDate(application.actionRequired.requestedAt)}
          </span>
        </div>
      ) : null}
      {isRejected && application.rejection ? (
        <div className="alert alert--danger">
          <strong>Rejected:</strong> {application.rejection.customerReason || 'No customer-facing reason recorded.'}
          {application.rejection.internalReason ? (
            <span className="muted small" style={{ display: 'block' }}>Internal: {application.rejection.internalReason}</span>
          ) : null}
        </div>
      ) : null}

      <ApplicationPayments application={application} onChanged={changed} onOpenAccounts={() => navigate('/accounts/sales')} />

      <div className="grid grid--2">
        {/* Applicant information */}
        <div className="stack stack--sm">
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">Applicant information</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Full name</p><p className="mt-0.5 font-medium text-slate-800">{applicant.fullName}</p></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Date of birth</p><p className="mt-0.5 font-medium text-slate-800">{formatDate(applicant.dob)}</p></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Gender</p><p className="mt-0.5 font-medium text-slate-800">{applicant.gender}</p></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nationality</p><p className="mt-0.5 font-medium text-slate-800">{applicant.nationality}</p></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mobile</p><p className="mt-0.5 font-medium text-slate-800">{applicant.mobile}</p></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Email</p><p className="mt-0.5 font-medium text-slate-800">{applicant.email}</p></div>
              <div className="col-span-2"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Address</p><p className="mt-0.5 font-medium text-slate-800">{[applicant.address, applicant.city].filter(Boolean).join(', ') || '—'}</p></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Applicant type</p><p className="mt-0.5 font-medium text-slate-800">{applicant.applicantType}</p></div>
            </div>
          </div>
          {!isVisa ? (
            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">{application.serviceLabel} details</h3>
              <dl className="detail-list mt-3">
                {detailRows.map(([label, value]) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            </div>
          ) : (
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">Passport</h3>
              {can(PERMISSIONS.PASSPORT_UPDATE) ? <Button size="sm" variant="subtle" onClick={() => setPassportDialogOpen(true)}>Manage</Button> : null}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="info">{PASSPORT_METHOD_LABELS[application.passportSubmissionMethod] ?? '—'}</Badge>
              <Badge tone={PASSPORT_STATUS_TONES[application.passportStatus] ?? 'neutral'}>
                {PASSPORT_STATUS_LABELS[application.passportStatus] ?? application.passportStatus}
              </Badge>
              <span className="text-xs text-slate-500">
                {visaType ? PASSPORT_REQUIREMENT_LABELS[visaType.passportRequirement] ?? visaType.passportRequirement : ''}
              </span>
            </div>
            {application.pickupRequest ? (
              <p className="text-xs text-slate-500 mt-2.5">
                {application.pickupRequest.locationType} pickup · {application.pickupRequest.address}
                {application.pickupRequest.district ? `, ${application.pickupRequest.district}` : ''}
                {application.pickupRequest.preferredDate ? ` · preferred ${formatDate(application.pickupRequest.preferredDate)}` : ''}
                {application.pickupRequest.assignedStaff ? ` · staff: ${application.pickupRequest.assignedStaff}` : ''}
              </p>
            ) : null}
            {application.passportStatus === 'online' || application.passportStatus === 'not_required' ? (
              <p className="text-xs text-slate-500 mt-2.5">Online processing — no physical passport required.</p>
            ) : null}
          </div>
          )}
        </div>

        {/* Progress + documents */}
        <div className="stack stack--sm">
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">Progress</h3>
            <div className="mt-3">
              <VisaTimeline steps={steps} />
            </div>
          </div>
          <ApplicationDocuments application={application} checklist={checklist} onChanged={changed} />
        </div>
      </div>

      <div className={isVisa ? 'grid grid--2' : undefined}>
        {/* Checklist */}
        {isVisa ? (
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
            Checklist — {application.country} / {application.visaType} / {applicant.applicantType}
          </h3>
          {checklist ? (
            <ul className="stack stack--sm mt-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {checklist.items
                .filter((item) => item.active)
                .map((item) => {
                  const document = application.documents.find((entry) => entry.checklistItem && String(entry.checklistItem) === String(item.id)) ?? matchDocumentForItem(item, application.documents)
                  const status = document?.status ?? 'missing'
                  return (
                    <li key={item.id} className="row between" style={{ gap: 8 }}>
                      <span className="row" style={{ gap: 8 }}>
                        <span aria-hidden className={cn('strong', status === 'missing' && 'muted')}>{DOC_ICONS[status]}</span>
                        <span>
                          {item.label}
                          {item.requirement !== 'required' ? <span className="muted small"> ({item.requirement})</span> : null}
                        </span>
                      </span>
                      <Badge tone={DOC_TONES[status]}>{status === 'missing' ? 'not uploaded' : status}</Badge>
                    </li>
                  )
                })}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 mt-3">No checklist configured for this combination.</p>
          )}
        </div>
        ) : null}

        {/* Timeline */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">Timeline</h3>
          <ul className="stack stack--sm mt-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {application.timeline.map((event) => (
              <li key={event.id} className="row between row--wrap" style={{ gap: 8, borderBottom: '1px solid var(--color-border, #e5e7eb)', paddingBottom: 8 }}>
                <div>
                  <p className="strong" style={{ margin: 0 }}>{event.event}</p>
                  <p className="muted small" style={{ margin: 0 }}>{event.message}</p>
                  <p className="muted small" style={{ margin: 0 }}>
                    {formatDateTime(event.at)} · by {event.by}
                  </p>
                </div>
                <Badge tone={VISIBILITY_TONES[event.visibility] ?? 'neutral'}>{event.visibility}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Notes */}
      <div className="grid grid--2">
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-bold text-slate-900">Internal notes</h3>
            <Badge tone="neutral">staff only</Badge>
          </div>
          <ul className="stack stack--sm mt-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {application.internalNotes.map((note) => (
              <li key={note.id}>
                <p style={{ margin: 0 }}>{note.text}</p>
                <p className="muted small" style={{ margin: 0 }}>{formatDateTime(note.at)} · {note.by}</p>
              </li>
            ))}
            {!application.internalNotes.length ? <p className="text-xs text-slate-400">No internal notes.</p> : null}
          </ul>
          <div className="field mt-3">
            <textarea
              className="field__control"
              rows={2}
              placeholder="Add an internal note…"
              value={noteDrafts.internal}
              onChange={(event) => setNoteDrafts((current) => ({ ...current, internal: event.target.value }))}
            />
            <div className="mt-2">
              <Button size="sm" variant="subtle" loading={savingAction} onClick={() => addNote('internal')}>Add internal note</Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-bold text-slate-900">Customer notes</h3>
            <Badge tone="info">visible to customer</Badge>
          </div>
          <ul className="stack stack--sm mt-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {application.customerNotes.map((note) => (
              <li key={note.id}>
                <p style={{ margin: 0 }}>{note.text}</p>
                <p className="muted small" style={{ margin: 0 }}>{formatDateTime(note.at)} · {note.by}</p>
              </li>
            ))}
            {!application.customerNotes.length ? <p className="text-xs text-slate-400">No customer notes.</p> : null}
          </ul>
          <div className="field mt-3">
            <textarea
              className="field__control"
              rows={2}
              placeholder="Add a note visible to the customer / B2B partner…"
              value={noteDrafts.customer}
              onChange={(event) => setNoteDrafts((current) => ({ ...current, customer: event.target.value }))}
            />
            <div className="mt-2">
              <Button size="sm" variant="subtle" loading={savingAction} onClick={() => addNote('customer')}>Add customer note</Button>
            </div>
          </div>
        </div>
      </div>

      <ApplicationMessages application={application} onChanged={changed} />

      <StatusChangeDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        application={application}
        statusOptions={statusConfigs}
        onSaved={() => changed('Status updated.')}
      />

      {isVisa ? (
        <PassportManageDialog
          open={passportDialogOpen}
          onClose={() => setPassportDialogOpen(false)}
          application={application}
          visaType={visaType}
          staff={staff}
          onSaved={() => changed('Passport updated.')}
        />
      ) : null}

    </div>
  )
}
