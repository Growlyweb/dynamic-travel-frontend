import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  Check,
  Eye,
  Mail,
  MessageSquare,
  Search,
  Send,
  Settings2,
  Users,
  X,
} from 'lucide-react'

import PageHeader from '@/components/layout/PageHeader'
import { Table, TableBadge, TablePagination } from '@/components/re-table'
import { formatMoney } from '@/features/reports/reports.api'
import { marketingApi } from '../marketing.api'
import ManageTemplatesModal from '../components/ManageTemplatesModal'
import CampaignDetailsModal from '../components/CampaignDetailsModal'

const PAGE_SIZE = 8
const SMS_RATE = 0.35
const SERVICES = ['Visa', 'Tour Package', 'Air Ticket', 'Hotel']

const plain = (value) => String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

const personalize = (text, customer) =>
  String(text || '')
    .replaceAll('{customer_name}', customer?.name || 'Customer')
    .replaceAll('{CustomerName}', customer?.name || 'Customer')
    .replaceAll('{service_name}', customer?.service || 'travel service')
    .replaceAll('{ServiceName}', customer?.service || 'travel service')

const canReceive = (customer, channel) => {
  if (!customer || customer.optedOut) return false
  if (channel === 'sms') return Boolean(customer.phone) && customer.consent?.sms !== false
  return Boolean(customer.email) && customer.consent?.email !== false
}

export default function ReportMarketing() {
  const composerRef = useRef(null)
  const [metrics, setMetrics] = useState({ totalCustomers: 0, smsSentMonth: 0, emailsSentMonth: 0 })
  const [campaigns, setCampaigns] = useState([])
  const [templates, setTemplates] = useState([])
  const [customers, setCustomers] = useState([])
  const [allCustomers, setAllCustomers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState({})
  const [channel, setChannel] = useState('sms')
  const [recipientMode, setRecipientMode] = useState('selected')
  const [templateId, setTemplateId] = useState('')
  const [smsText, setSmsText] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [sending, setSending] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [viewCampaign, setViewCampaign] = useState(null)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState('')

  const loadOverview = useCallback(async () => {
    const result = await marketingApi.getOverview()
    if (result.success) {
      setMetrics(result.data.metrics)
      setCampaigns(result.data.recentCampaigns)
      setTemplates(result.data.templates)
    }
  }, [])

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await marketingApi.getCustomers({
        page,
        pageSize: PAGE_SIZE,
        search,
        type: typeFilter,
        service: serviceFilter,
      })
      if (result.success) {
        setCustomers(result.data.customers)
        setTotalCount(result.data.totalCount)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, typeFilter, serviceFilter])

  const loadAllCustomers = useCallback(async () => {
    const result = await marketingApi.getAllCustomers({ type: typeFilter, service: serviceFilter })
    if (result.success) setAllCustomers(result.data)
  }, [typeFilter, serviceFilter])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    loadAllCustomers()
  }, [loadAllCustomers])

  useEffect(() => {
    setPage(1)
  }, [search, typeFilter, serviceFilter])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  const selectedList = useMemo(() => Object.values(selected), [selected])
  const selectedIds = useMemo(() => new Set(Object.keys(selected)), [selected])

  const filteredTemplates = useMemo(
    () =>
      templates.filter((template) => {
        const type = String(template.type || 'both').toLowerCase()
        if (type === 'both') return true
        return channel === 'sms' ? type === 'sms' : type === 'email'
      }),
    [templates, channel]
  )

  const audience = recipientMode === 'selected' ? selectedList : allCustomers
  const eligibleAudience = useMemo(
    () => audience.filter((customer) => canReceive(customer, channel)),
    [audience, channel]
  )
  const excluded = Math.max(0, audience.length - eligibleAudience.length)
  const sample = eligibleAudience[0] || audience[0] || { name: 'Customer', service: 'Visa' }
  const previewSms = personalize(smsText || 'Your promotional message will appear here.', sample)
  const previewSubject = personalize(emailSubject || 'Your subject line', sample)
  const previewEmail = personalize(emailBody || 'Your email message will appear here.', sample)
  const smsSegments = Math.max(1, Math.ceil(previewSms.length / 160))
  const smsCost = smsSegments * SMS_RATE * eligibleAudience.length
  const pageAllSelected = customers.length > 0 && customers.every((customer) => selectedIds.has(String(customer.id)))

  const toggleCustomer = (customer) => {
    setSelected((current) => {
      const key = String(customer.id)
      const next = { ...current }
      if (next[key]) delete next[key]
      else next[key] = customer
      return next
    })
  }

  const togglePage = () => {
    setSelected((current) => {
      const next = { ...current }
      if (pageAllSelected) {
        for (const customer of customers) delete next[String(customer.id)]
      } else {
        for (const customer of customers) next[String(customer.id)] = customer
      }
      return next
    })
  }

  const chooseCustomer = (customer, nextChannel) => {
    setSelected({ [String(customer.id)]: customer })
    setRecipientMode('selected')
    setChannel(nextChannel)
    setTemplateId('')
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const applyTemplate = (id) => {
    setTemplateId(id)
    const template = templates.find((item) => item.id === id)
    if (!template) return
    if (channel === 'sms') setSmsText(template.smsBody || '')
    else {
      setEmailSubject(template.emailSubject || template.subject || '')
      setEmailBody(plain(template.emailBodyHtml || template.emailBody || ''))
    }
  }

  const switchChannel = (next) => {
    setChannel(next)
    setTemplateId('')
    setConfirm(null)
  }

  const requestSend = () => {
    setError('')
    if (!eligibleAudience.length) {
      setError(`No eligible recipients. ${excluded ? `${excluded} customer(s) have no consent or contact information.` : 'Select at least one customer.'}`)
      return
    }
    if (channel === 'sms' && !smsText.trim()) {
      setError('Write an SMS message first.')
      return
    }
    if (channel === 'email' && (!emailSubject.trim() || !emailBody.trim())) {
      setError('Add an email subject and message first.')
      return
    }
    setConfirm({
      count: eligibleAudience.length,
      excluded,
      channel,
      cost: smsCost,
      scheduledAt,
    })
  }

  const sendCampaign = async () => {
    if (!confirm) return
    setSending(true)
    setError('')
    try {
      await marketingApi.sendBulkCampaign({
        type: confirm.channel === 'sms' ? 'SMS' : 'Email',
        recipients: eligibleAudience,
        subject: personalize(emailSubject, sample),
        message: confirm.channel === 'sms' ? smsText : emailBody,
        campaignName: confirm.channel === 'sms' ? 'SMS promotional campaign' : previewSubject,
        scheduledAt: confirm.scheduledAt,
        templateId,
      })
      setConfirm(null)
      setToast({ type: 'success', text: `${confirm.channel === 'sms' ? 'SMS' : 'Email'} campaign ${confirm.scheduledAt ? 'scheduled' : 'sent'} to ${confirm.count} recipients.` })
      await Promise.all([loadOverview(), loadCustomers(), loadAllCustomers()])
      setSelected({})
    } catch (err) {
      setError(err?.message || 'Could not send the campaign.')
      setConfirm(null)
    } finally {
      setSending(false)
    }
  }

  const retryCampaign = async (campaign) => {
    try {
      await marketingApi.retryFailedCampaign(campaign.id)
      await loadOverview()
      setToast({ type: 'success', text: 'Failed messages retried.' })
    } catch (err) {
      setToast({ type: 'error', text: err?.message || 'Could not retry.' })
    }
  }

  const historyColumns = [
    { key: 'date', header: 'Date', render: (row) => <span className="whitespace-nowrap text-slate-600">{row.date}</span> },
    { key: 'campaign', header: 'Campaign', render: (row) => <span className="font-semibold text-slate-800">{row.recipientName || row.subject}</span> },
    { key: 'channel', header: 'Channel', render: (row) => <TableBadge variant={row.type === 'SMS' ? 'info' : 'success'}>{row.type}</TableBadge> },
    { key: 'recipients', header: 'Recipients', align: 'right', render: (row) => Number(row.recipients || 0).toLocaleString() },
    { key: 'sent', header: 'Sent', align: 'right', render: (row) => Number(row.sent || 0).toLocaleString() },
    { key: 'delivered', header: 'Delivered', align: 'right', render: (row) => Number(row.delivered ?? row.sent ?? 0).toLocaleString() },
    { key: 'failed', header: 'Failed', align: 'right', render: (row) => <span className={Number(row.failed || 0) > 0 ? 'font-bold text-rose-600' : 'text-slate-500'}>{Number(row.failed || 0).toLocaleString()}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <TableBadge variant={row.status === 'Completed' ? 'success' : row.status === 'Scheduled' ? 'warning' : 'info'}>
          {row.status}
        </TableBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex items-center gap-2">
          {Number(row.failed || 0) > 0 ? (
            <button type="button" onClick={() => retryCampaign(row)} className="text-xs font-semibold text-[#2F80ED] hover:underline">
              Retry
            </button>
          ) : null}
          <button type="button" onClick={() => setViewCampaign(row)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#2F80ED] hover:underline">
            <Eye className="size-3.5" /> View
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Marketing"
        description="Send SMS, emails and promotional campaigns from one simple page."
        breadcrumbs={[{ label: 'Marketing' }, { label: 'Email & SMS' }]}
        actions={
          <button
            type="button"
            onClick={() => setTemplatesOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Settings2 className="size-4 text-[#2F80ED]" /> Manage templates
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Customers', value: metrics.totalCustomers || allCustomers.length, icon: Users, tone: 'text-[#2F80ED] bg-blue-50' },
          { label: 'SMS Sent This Month', value: metrics.smsSentMonth || 0, icon: MessageSquare, tone: 'text-sky-600 bg-sky-50' },
          { label: 'Emails Sent This Month', value: metrics.emailsSentMonth || 0, icon: Mail, tone: 'text-violet-600 bg-violet-50' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">{item.label}</p>
              <span className={`grid size-10 place-items-center rounded-xl ${item.tone}`}><item.icon className="size-5" /></span>
            </div>
            <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900">{Number(item.value).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,1fr)] lg:items-start">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">Customers</h2>
            <p className="text-sm text-slate-500">Select customers for a campaign. Consent and contact eligibility are checked before sending.</p>
          </div>

          <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, phone or email…"
                className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-[#2F80ED]"
              />
            </div>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#2F80ED]">
              <option value="">All types</option>
              <option value="B2B">B2B Agents</option>
              <option value="B2C">B2C Clients</option>
            </select>
            <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#2F80ED]">
              <option value="">All services</option>
              {SERVICES.map((service) => <option key={service} value={service}>{service}</option>)}
            </select>
          </div>

          <div className="max-h-[560px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[#2F80ED] text-white">
                <tr>
                  <th className="w-10 px-4 py-3 text-left">
                    <input type="checkbox" checked={pageAllSelected} onChange={togglePage} aria-label="Select this page" className="size-4 accent-white" />
                  </th>
                  <th className="px-2 py-3 text-left font-semibold">Customer</th>
                  <th className="px-2 py-3 text-left font-semibold">Type</th>
                  <th className="px-2 py-3 text-left font-semibold">Service</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-14 text-center text-slate-500">Loading customers…</td></tr>
                ) : customers.length ? customers.map((customer) => (
                  <tr key={customer.id} className={selectedIds.has(String(customer.id)) ? 'bg-blue-50/60' : 'bg-white'}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(String(customer.id))} onChange={() => toggleCustomer(customer)} aria-label={`Select ${customer.name}`} className="size-4 accent-[#2F80ED]" />
                    </td>
                    <td className="px-2 py-3">
                      <p className="font-semibold text-slate-900">{customer.name}</p>
                      <p className="text-[11px] text-slate-500">{customer.phone} · {customer.email}</p>
                    </td>
                    <td className="px-2 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{customer.type}</span>
                    </td>
                    <td className="px-2 py-3 text-slate-600">{customer.service}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => chooseCustomer(customer, 'sms')} className="inline-flex items-center gap-1 rounded-md bg-[#2F80ED] px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-[#1d6fd0]"><MessageSquare className="size-3" /> SMS</button>
                        <button type="button" onClick={() => chooseCustomer(customer, 'email')} className="inline-flex items-center gap-1 rounded-md border border-[#2F80ED] bg-white px-2 py-1.5 text-[10px] font-semibold text-[#2F80ED] hover:bg-blue-50"><Mail className="size-3" /> Email</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-14 text-center text-slate-400">No customers match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 p-4">
            <TablePagination
              currentPage={page}
              totalEntries={totalCount}
              pageSize={PAGE_SIZE}
              itemLabel="customers"
              onPageChange={setPage}
            />
          </div>
        </section>

        <aside ref={composerRef} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Compose message</h2>
              <p className="text-sm text-slate-500">{selectedList.length ? `${selectedList.length} selected` : 'Choose a customer or all eligible customers'}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">{eligibleAudience.length} eligible</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => switchChannel('sms')} className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold ${channel === 'sms' ? 'bg-white text-[#2F80ED] shadow-sm' : 'text-slate-500'}`}><MessageSquare className="size-4" /> SMS</button>
            <button type="button" onClick={() => switchChannel('email')} className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold ${channel === 'email' ? 'bg-white text-[#2F80ED] shadow-sm' : 'text-slate-500'}`}><Mail className="size-4" /> Email</button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 p-1">
            <button type="button" onClick={() => setRecipientMode('selected')} className={`rounded-lg py-2 text-xs font-semibold ${recipientMode === 'selected' ? 'bg-[#2F80ED] text-white' : 'text-slate-600'}`}>Selected ({selectedList.length})</button>
            <button type="button" onClick={() => setRecipientMode('all')} className={`rounded-lg py-2 text-xs font-semibold ${recipientMode === 'all' ? 'bg-[#2F80ED] text-white' : 'text-slate-600'}`}>All eligible</button>
          </div>

          <label className="mt-4 block text-sm font-semibold text-slate-700">
            {channel === 'sms' ? 'SMS template (optional)' : 'Email template (optional)'}
            <select value={templateId} onChange={(event) => applyTemplate(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#2F80ED]">
              <option value="">Custom message</option>
              {filteredTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
          </label>

          {channel === 'sms' ? (
            <>
              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Message
                <textarea value={smsText} onChange={(event) => setSmsText(event.target.value)} rows={5} placeholder="Write a short promotional SMS… Use {customer_name} and {service_name}." className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-[#2F80ED]" />
              </label>
              <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                <span>{smsText.length} characters · {smsSegments} segment{smsSegments > 1 ? 's' : ''}</span>
                <span>Est. cost {formatMoney(smsCost)}</span>
              </div>
            </>
          ) : (
            <>
              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Subject
                <input value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} placeholder="Email subject" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
              </label>
              <label className="mt-3 block text-sm font-semibold text-slate-700">
                Email message
                <textarea value={emailBody} onChange={(event) => setEmailBody(event.target.value)} rows={7} placeholder="Write your email message… Use {customer_name} and {service_name}." className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-[#2F80ED]" />
              </label>
            </>
          )}

          <label className="mt-3 block text-sm font-semibold text-slate-700">
            Schedule (optional)
            <div className="relative mt-1.5">
              <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-[#2F80ED]" />
            </div>
          </label>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500"><Eye className="size-3.5" /> Message preview</div>
            {channel === 'sms' ? (
              <div className="mt-2 rounded-xl bg-white p-3 text-sm text-slate-700 shadow-sm">{previewSms}</div>
            ) : (
              <div className="mt-2 rounded-xl bg-white p-3 text-sm text-slate-700 shadow-sm">
                <p className="font-bold text-slate-900">{previewSubject}</p>
                <p className="mt-2 whitespace-pre-line text-slate-600">{previewEmail}</p>
              </div>
            )}
            {excluded > 0 ? <p className="mt-2 text-[11px] text-amber-700">{excluded} recipient(s) excluded due to missing contact or consent.</p> : null}
          </div>

          <button type="button" onClick={requestSend} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2F80ED] text-sm font-bold text-white hover:bg-[#1d6fd0]">
            <Send className="size-4" /> Send {channel === 'sms' ? 'SMS' : 'email'}{scheduledAt ? ' later' : ''}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400">A confirmation with recipient count appears before sending.</p>
        </aside>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Campaign history</h2>
          <p className="text-sm text-slate-500">Sent, delivered, failed and scheduled campaigns.</p>
        </div>
        <Table
          columns={historyColumns}
          data={campaigns}
          dense
          headerClassName="bg-[#2F80ED] text-white"
          emptyText="No campaigns yet"
          emptyDescription="Send your first SMS or email campaign above."
        />
      </section>

      <ManageTemplatesModal
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        templates={templates}
        onSaveTemplate={async (template) => {
          await marketingApi.saveTemplate(template)
          await loadOverview()
        }}
        onDeleteTemplate={async (id) => {
          await marketingApi.deleteTemplate(id)
          await loadOverview()
        }}
      />

      <CampaignDetailsModal
        open={Boolean(viewCampaign)}
        onClose={() => setViewCampaign(null)}
        campaign={viewCampaign}
      />

      {confirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">Confirm {confirm.channel === 'sms' ? 'SMS' : 'email'} campaign</h3>
              <button type="button" onClick={() => setConfirm(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="size-4" /></button>
            </div>
            <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Eligible recipients</span><strong>{confirm.count.toLocaleString()}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Excluded</span><strong>{confirm.excluded.toLocaleString()}</strong></div>
              {confirm.channel === 'sms' ? <div className="flex justify-between"><span className="text-slate-500">Estimated cost</span><strong>{formatMoney(confirm.cost)}</strong></div> : null}
              <div className="flex justify-between"><span className="text-slate-500">Send</span><strong>{confirm.scheduledAt ? `Scheduled · ${new Date(confirm.scheduledAt).toLocaleString()}` : 'Now'}</strong></div>
            </div>
            <div className="mt-4 max-h-32 overflow-auto rounded-xl border border-slate-200 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">{confirm.channel === 'email' ? previewSubject : 'SMS preview'}</p>
              <p className="mt-1 whitespace-pre-line">{confirm.channel === 'sms' ? previewSms : previewEmail}</p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirm(null)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-600">Cancel</button>
              <button type="button" disabled={sending} onClick={sendCampaign} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2F80ED] px-4 text-sm font-bold text-white disabled:opacity-60">
                <Check className="size-4" /> {sending ? 'Sending…' : `Confirm & ${confirm.scheduledAt ? 'schedule' : 'send'}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={`fixed right-4 top-4 z-[60] rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${toast.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {toast.text}
        </div>
      ) : null}
    </div>
  )
}
