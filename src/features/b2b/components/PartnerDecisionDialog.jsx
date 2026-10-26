import { useEffect, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { errorMessage } from '../../../utils/errors'

const COPY = {
  APPROVED: { title: 'Approve partner', message: 'The partner can sign in and work with the business account.', confirm: 'Approve', tone: 'primary' },
  REJECTED: { title: 'Reject application', message: 'The partner will not be able to use the business account.', confirm: 'Reject', tone: 'danger' },
  UNDER_REVIEW: { title: 'Put under review', message: 'Shows the partner that the documents are being checked.', confirm: 'Put under review', tone: 'primary' },
  SUSPENDED: { title: 'Suspend partner', message: 'The partner is signed out and cannot use the account until it is approved again.', confirm: 'Suspend', tone: 'danger' },
}

// A decision on a partner, with an optional note the partner can read.
export default function PartnerDecisionDialog({ decision, partner, onClose, onDecide }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const copy = COPY[decision]

  useEffect(() => {
    if (decision) {
      setNote('')
      setError(null)
    }
  }, [decision])

  async function submit() {
    setSaving(true)
    try {
      await onDecide(decision, note.trim())
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={Boolean(decision)}
      onClose={saving ? undefined : onClose}
      title={copy ? `${copy.title}: ${partner?.company ?? ''}` : ''}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Back</Button>
          <Button variant={copy?.tone === 'danger' ? 'danger' : 'primary'} onClick={submit} loading={saving}>{copy?.confirm}</Button>
        </>
      }
    >
      <div className="stack">
        {error ? <div className="alert alert--danger">{error}</div> : null}
        <p className="confirm-dialog__message">{copy?.message}</p>
        <Input label="Note for the partner (optional)" value={note} onChange={(event) => setNote(event.target.value)} />
      </div>
    </Modal>
  )
}
