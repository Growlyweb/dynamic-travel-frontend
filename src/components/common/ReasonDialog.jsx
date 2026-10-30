import { useEffect, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'
import { errorMessage } from '../../utils/errors'

// Asks for the reason before something that changes the books is undone (void a bill, void a payment).
export default function ReasonDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setReason('')
      setError(null)
    }
  }, [open])

  async function submit(event) {
    event.preventDefault()
    if (!reason.trim()) return setError('Write the reason.')
    setSaving(true)
    try {
      await onConfirm(reason.trim())
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={saving}>Back</Button>
          <Button variant="danger" onClick={submit} loading={saving}>{confirmLabel}</Button>
        </>
      }
    >
      <form className="stack" onSubmit={submit} noValidate>
        {message ? <p className="confirm-dialog__message">{message}</p> : null}
        {error ? <div className="alert alert--danger">{error}</div> : null}
        <Input label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} autoFocus />
      </form>
    </Modal>
  )
}
