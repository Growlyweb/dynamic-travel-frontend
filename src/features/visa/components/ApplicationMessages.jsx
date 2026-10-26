import { useCallback, useEffect, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { visaApi } from '../visa.api'
import { usePermission } from '../../../hooks/usePermission'
import { PERMISSIONS } from '../../../utils/permissions'
import { errorMessage } from '../../../utils/errors'
import { formatDateTime } from '../../../utils/formatters'

export const MESSAGE_TONES = { pending: 'warning', sent: 'success', failed: 'danger' }

// What goes to the applicant. An email is sent by the server. An SMS is prepared here and sent by hand (there is no SMS
// provider yet), then marked as sent so the log is true.
export default function ApplicationMessages({ application, onChanged }) {
  const { can } = usePermission()
  const canSend = can(PERMISSIONS.VISA_EDIT)
  const [messages, setMessages] = useState([])
  const [templates, setTemplates] = useState([])
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const [log, templateResult] = await Promise.all([visaApi.listMessages({ applicationId: application.id, pageSize: 50 }), visaApi.listTemplates({ active: 'true' })])
      setMessages(log.items)
      setTemplates(templateResult.items)
    } catch (failure) {
      setError(errorMessage(failure))
    }
  }, [application.id])

  useEffect(() => {
    load()
  }, [load])

  async function act(action, done) {
    setBusy(true)
    setError(null)
    try {
      await action()
      await load()
      await onChanged?.(done)
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <div className="row between row--wrap">
        <p className="card__title" style={{ marginBottom: 0 }}>Messages</p>
        {canSend ? (
          <div className="row" style={{ gap: 8 }}>
            <Button size="sm" variant="subtle" onClick={() => setDialog('email')} disabled={!application.applicant.email}>Send email</Button>
            <Button size="sm" variant="subtle" onClick={() => setDialog('sms')}>Prepare SMS</Button>
          </div>
        ) : null}
      </div>
      {!application.applicant.email ? <p className="muted small mt-2">There is no email on this application, so no email can be sent.</p> : null}
      {error ? <div className="alert alert--danger mt-2">{error}</div> : null}

      <ul className="stack stack--sm mt-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {messages.map((message) => (
          <li key={message.id} style={{ borderBottom: '1px solid var(--color-border, #e5e7eb)', paddingBottom: 8 }}>
            <div className="row between row--wrap" style={{ gap: 8 }}>
              <span className="strong">
                {message.channel === 'email' ? 'Email' : 'SMS'} · {message.templateName}
                {message.source === 'auto' ? <span className="muted small"> (automatic)</span> : null}
              </span>
              <Badge tone={MESSAGE_TONES[message.status] ?? 'neutral'}>{message.status}</Badge>
            </div>
            {message.subject ? <p className="small" style={{ margin: 0 }}><strong>{message.subject}</strong></p> : null}
            <p className="muted small" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.body}</p>
            <p className="muted small" style={{ margin: 0 }}>
              To {message.to || '—'} · {formatDateTime(message.sentAt ?? message.createdAt)}
              {message.error ? ` · ${message.error}` : ''}
            </p>
            {canSend && message.channel === 'sms' && message.status === 'pending' ? (
              <div className="row" style={{ gap: 6, marginTop: 4 }}>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => visaApi.markMessage(message.id, { status: 'sent' }), 'Marked as sent.')}>Mark as sent</Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => visaApi.markMessage(message.id, { status: 'failed', error: 'Not delivered' }), 'Marked as failed.')}>Mark as failed</Button>
              </div>
            ) : null}
            {canSend && message.channel === 'email' && message.status === 'failed' ? (
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => visaApi.resendMessage(message.id), 'Email sent again.')}>Send again</Button>
            ) : null}
          </li>
        ))}
        {!messages.length ? <p className="muted small">No messages yet.</p> : null}
      </ul>

      <ComposeDialog
        channel={dialog}
        application={application}
        templates={templates.filter((template) => template.channel === dialog)}
        onClose={() => setDialog(null)}
        onSend={(body) => act(() => visaApi.sendMessage(application.id, body), dialog === 'email' ? 'Email sent.' : 'SMS prepared.').then(() => setDialog(null))}
        busy={busy}
      />
    </div>
  )
}

function ComposeDialog({ channel, application, templates, onClose, onSend, busy }) {
  const [templateId, setTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [markSent, setMarkSent] = useState(false)

  useEffect(() => {
    if (!channel) return
    const first = templates[0]
    setTemplateId(first?.id ?? '')
    setSubject(first?.subject ?? '')
    setMessage(first?.message ?? '')
    setMarkSent(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel])

  const preview = (text) =>
    String(text || '')
      .replaceAll('{{applicantName}}', application.applicant.fullName)
      .replaceAll('{{applicationNumber}}', application.number)
      .replaceAll('{{country}}', application.country)
      .replaceAll('{{visaType}}', application.visaType)
      .replaceAll('{{status}}', application.status.replace(/_/g, ' '))

  return (
    <Modal
      open={Boolean(channel)}
      onClose={busy ? undefined : onClose}
      title={channel === 'email' ? 'Send email' : 'Prepare SMS'}
      description={`To ${application.applicant.fullName} · ${channel === 'email' ? application.applicant.email : application.applicant.mobile}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            loading={busy}
            disabled={!message.trim() || (channel === 'email' && !subject.trim())}
            onClick={() => onSend({ channel, subject: channel === 'email' ? subject.trim() : undefined, message: message.trim(), ...(channel === 'sms' && markSent ? { markSent: true } : {}) })}
          >
            {channel === 'email' ? 'Send email' : 'Save SMS'}
          </Button>
        </>
      }
    >
      <div className="stack">
        <Select
          label="Template"
          placeholder="Write my own"
          value={templateId}
          onChange={(event) => {
            setTemplateId(event.target.value)
            const template = templates.find((item) => item.id === event.target.value)
            setSubject(template?.subject ?? '')
            setMessage(template?.message ?? '')
          }}
          options={templates.map((template) => ({ value: template.id, label: template.name }))}
        />
        {channel === 'email' ? <Input label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} /> : null}
        <div className="field">
          <label className="field__label" htmlFor="compose-message">Message</label>
          <textarea id="compose-message" className="field__control" rows={5} value={message} onChange={(event) => setMessage(event.target.value)} />
          <p className="field__hint">Words you can use: {'{{applicantName}} {{applicationNumber}} {{country}} {{visaType}} {{status}} {{trackingUrl}}'}</p>
        </div>
        {channel === 'sms' ? (
          <label className="checkbox">
            <input type="checkbox" checked={markSent} onChange={(event) => setMarkSent(event.target.checked)} />
            I already sent this from my own phone: log it as sent
          </label>
        ) : null}
        <div className="alert alert--info">
          <p className="small" style={{ margin: 0 }}>
            <strong>Preview:</strong> {channel === 'email' ? `${preview(subject)} · ` : ''}{preview(message)}
          </p>
        </div>
      </div>
    </Modal>
  )
}
