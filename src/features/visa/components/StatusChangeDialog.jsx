import { useEffect, useMemo, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Select from '../../../components/common/Select'
import { visaApi } from '../visa.api'
import { nextStatuses, requiredText } from '../statusRules'
import { usePermission } from '../../../hooks/usePermission'
import { errorMessage, fieldErrors } from '../../../utils/errors'

const FIELD = {
  customerMessage: { label: 'What the applicant must do (they will read this)', placeholder: 'Please send your updated 6-month bank statement.' },
  customerReason: { label: 'Reason for the applicant (they will read this)', placeholder: 'The application was refused because of insufficient funds.' },
  internalReason: { label: 'Internal reason (staff only)', placeholder: 'Why this is being done.' },
}

/**
 * Moves an application to another status. Only the moves the server accepts are offered. A move to a status that needs
 * words (action required, rejected, cancelled, reopening) asks for them. Every change is written to the timeline.
 */
export default function StatusChangeDialog({ open, onClose, application, statusOptions, initialStatus, onSaved }) {
  const { isAdmin } = usePermission()
  const [status, setStatus] = useState('')
  const [texts, setTexts] = useState({ customerMessage: '', customerReason: '', internalReason: '' })
  const [internalReason, setInternalReason] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    if (open) {
      setStatus(initialStatus ?? '')
      setTexts({ customerMessage: '', customerReason: '', internalReason: '' })
      setInternalReason('')
      setNote('')
      setErrors({})
      setFormError(null)
    }
  }, [open, initialStatus])

  const from = statusOptions.find((option) => option.key === application?.status)
  const to = statusOptions.find((option) => option.key === status)
  const options = useMemo(() => (application ? nextStatuses(application.status, statusOptions, { isAdmin }) : []), [application, statusOptions, isAdmin])
  const needed = to ? requiredText(from, to) : null
  // Rejecting also takes an internal reason, which is optional.
  const extraInternal = to?.key === 'rejected' && needed !== 'internalReason'

  async function handleSubmit(event) {
    event.preventDefault()
    if (!status) {
      setErrors({ status: 'Choose the new status.' })
      return
    }
    if (needed && !texts[needed].trim()) {
      setErrors({ [needed]: 'This is required.' })
      return
    }
    setSaving(true)
    setErrors({})
    setFormError(null)
    try {
      await visaApi.changeStatus(application.id, {
        status,
        customerMessage: texts.customerMessage.trim() || undefined,
        customerReason: texts.customerReason.trim() || undefined,
        internalReason: (needed === 'internalReason' ? texts.internalReason : internalReason).trim() || undefined,
        note: note.trim() || undefined,
      })
      onSaved?.()
      onClose()
    } catch (error) {
      setErrors(fieldErrors(error))
      setFormError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const text = (key) => (
    <div className="field" key={key}>
      <label className="field__label" htmlFor={`status-${key}`}>{FIELD[key].label} *</label>
      <textarea
        id={`status-${key}`}
        className="field__control"
        rows={3}
        value={texts[key]}
        onChange={(event) => setTexts((current) => ({ ...current, [key]: event.target.value }))}
        placeholder={FIELD[key].placeholder}
      />
      {errors[key] ? <p className="field__error">{errors[key]}</p> : null}
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="Change status"
      description={application ? `${application.number} · now “${from?.displayName ?? application.status.replace(/_/g, ' ')}”` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving} disabled={options.length === 0}>Update status</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="stack" noValidate>
        {formError ? <div className="alert alert--danger">{formError}</div> : null}
        {options.length === 0 ? <p className="muted">This application is finished. Only an admin can reopen it.</p> : null}
        <Select
          label="New status"
          placeholder="Select status"
          value={status}
          error={errors.status}
          disabled={options.length === 0}
          onChange={(event) => {
            setStatus(event.target.value)
            setErrors({})
          }}
          options={options.map((option) => ({ value: option.key, label: option.displayName }))}
        />

        {needed ? text(needed) : null}

        {extraInternal ? (
          <div className="field">
            <label className="field__label" htmlFor="status-internal">{FIELD.internalReason.label}</label>
            <textarea id="status-internal" className="field__control" rows={2} value={internalReason} onChange={(event) => setInternalReason(event.target.value)} placeholder={FIELD.internalReason.placeholder} />
          </div>
        ) : null}

        {status && !needed ? (
          <div className="field">
            <label className="field__label" htmlFor="status-note">Note for the timeline (optional)</label>
            <textarea id="status-note" className="field__control" rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="The applicant can read this." />
          </div>
        ) : null}
      </form>
    </Modal>
  )
}
