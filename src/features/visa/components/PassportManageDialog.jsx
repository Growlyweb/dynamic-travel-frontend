import { useEffect, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { visaApi, PASSPORT_STATUS_LABELS, PASSPORT_METHOD_LABELS, PICKUP_LOCATION_TYPES } from '../visa.api'

const TRACKING_STATUSES = Object.entries(PASSPORT_STATUS_LABELS)
  .filter(([key]) => key !== 'not_required')
  .map(([value, label]) => ({ value, label }))

const EMPTY_PICKUP = {
  locationType: 'Home',
  contactName: '',
  phone: '',
  address: '',
  district: '',
  area: '',
  landmark: '',
  preferredDate: '',
  preferredTime: '',
}

/**
 * Passport operations dialog (spec #4–#6, #16–#19): choose the submission
 * method, create a pickup request with an address snapshot, assign pickup
 * staff, advance the passport tracking workflow, and print a submission
 * receipt. Every change is written to the application timeline.
 */
export default function PassportManageDialog({ open, onClose, application, visaType, staff, onSaved }) {
  const [pickup, setPickup] = useState(EMPTY_PICKUP)
  const [collection, setCollection] = useState({ collectionDate: '', collectionTime: '', collectorName: '', passportNumber: '', remarks: '' })
  const [officeReceive, setOfficeReceive] = useState({ receivedDate: '', receivedBy: '', passportNumber: '', remarks: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setPickup({ ...EMPTY_PICKUP, contactName: application?.applicant?.fullName ?? '', phone: application?.applicant?.mobile ?? '' })
      setCollection({ collectionDate: '', collectionTime: '', collectorName: '', passportNumber: application?.passport?.number ?? '', remarks: '' })
      setOfficeReceive({ receivedDate: '', receivedBy: '', passportNumber: application?.passport?.number ?? '', remarks: '' })
      setError(null)
    }
  }, [open, application])

  if (!application) return null

  const method = application.passportSubmissionMethod ?? 'online'
  const status = application.passportStatus ?? 'not_required'
  const requirement = visaType?.passportRequirement ?? 'online_processing'
  const physicalRequired = requirement === 'physical_required' || requirement === 'physical_optional' || requirement === 'country_specific'
  const pickupRequest = application.pickupRequest

  async function run(update) {
    setSaving(true)
    setError(null)
    try {
      const updated = await visaApi.updatePassport(application.id, update)
      onSaved?.(updated ?? undefined)
    } catch (updateError) {
      setError(updateError?.message ?? 'Could not update the passport record.')
    } finally {
      setSaving(false)
    }
  }

  function selectMethod(next) {
    if (next === 'pickup') {
      run({ passportSubmissionMethod: 'pickup', pickupRequest: { ...pickup, status: 'requested' } })
    } else if (next === 'office') {
      run({ passportSubmissionMethod: 'office' })
    } else {
      run({ passportSubmissionMethod: 'online' })
    }
  }

  /** Printable passport submission receipt (spec #19). */
  function printReceipt() {
    const printWindow = window.open('', '_blank', 'width=720,height=840')
    if (!printWindow) return
    const received = application.passportReceived
    printWindow.document.write(`<!doctype html><html><head><title>Passport Receipt — ${application.number}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:40px}
      .brand{font-size:20px;font-weight:700;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;margin-top:12px}td{padding:8px 10px;border-bottom:1px solid #ddd;font-size:14px}
      td:first-child{font-weight:600;width:38%}
      .note{margin-top:24px;font-size:12px;color:#555}</style></head><body>
      <div class="brand">Passport Submission Receipt — Dynamic Travel</div>
      <table>
        <tr><td>Application No</td><td>${application.number}</td></tr>
        <tr><td>Applicant</td><td>${application.applicant.fullName}</td></tr>
        <tr><td>Passport No</td><td>${application.passportReceived?.passportNumber || application.passport.number}</td></tr>
        <tr><td>Country / Visa Type</td><td>${application.country} — ${application.visaType}</td></tr>
        <tr><td>Received</td><td>${received?.receivedDate ?? application.passportCollection?.collectedAt ?? '—'}</td></tr>
        <tr><td>Received By</td><td>${received?.receivedBy ?? application.passportCollection?.collectorName ?? 'Visa Processing Staff'}</td></tr>
        <tr><td>Status</td><td>${PASSPORT_STATUS_LABELS[application.passportStatus] ?? application.passportStatus}</td></tr>
      </table>
      <p class="note">Please keep this receipt and present it when collecting your passport. Original passports are stored securely in our office.</p>
      <script>window.onload = function () { window.print(); }</script>
      </body></html>`)
    printWindow.document.close()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Passport operations"
      description={`${application.number} · ${application.applicant.fullName} · ${application.country} — ${application.visaType}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {application.passportStatus && application.passportStatus !== 'not_received' && application.passportStatus !== 'not_required' ? (
            <Button variant="subtle" onClick={printReceipt}>Print receipt</Button>
          ) : null}
        </>
      }
    >
      <div className="stack">
        {/* Current state */}
        <div className="row between row--wrap" style={{ gap: 8 }}>
          <div className="row" style={{ gap: 8 }}>
            <Badge tone="info">{PASSPORT_METHOD_LABELS[method] ?? method}</Badge>
            <Badge tone={status === 'not_received' ? 'danger' : 'primary'}>{PASSPORT_STATUS_LABELS[status] ?? status}</Badge>
          </div>
          <span className="muted small">Requirement: {requirement === 'physical_required' ? 'Physical Passport Required' : requirement === 'online_processing' ? 'Online Processing' : requirement === 'physical_optional' ? 'Physical Submission Optional' : 'Country Specific'}</span>
        </div>

        {!physicalRequired ? (
          <div className="alert alert--info">
            This visa type is configured for <strong>online processing</strong> — no physical passport submission is needed.
            Change it in Visa types → Edit → Passport processing if that is wrong.
          </div>
        ) : method === 'unset' || method === 'online' ? (
          <>
            <p className="muted small" style={{ margin: 0 }}>Physical passport is required. Enter the pickup details, or choose office visit:</p>
            <div className="grid grid--2">
              <Select
                label="Pickup location type"
                value={pickup.locationType}
                onChange={(event) => setPickup((current) => ({ ...current, locationType: event.target.value }))}
                options={PICKUP_LOCATION_TYPES.map((type) => ({ value: type, label: type }))}
              />
              <Input label="Contact person" value={pickup.contactName} onChange={(event) => setPickup((current) => ({ ...current, contactName: event.target.value }))} />
              <Input label="Mobile number" value={pickup.phone} onChange={(event) => setPickup((current) => ({ ...current, phone: event.target.value }))} />
              <Input label="District" value={pickup.district} onChange={(event) => setPickup((current) => ({ ...current, district: event.target.value }))} />
              <Input label="Area" value={pickup.area} onChange={(event) => setPickup((current) => ({ ...current, area: event.target.value }))} />
              <Input label="Landmark" value={pickup.landmark} onChange={(event) => setPickup((current) => ({ ...current, landmark: event.target.value }))} />
            </div>
            <Input label="Full address" value={pickup.address} onChange={(event) => setPickup((current) => ({ ...current, address: event.target.value }))} />
            <div className="grid grid--2">
              <Input label="Preferred pickup date" type="date" value={pickup.preferredDate} onChange={(event) => setPickup((current) => ({ ...current, preferredDate: event.target.value }))} />
              <Input label="Preferred pickup time" value={pickup.preferredTime} placeholder="11:00–13:00" onChange={(event) => setPickup((current) => ({ ...current, preferredTime: event.target.value }))} />
            </div>
            <div className="grid grid--2">
              <Button onClick={() => selectMethod('pickup')} loading={saving}>Create pickup request</Button>
              <Button variant="ghost" onClick={() => selectMethod('office')} loading={saving}>Applicant will visit office</Button>
            </div>
          </>
        ) : (
          <>
            {/* Pickup request snapshot */}
            {method === 'pickup' && pickupRequest ? (
              <div className="card">
                <div className="row between">
                  <p className="card__title" style={{ marginBottom: 0 }}>Pickup request</p>
                  <Badge tone={pickupRequest.status === 'picked_up' ? 'success' : 'info'}>{pickupRequest.status}</Badge>
                </div>
                <dl className="detail-list mt-2">
                  <div><dt>Location</dt><dd>{pickupRequest.locationType} — {pickupRequest.address}{pickupRequest.landmark ? ` (${pickupRequest.landmark})` : ''}</dd></div>
                  <div><dt>Contact</dt><dd>{pickupRequest.contactName} · {pickupRequest.phone}</dd></div>
                  <div><dt>District / area</dt><dd>{pickupRequest.district} · {pickupRequest.area}</dd></div>
                  <div><dt>Preferred</dt><dd>{pickupRequest.preferredDate || '—'} {pickupRequest.preferredTime ?? ''}</dd></div>
                  <div>
                    <dt>Assigned staff</dt>
                    <dd>
                      <Select
                        value={pickupRequest.assignedStaff ?? ''}
                        aria-label="Pickup staff"
                        onChange={(event) => run({ assignedStaff: event.target.value || null })}
                        options={[{ value: '', label: 'Unassigned' }, ...(staff ?? []).map((name) => ({ value: name, label: name }))]}
                      />
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {/* Office submission info */}
            {method === 'office' && application.passportReceived ? (
              <div className="alert alert--success">
                Passport received at office on {application.passportReceived.receivedDate} by {application.passportReceived.receivedBy}.
              </div>
            ) : null}
            {method === 'office' && !application.passportReceived ? (
              <div className="alert alert--info">
                Applicant will visit the office with the original passport. Confirm below once it is received.
              </div>
            ) : null}

            {/* Tracking workflow */}
            {status !== 'delivered' ? (
              <>
                <p className="card__title" style={{ marginBottom: 0 }}>Tracking</p>
                {(method === 'office' && status === 'not_received') ||
                (method === 'pickup' && ['pickup_requested', 'confirmed', 'assigned', 'pickup_in_progress'].includes(status)) ? (
                  <div className="stack stack--sm">
                    <p className="muted small" style={{ margin: 0 }}>Confirm the physical passport was received:</p>
                    <div className="grid grid--2">
                      <Input label={method === 'pickup' ? 'Collection date' : 'Received date'} type="date" value={method === 'pickup' ? collection.collectionDate : officeReceive.receivedDate} onChange={(event) => (method === 'pickup' ? setCollection((c) => ({ ...c, collectionDate: event.target.value })) : setOfficeReceive((c) => ({ ...c, receivedDate: event.target.value })))} />
                      {method === 'pickup' ? (
                        <Input label="Collection time" value={collection.collectionTime} placeholder="11:30" onChange={(event) => setCollection((c) => ({ ...c, collectionTime: event.target.value }))} />
                      ) : (
                        <Input label="Received by" value={officeReceive.receivedBy} placeholder="Staff name" onChange={(event) => setOfficeReceive((c) => ({ ...c, receivedBy: event.target.value }))} />
                      )}
                      {method === 'pickup' ? (
                        <Input label="Collector name" value={collection.collectorName} placeholder="Pickup staff" onChange={(event) => setCollection((c) => ({ ...c, collectorName: event.target.value }))} />
                      ) : null}
                      <Input label="Passport number" value={method === 'pickup' ? collection.passportNumber : officeReceive.passportNumber} onChange={(event) => (method === 'pickup' ? setCollection((c) => ({ ...c, passportNumber: event.target.value })) : setOfficeReceive((c) => ({ ...c, passportNumber: event.target.value })))} />
                      <Input label="Remarks" value={method === 'pickup' ? collection.remarks : officeReceive.remarks} onChange={(event) => (method === 'pickup' ? setCollection((c) => ({ ...c, remarks: event.target.value })) : setOfficeReceive((c) => ({ ...c, remarks: event.target.value })))} />
                    </div>
                    <Button
                      loading={saving}
                      onClick={() =>
                        method === 'pickup'
                          ? run({ passportStatus: 'picked_up', details: { ...collection, collectorName: collection.collectorName || pickupRequest?.assignedStaff || 'Pickup staff' } })
                          : run({ passportStatus: 'received_at_office', details: { ...officeReceive, receivedBy: officeReceive.receivedBy || 'Office staff' } })
                      }
                    >
                      {method === 'pickup' ? 'Confirm passport collected' : 'Confirm passport received'}
                    </Button>
                  </div>
                ) : null}

                <Select
                  label="Move passport status to"
                  value=""
                  placeholder="Select next status"
                  onChange={(event) => {
                    if (event.target.value) run({ passportStatus: event.target.value })
                  }}
                  options={TRACKING_STATUSES.filter((option) => option.value !== 'not_received')}
                />
              </>
            ) : (
              <div className="alert alert--success">Passport delivered to the applicant. This file is complete.</div>
            )}
          </>
        )}

        {error ? <p className="alert alert--danger" role="alert">{error}</p> : null}
      </div>
    </Modal>
  )
}
