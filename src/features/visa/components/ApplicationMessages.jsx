import { useCallback, useEffect, useState } from 'react'
import { Check, Mail, MessageSquare, RotateCcw, Send, Smartphone } from 'lucide-react'
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
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <MessageSquare className="size-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Applicant Messages</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {messages.length}
          </span>
        </div>
        {canSend ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setDialog('email')}
              disabled={!application.applicant.email}
              className="h-8 gap-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs text-xs"
            >
              <Mail className="size-3.5" />
              Send email
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDialog('sms')}
              className="h-8 gap-1.5 px-3 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium"
            >
              <Smartphone className="size-3.5" />
              Prepare SMS
            </Button>
          </div>
        ) : null}
      </div>

      {!application.applicant.email ? (
        <p className="text-xs text-slate-400">There is no email on this application, so emails cannot be dispatched.</p>
      ) : null}
      {error ? <div className="alert alert--danger">{error}</div> : null}

      {messages.length > 0 ? (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-slate-50/30 overflow-hidden">
          {messages.map((message) => (
            <div key={message.id} className="p-3.5 space-y-2 transition-colors hover:bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold uppercase text-slate-700">
                    {message.channel === 'email' ? 'Email' : 'SMS'}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {message.templateName}
                  </span>
                  {message.source === 'auto' ? (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      automatic
                    </span>
                  ) : null}
                </div>
                <Badge tone={MESSAGE_TONES[message.status] ?? 'neutral'}>{message.status}</Badge>
              </div>

              {message.subject ? (
                <p className="text-xs font-bold text-slate-800">{message.subject}</p>
              ) : null}
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-white/70 rounded-lg p-2.5 border border-slate-200/60">
                {message.body}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-400">
                <p>
                  To <span className="font-medium text-slate-600">{message.to || '—'}</span> · {formatDateTime(message.sentAt ?? message.createdAt)}
                  {message.error ? <span className="text-rose-600 font-medium"> · Error: {message.error}</span> : null}
                </p>

                <div className="flex items-center gap-1.5">
                  {canSend && message.channel === 'sms' && message.status === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => act(() => visaApi.markMessage(message.id, { status: 'sent' }), 'Marked as sent.')}
                        className="h-7 px-2.5 text-xs text-emerald-700 hover:bg-emerald-50 border border-emerald-200 gap-1"
                      >
                        <Check className="size-3.5" />
                        Mark as sent
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => act(() => visaApi.markMessage(message.id, { status: 'failed', error: 'Not delivered' }), 'Marked as failed.')}
                        className="h-7 px-2.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 gap-1"
                      >
                        Mark as failed
                      </Button>
                    </>
                  ) : null}
                  {canSend && message.channel === 'email' && message.status === 'failed' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => act(() => visaApi.resendMessage(message.id), 'Email sent again.')}
                      className="h-7 px-2.5 text-xs text-blue-600 hover:bg-blue-50 border border-blue-200 gap-1"
                    >
                      <RotateCcw className="size-3.5" />
                      Send again
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
          No communication messages recorded yet.
        </div>
      )}

      <ComposeDialog
        channel={dialog}
        application={application}
        templates={templates.filter((template) => template.channel === dialog && [application.serviceType, 'all'].includes(template.serviceType ?? 'visa'))}
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
      .replaceAll('{{visaType}}', application.visaType || application.serviceLabel)
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
