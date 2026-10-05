import { useEffect, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Select from '../../../components/common/Select'
import { visaApi } from '../visa.api'

/**
 * Status change dialog (spec #15/#16). Requesting documents (ACTION_REQUIRED)
 * captures the customer-facing message; rejection captures separated
 * internal/customer reasons. Every change is written to the timeline.
 */
export default function StatusChangeDialog({ open, onClose, application, statusOptions, initialStatus, onSaved }) {
  const [status, setStatus] = useState('')
  const [customerMessage, setCustomerMessage] = useState('')
  const [internalReason, setInternalReason] = useState('')
  const [customerReason, setCustomerReason] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setStatus(initialStatus ?? '')
      setCustomerMessage('')
      setInternalReason('')
      setCustomerReason('')
      setNote('')
      setErrors({})
    }
  }, [open, initialStatus])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!status) {
      setErrors({ status: 'Choose the new status.' })
      return
    }
    if (status === 'action_required' && !customerMessage.trim()) {
      setErrors({ customerMessage: 'Tell the applicant what is required.' })
      return
    }
    if (status === 'rejected' && !customerReason.trim()) {
      setErrors({ customerReason: 'A customer-facing reason is required.' })
      return
    }
    setSaving(true)
    try {
      await visaApi.changeStatus(application.id, {
        status,
        customerMessage: customerMessage.trim() || undefined,
        internalReason: internalReason.trim() || undefined,
        customerReason: customerReason.trim() || undefined,
        note: note.trim() || undefined,
      })
      onSaved?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change status"
      description={application ? `${application.number} · currently “${application.status.replace(/_/g, ' ')}”` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving}>Update status</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="stack">
        <Select
          label="New status"
          placeholder="Select status"
          value={status}
          error={errors.status}
          onChange={(event) => {
            setStatus(event.target.value)
            setErrors({})
          }}
          options={statusOptions.map((option) => ({ value: option.key, label: option.displayName }))}
        />

        {status === 'action_required' ? (
          <div className="field">
            <label className="field__label" htmlFor="action-required-message">Required action (seen by the applicant) *</label>
            <textarea
              id="action-required-message"
              className="field__control"
              rows={3}
              value={customerMessage}
              onChange={(event) => setCustomerMessage(event.target.value)}
              placeholder="Please upload your updated 6-month bank statement."
            />
            {errors.customerMessage ? <p className="field__error">{errors.customerMessage}</p> : null}
          </div>
        ) : null}

        {status === 'rejected' ? (
          <>
            <div className="field">
              <label className="field__label" htmlFor="rejection-internal">Internal reason (staff only)</label>
              <textarea
                id="rejection-internal"
                className="field__control"
                rows={2}
                value={internalReason}
                onChange={(event) => setInternalReason(event.target.value)}
                placeholder="Insufficient financial documentation."
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="rejection-customer">Customer-facing reason *</label>
              <textarea
                id="rejection-customer"
                className="field__control"
                rows={2}
                value={customerReason}
                onChange={(event) => setCustomerReason(event.target.value)}
                placeholder="The application was rejected due to insufficient financial documentation."
              />
              {errors.customerReason ? <p className="field__error">{errors.customerReason}</p> : null}
            </div>
          </>
        ) : null}

        {status && status !== 'action_required' && status !== 'rejected' ? (
          <div className="field">
            <label className="field__label" htmlFor="status-note">Note for the timeline (optional)</label>
            <textarea
              id="status-note"
              className="field__control"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Visible to the applicant."
            />
          </div>
        ) : null}
      </form>
    </Modal>
  )
}
