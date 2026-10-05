import { useCallback, useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Banknote, Clock3, UserX } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Modal from '../../../components/common/Modal'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import StatCard from '../../../components/charts/StatCard'
import { membershipApi, MEMBERSHIP_STATUSES, PAYMENT_METHODS } from '../membership.api'
import { b2cApi } from '../../b2c/b2c.api'
import { formatDate, formatCurrency, formatNumber } from '../../../utils/formatters'

const STATUS_TONES = { active: 'success', pending: 'warning', expired: 'neutral', cancelled: 'danger' }
const PAYMENT_TONES = { paid: 'success', unpaid: 'warning', refunded: 'info' }

const PAYMENT_METHOD_LABELS = { bkash: 'bKash', nagad: 'Nagad', bank: 'Bank', cash: 'Cash', online: 'Online' }

export default function MembershipMembers() {
  const [rows, setRows] = useState([])
  const [plans, setPlans] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [planId, setPlanId] = useState('')
  const [expiringOnly, setExpiringOnly] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [extending, setExtending] = useState(null)
  const [extendDays, setExtendDays] = useState('7')
  const [actionSaving, setActionSaving] = useState(false)
  const [actionError, setActionError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [membershipResult, planResult, statResult] = await Promise.all([
        membershipApi.listMemberships(),
        membershipApi.listPlans(),
        membershipApi.getStats(),
      ])
      setRows(membershipResult.items ?? [])
      setPlans(planResult.items ?? [])
      setStats(statResult)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (status && row.status !== status) return false
      if (planId && row.planId !== planId) return false
      if (expiringOnly && !(row.status === 'active' && row.daysLeft >= 0 && row.daysLeft <= 7)) return false
      if (query && !`${row.customerName} ${row.customerPhone} ${row.customerEmail}`.toLowerCase().includes(query)) return false
      return true
    })
  }, [rows, search, status, planId, expiringOnly])

  async function handleCancel() {
    if (!cancelling) return
    setActionSaving(true)
    setActionError(null)
    try {
      await membershipApi.cancelMembership(cancelling.id, cancelReason.trim())
      setCancelling(null)
      setCancelReason('')
      await load()
    } catch (cancelError) {
      setActionError(cancelError?.message ?? 'Could not cancel the membership.')
    } finally {
      setActionSaving(false)
    }
  }

  async function handleExtend() {
    if (!extending || !Number(extendDays)) return
    setActionSaving(true)
    setActionError(null)
    try {
      await membershipApi.extendMembership(extending.id, Number(extendDays))
      setExtending(null)
      await load()
    } catch (extendError) {
      setActionError(extendError?.message ?? 'Could not extend the membership.')
    } finally {
      setActionSaving(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Members"
        description="B2C membership subscriptions. Discounts are applied server-side at booking — this is where you assign, track and manage them."
        breadcrumbs={[{ label: 'Membership' }, { label: 'Members' }]}
        actions={<Button onClick={() => setAddOpen(true)}>+ Add membership</Button>}
      />

      {stats ? (
        <div className="grid grid--4">
          <StatCard label="Active members" value={formatNumber(stats.active)} hint={`${formatNumber(stats.total)} all-time`} icon={<BadgeCheck size={20} aria-hidden />} />
          <StatCard label="Expiring in 7 days" value={formatNumber(stats.expiringIn7)} hint="call for renewal" icon={<Clock3 size={20} aria-hidden />} />
          <StatCard label="Expired this month" value={formatNumber(stats.expiredThisMonth)} icon={<UserX size={20} aria-hidden />} />
          <StatCard label="Revenue this month" value={formatCurrency(stats.revenueThisMonth, 'BDT')} icon={<Banknote size={20} aria-hidden />} />
        </div>
      ) : null}

      <div className="card stack">
        <div className="filters" style={{ alignItems: 'flex-end' }}>
          <Input
            label="Search"
            type="search"
            placeholder="Name, phone or email…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            label="Status"
            placeholder="All statuses"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={MEMBERSHIP_STATUSES.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))}
          />
          <Select
            label="Plan"
            placeholder="All plans"
            value={planId}
            onChange={(event) => setPlanId(event.target.value)}
            options={plans.map((plan) => ({ value: plan.id, label: plan.name }))}
          />
          <label className="checkbox" style={{ marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={expiringOnly}
              onChange={(event) => setExpiringOnly(event.target.checked)}
            />
            Expiring in 7 days
          </label>
        </div>

        <DataTable
          loading={loading}
          data={filteredRows}
          emptyTitle="No memberships match your filters"
          columns={[
            {
              key: 'customerName',
              header: 'Customer',
              render: (row) => (
                <span>
                  <span className="strong">{row.customerName}</span>
                  <br />
                  <span className="muted small">{row.customerPhone}</span>
                </span>
              ),
            },
            {
              key: 'plan',
              header: 'Plan',
              render: (row) => (
                <span>
                  <span className="strong">{row.planSnapshot.name}</span>
                  <br />
                  <span className="muted small">
                    {row.planSnapshot.tourDiscountPercent}% tour · {row.planSnapshot.visaDiscountPercent}% visa
                  </span>
                </span>
              ),
            },
            { key: 'startDate', header: 'Start', render: (row) => formatDate(row.startDate) },
            {
              key: 'endDate',
              header: 'Expiry',
              render: (row) => (
                <span>
                  {formatDate(row.endDate)}
                  <br />
                  <span className="muted small">
                    {row.status === 'active' ? (row.daysLeft >= 0 ? `${row.daysLeft} days left` : 'lapsed') : '—'}
                  </span>
                </span>
              ),
            },
            {
              key: 'payment',
              header: 'Payment',
              render: (row) => (
                <span>
                  <Badge tone={PAYMENT_TONES[row.payment.status] ?? 'neutral'}>{row.payment.status}</Badge>
                  <br />
                  <span className="muted small">
                    {PAYMENT_METHOD_LABELS[row.payment.method] ?? row.payment.method} · {formatCurrency(row.payment.amount, 'BDT')}
                    {row.payment.trxId ? ` · ${row.payment.trxId}` : ''}
                  </span>
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge tone={STATUS_TONES[row.status] ?? 'neutral'}>{row.status}</Badge>,
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <span className="table-actions">
                  <Button size="sm" variant="ghost" onClick={() => setViewing(row)}>View</Button>
                  {row.status === 'active' ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => { setExtending(row); setExtendDays('7') }}>Extend</Button>
                      <Button size="sm" variant="danger" onClick={() => { setCancelling(row); setCancelReason('') }}>Cancel</Button>
                    </>
                  ) : null}
                </span>
              ),
            },
          ]}
        />
      </div>

      <AddMembershipDialog open={addOpen} onClose={() => setAddOpen(false)} plans={plans} onSaved={load} />

      {/* View membership */}
      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? `Membership — ${viewing.customerName}` : ''}
        description={viewing ? `${viewing.planSnapshot.name} plan · ${viewing.status}` : undefined}
        footer={<Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>}
      >
        {viewing ? (
          <dl className="detail-list">
            <div><dt>Plan (snapshot at purchase)</dt><dd>{viewing.planSnapshot.name} — {viewing.planSnapshot.durationValue} {viewing.planSnapshot.durationUnit}(s), {formatCurrency(viewing.planSnapshot.price, 'BDT')}</dd></div>
            <div><dt>Discounts</dt><dd>{viewing.planSnapshot.tourDiscountPercent}% tours · {viewing.planSnapshot.visaDiscountPercent}% visa{viewing.planSnapshot.maxDiscountAmount ? ` · cap ${formatCurrency(viewing.planSnapshot.maxDiscountAmount, 'BDT')}` : ''}</dd></div>
            <div><dt>Start / expiry</dt><dd>{formatDate(viewing.startDate)} → {formatDate(viewing.endDate)}</dd></div>
            <div><dt>Days left</dt><dd>{viewing.status === 'active' ? viewing.daysLeft : '—'}</dd></div>
            <div><dt>Payment</dt><dd>{PAYMENT_METHOD_LABELS[viewing.payment.method] ?? viewing.payment.method} · {formatCurrency(viewing.payment.amount, 'BDT')} · {viewing.payment.status}{viewing.payment.trxId ? ` · ${viewing.payment.trxId}` : ''}</dd></div>
            <div><dt>Source</dt><dd>{viewing.source}</dd></div>
            {viewing.cancelReason ? <div><dt>Cancel reason</dt><dd>{viewing.cancelReason}</dd></div> : null}
          </dl>
        ) : null}
      </Modal>

      {/* Cancel with reason */}
      <Modal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        title="Cancel membership"
        description={cancelling ? `${cancelling.customerName}'s ${cancelling.planSnapshot.name} membership stops giving discounts immediately.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelling(null)}>Keep membership</Button>
            <Button variant="danger" onClick={handleCancel} loading={actionSaving}>Cancel membership</Button>
          </>
        }
      >
        <div className="field">
          <label className="field__label" htmlFor="cancel-reason">Reason</label>
          <textarea
            id="cancel-reason"
            className="field__control"
            rows={3}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="e.g. Customer request, refund issued."
          />
        </div>
        {actionError ? <p className="alert alert--danger" role="alert">{actionError}</p> : null}
      </Modal>

      {/* Extend */}
      <Modal
        open={Boolean(extending)}
        onClose={() => setExtending(null)}
        title="Extend membership"
        description={extending ? `Current expiry: ${formatDate(extending.endDate)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setExtending(null)}>Cancel</Button>
            <Button onClick={handleExtend} loading={actionSaving}>Extend</Button>
          </>
        }
      >
        <Input
          label="Extra days"
          type="number"
          min="1"
          value={extendDays}
          onChange={(event) => setExtendDays(event.target.value)}
          hint="Added to the current expiry date."
        />
        {actionError ? <p className="alert alert--danger" role="alert">{actionError}</p> : null}
      </Modal>
    </div>
  )
}

/** Assign a plan to a B2C customer with offline payment info (admin-only phase). */
function AddMembershipDialog({ open, onClose, plans, onSaved }) {
  const [customers, setCustomers] = useState([])
  const [values, setValues] = useState({ customerId: '', planId: '', paymentMethod: 'bkash', trxId: '', startDate: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setValues({ customerId: '', planId: '', paymentMethod: 'bkash', trxId: '', startDate: '' })
      setErrors({})
      setError(null)
      b2cApi.list().then((result) => setCustomers(result.items ?? []))
    }
  }, [open])

  function setValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const next = {}
    if (!values.customerId) next.customerId = 'Pick a B2C customer.'
    if (!values.planId) next.planId = 'Pick a plan.'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    setError(null)
    try {
      await membershipApi.createMembership({
        customerId: values.customerId,
        planId: values.planId,
        paymentMethod: values.paymentMethod,
        trxId: values.trxId.trim(),
        startDate: values.startDate || undefined,
      })
      onSaved?.()
      onClose()
    } catch (createError) {
      setError(createError?.message ?? 'Could not create the membership.')
    } finally {
      setSaving(false)
    }
  }

  const selectedPlan = plans.find((plan) => plan.id === values.planId)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add membership"
      description="B2C only — the customer paid offline (bKash, bank, cash); you record the payment here."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving}>Save membership</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="stack">
        <Select
          label="B2C customer"
          value={values.customerId}
          error={errors.customerId}
          onChange={(event) => setValue('customerId', event.target.value)}
          placeholder="Select customer"
          options={customers.map((customer) => ({ value: customer.id, label: `${customer.name} · ${customer.phone}` }))}
        />
        <Select
          label="Plan"
          value={values.planId}
          error={errors.planId}
          onChange={(event) => setValue('planId', event.target.value)}
          placeholder="Select plan"
          options={plans.filter((plan) => plan.isActive).map((plan) => ({
            value: plan.id,
            label: `${plan.name} — ${plan.durationValue} ${plan.durationUnit}(s) · ${formatCurrency(plan.price, 'BDT')}`,
          }))}
        />
        <div className="grid grid--3">
          <Select
            label="Payment method"
            value={values.paymentMethod}
            onChange={(event) => setValue('paymentMethod', event.target.value)}
            options={PAYMENT_METHODS.map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] ?? method }))}
          />
          <Input
            label="Transaction ID"
            value={values.trxId}
            onChange={(event) => setValue('trxId', event.target.value)}
            placeholder="BKX88231A"
          />
          <Input
            label="Start date"
            type="date"
            value={values.startDate}
            onChange={(event) => setValue('startDate', event.target.value)}
            hint="Defaults to today."
          />
        </div>
        {selectedPlan ? (
          <div className="alert alert--info">
            <p className="small" style={{ margin: 0 }}>
              Expiry is calculated from the plan: <strong>{selectedPlan.tourDiscountPercent}% tours · {selectedPlan.visaDiscountPercent}% visa</strong> for{' '}
              {selectedPlan.durationValue} {selectedPlan.durationUnit}(s). One active membership per customer.
            </p>
          </div>
        ) : null}
        {error ? <p className="alert alert--danger" role="alert">{error}</p> : null}
      </form>
    </Modal>
  )
}
