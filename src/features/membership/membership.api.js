import { apiClient, withMock } from '../../services/apiClient'
import { b2cApi } from '../b2c/b2c.api'

/**
 * Membership module (B2C only). Plans are the product the admin creates; a
 * membership is one purchase by one B2C customer with a snapshot of the plan
 * at purchase time, so later plan edits never change old memberships.
 */

const DAY_MS = 86_400_000

export const MEMBERSHIP_STATUSES = ['pending', 'active', 'expired', 'cancelled']
export const PAYMENT_METHODS = ['bkash', 'nagad', 'bank', 'cash', 'online']
export const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded']
export const DURATION_UNITS = ['day', 'month', 'year']

const clone = (value) => JSON.parse(JSON.stringify(value))
const nextId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`

export function calcEndDate(start, { durationValue, durationUnit }) {
  const end = new Date(start)
  if (durationUnit === 'day') end.setDate(end.getDate() + Number(durationValue))
  if (durationUnit === 'month') end.setMonth(end.getMonth() + Number(durationValue))
  if (durationUnit === 'year') end.setFullYear(end.getFullYear() + Number(durationValue))
  end.setHours(23, 59, 59, 999)
  return end.toISOString()
}

function daysLeft(membership, now = new Date()) {
  return Math.ceil((new Date(membership.endDate).getTime() - now.getTime()) / DAY_MS)
}

// A membership stops giving benefits the moment endDate passes — the status
// label is normalised on read (the nightly job in the backend does the same).
function effectiveStatus(membership, now = new Date()) {
  if (membership.status === 'active' && new Date(membership.endDate) < now) return 'expired'
  return membership.status
}

const withEffectiveStatus = (membership, now = new Date()) => ({
  ...membership,
  status: effectiveStatus(membership, now),
  daysLeft: daysLeft(membership, now),
})

/* ── Seed data ───────────────────────────────────────────── */

const DEMO_PLANS = [
  { id: 'mp_1', name: 'Starter', durationValue: 15, durationUnit: 'day', price: 500, tourDiscountPercent: 5, visaDiscountPercent: 5, maxDiscountAmount: null, description: 'Short-trip cover for one holiday.', features: ['5% off tour packages', '5% off visa processing', 'Email support'], isActive: true, sortOrder: 1 },
  { id: 'mp_2', name: 'Basic', durationValue: 30, durationUnit: 'day', price: 900, tourDiscountPercent: 5, visaDiscountPercent: 5, maxDiscountAmount: null, description: 'One month of member pricing.', features: ['5% off tour packages', '5% off visa processing', 'Priority document pickup'], isActive: true, sortOrder: 2 },
  { id: 'mp_3', name: 'Silver', durationValue: 6, durationUnit: 'month', price: 2500, tourDiscountPercent: 10, visaDiscountPercent: 10, maxDiscountAmount: 1500, description: 'Half a year of discounts with a per-booking cap.', features: ['10% off tour packages', '10% off visa processing', 'Free pickup service', 'Email + phone support'], isActive: true, sortOrder: 3 },
  { id: 'mp_4', name: 'Gold', durationValue: 1, durationUnit: 'year', price: 4500, tourDiscountPercent: 10, visaDiscountPercent: 10, maxDiscountAmount: 3000, description: 'Best value — a full year of member pricing.', features: ['10% off tour packages', '10% off visa processing', 'Free pickup & delivery', 'Dedicated support line'], isActive: true, sortOrder: 4 },
]

const DEMO_MEMBERSHIPS = [
  {
    id: 'mem_1', customerId: 'cus_401', customerName: 'Emma Wilson', customerEmail: 'emma@example.com', customerPhone: '+44 20 7946 0958',
    planId: 'mp_3', planSnapshot: { name: 'Silver', durationValue: 6, durationUnit: 'month', price: 2500, tourDiscountPercent: 10, visaDiscountPercent: 10, maxDiscountAmount: 1500 },
    startDate: '2026-08-10', endDate: '2027-02-10', status: 'active',
    payment: { method: 'bkash', amount: 2500, trxId: 'BKX88231A', status: 'paid', paidAt: '2026-08-10' },
    source: 'admin', createdAt: '2026-08-10',
  },
  {
    id: 'mem_2', customerId: 'cus_402', customerName: 'Ravi Patel', customerEmail: 'ravi@example.com', customerPhone: '+91 98200 12345',
    planId: 'mp_2', planSnapshot: { name: 'Basic', durationValue: 30, durationUnit: 'day', price: 900, tourDiscountPercent: 5, visaDiscountPercent: 5, maxDiscountAmount: null },
    startDate: '2026-09-10', endDate: '2026-10-10', status: 'active',
    payment: { method: 'nagad', amount: 900, trxId: 'NG447120C', status: 'paid', paidAt: '2026-09-10' },
    source: 'admin', createdAt: '2026-09-10',
  },
  {
    id: 'mem_3', customerId: 'cus_403', customerName: 'Chloé Dubois', customerEmail: 'chloe@example.com', customerPhone: '+33 1 44 55 66 77',
    planId: 'mp_1', planSnapshot: { name: 'Starter', durationValue: 15, durationUnit: 'day', price: 500, tourDiscountPercent: 5, visaDiscountPercent: 5, maxDiscountAmount: null },
    startDate: '2026-10-01', endDate: '2026-10-16', status: 'active',
    payment: { method: 'online', amount: 500, trxId: 'ONL99120F', status: 'paid', paidAt: '2026-10-01' },
    source: 'admin', createdAt: '2026-10-01',
  },
  {
    id: 'mem_4', customerId: 'cus_401', customerName: 'Emma Wilson', customerEmail: 'emma@example.com', customerPhone: '+44 20 7946 0958',
    planId: 'mp_4', planSnapshot: { name: 'Gold', durationValue: 1, durationUnit: 'year', price: 4500, tourDiscountPercent: 10, visaDiscountPercent: 10, maxDiscountAmount: 3000 },
    startDate: '2025-10-01', endDate: '2026-10-02', status: 'active',
    payment: { method: 'bank', amount: 4500, trxId: 'BNK77002D', status: 'paid', paidAt: '2025-10-01' },
    source: 'admin', createdAt: '2025-10-01',
  },
  {
    id: 'mem_5', customerId: 'cus_402', customerName: 'Ravi Patel', customerEmail: 'ravi@example.com', customerPhone: '+91 98200 12345',
    planId: 'mp_3', planSnapshot: { name: 'Silver', durationValue: 6, durationUnit: 'month', price: 2500, tourDiscountPercent: 10, visaDiscountPercent: 10, maxDiscountAmount: 1500 },
    startDate: '2026-03-01', endDate: '2026-09-01', status: 'cancelled', cancelledAt: '2026-07-15', cancelReason: 'Customer relocated — refunded the unused months.',
    payment: { method: 'bank', amount: 2500, trxId: 'BNK70112E', status: 'refunded', paidAt: '2026-03-01' },
    source: 'admin', createdAt: '2026-03-01',
  },
  {
    id: 'mem_6', customerId: 'cus_403', customerName: 'Chloé Dubois', customerEmail: 'chloe@example.com', customerPhone: '+33 1 44 55 66 77',
    planId: 'mp_2', planSnapshot: { name: 'Basic', durationValue: 30, durationUnit: 'day', price: 900, tourDiscountPercent: 5, visaDiscountPercent: 5, maxDiscountAmount: null },
    startDate: '2026-10-05', endDate: '2026-11-04', status: 'pending',
    payment: { method: 'bkash', amount: 900, trxId: '', status: 'unpaid', paidAt: null },
    source: 'admin', createdAt: '2026-10-05',
  },
  {
    id: 'mem_7', customerId: 'cus_404', customerName: 'Omar Hassan', customerEmail: 'omar@example.com', customerPhone: '+971 50 123 4567',
    planId: 'mp_2', planSnapshot: { name: 'Basic', durationValue: 30, durationUnit: 'day', price: 900, tourDiscountPercent: 5, visaDiscountPercent: 5, maxDiscountAmount: null },
    startDate: '2026-10-03', endDate: '2026-11-02', status: 'active',
    payment: { method: 'cash', amount: 900, trxId: 'CASH-0103', status: 'paid', paidAt: '2026-10-03' },
    source: 'admin', createdAt: '2026-10-03',
  },
]

/* ── Mutable stores (persist for the session, reset on reload) ── */

let plansStore = DEMO_PLANS.map((plan) => ({ ...plan, features: [...plan.features] }))
let membershipsStore = DEMO_MEMBERSHIPS.map((membership) => ({
  ...membership,
  planSnapshot: { ...membership.planSnapshot },
  payment: { ...membership.payment },
}))

/* ── API ─────────────────────────────────────────────────── */

export const membershipApi = {
  /* ── Plans ── */
  listPlans: (params = {}) =>
    withMock(
      () => {
        let items = [...plansStore].sort((a, b) => a.sortOrder - b.sortOrder)
        if (params.search) {
          const query = String(params.search).toLowerCase()
          items = items.filter((plan) => plan.name.toLowerCase().includes(query))
        }
        return { items: clone(items), total: items.length }
      },
      () => apiClient.get('/membership-plans', { params }),
    ),
  savePlan: (payload) =>
    withMock(
      () => {
        if (payload.id) {
          plansStore = plansStore.map((plan) => (plan.id === payload.id ? { ...plan, ...payload } : plan))
          return clone(plansStore.find((plan) => plan.id === payload.id))
        }
        const record = {
          id: nextId('mp'),
          isActive: true,
          maxDiscountAmount: null,
          sortOrder: plansStore.length + 1,
          ...payload,
        }
        plansStore = [...plansStore, record]
        return clone(record)
      },
      () => (payload.id ? apiClient.put(`/membership-plans/${payload.id}`, payload) : apiClient.post('/membership-plans', payload)),
    ),
  togglePlan: (id) =>
    withMock(
      () => {
        plansStore = plansStore.map((plan) => (plan.id === id ? { ...plan, isActive: !plan.isActive } : plan))
        return clone(plansStore.find((plan) => plan.id === id))
      },
      () => apiClient.patch(`/membership-plans/${id}/toggle`),
    ),
  deletePlan: (id) =>
    withMock(
      () => {
        plansStore = plansStore.filter((plan) => plan.id !== id)
        return { success: true, id }
      },
      () => apiClient.delete(`/membership-plans/${id}`),
    ),

  /* ── Memberships ── */
  listMemberships: (params = {}) =>
    withMock(
      () => {
        const now = new Date()
        let items = membershipsStore.map((membership) => withEffectiveStatus(membership, now))
        if (params.status) items = items.filter((membership) => membership.status === params.status)
        if (params.planId) items = items.filter((membership) => membership.planId === params.planId)
        if (params.expiringIn) {
          items = items.filter(
            (membership) => membership.status === 'active' && membership.daysLeft >= 0 && membership.daysLeft <= Number(params.expiringIn),
          )
        }
        if (params.search) {
          const query = String(params.search).toLowerCase()
          items = items.filter((membership) =>
            `${membership.customerName} ${membership.customerPhone} ${membership.customerEmail}`.toLowerCase().includes(query),
          )
        }
        items.sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
        return { items: clone(items), total: items.length }
      },
      () => apiClient.get('/memberships', { params }),
    ),
  /**
   * Admin assigns a membership to a B2C customer. Mirrors the backend service:
   * looks up the customer, requires B2C, plan must be active, one active
   * membership per customer.
   */
  createMembership: async (payload) => {
    const customer = await b2cApi.get(payload.customerId)
    return withMock(
      () => {
        if (!customer?.id) throw new Error('Customer not found')
        if (customer.accountType && customer.accountType !== 'b2c') throw new Error('Membership is only for B2C customers')

        const plan = plansStore.find((item) => item.id === payload.planId)
        if (!plan || !plan.isActive) throw new Error('Plan not available')

        const now = new Date()
        const hasActive = membershipsStore.some(
          (membership) => membership.customerId === customer.id && effectiveStatus(membership, now) === 'active',
        )
        if (hasActive) throw new Error('Customer already has an active membership — cancel or wait for expiry first.')

        const start = payload.startDate ? new Date(payload.startDate) : now
        const record = {
          id: nextId('mem'),
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          planId: plan.id,
          planSnapshot: {
            name: plan.name,
            durationValue: plan.durationValue,
            durationUnit: plan.durationUnit,
            price: plan.price,
            tourDiscountPercent: plan.tourDiscountPercent,
            visaDiscountPercent: plan.visaDiscountPercent,
            maxDiscountAmount: plan.maxDiscountAmount,
          },
          startDate: start.toISOString().slice(0, 10),
          endDate: calcEndDate(start, plan),
          status: 'active',
          payment: {
            method: payload.paymentMethod,
            amount: plan.price,
            trxId: payload.trxId ?? '',
            status: 'paid',
            paidAt: start.toISOString().slice(0, 10),
          },
          source: 'admin',
          createdAt: now.toISOString().slice(0, 10),
        }
        membershipsStore = [record, ...membershipsStore]
        return clone(withEffectiveStatus(record, now))
      },
      () => apiClient.post('/memberships', payload),
    )
  },
  cancelMembership: (id, reason) =>
    withMock(
      () => {
        membershipsStore = membershipsStore.map((membership) =>
          membership.id === id
            ? { ...membership, status: 'cancelled', cancelledAt: new Date().toISOString().slice(0, 10), cancelReason: reason ?? '' }
            : membership,
        )
        return clone(membershipsStore.find((membership) => membership.id === id))
      },
      () => apiClient.patch(`/memberships/${id}/cancel`, { reason }),
    ),
  extendMembership: (id, extraDays) =>
    withMock(
      () => {
        membershipsStore = membershipsStore.map((membership) => {
          if (membership.id !== id) return membership
          const end = new Date(membership.endDate)
          end.setDate(end.getDate() + Number(extraDays))
          return { ...membership, endDate: end.toISOString() }
        })
        return clone(withEffectiveStatus(membershipsStore.find((membership) => membership.id === id)))
      },
      () => apiClient.patch(`/memberships/${id}/extend`, { days: extraDays }),
    ),
  deleteMembership: (id) =>
    withMock(
      () => {
        membershipsStore = membershipsStore.filter((membership) => membership.id !== id)
        return { success: true, id }
      },
      () => apiClient.delete(`/memberships/${id}`),
    ),
  listCustomerMemberships: (customerId) =>
    withMock(
      () => {
        const now = new Date()
        const items = membershipsStore
          .filter((membership) => membership.customerId === customerId)
          .map((membership) => withEffectiveStatus(membership, now))
          .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
        return { items: clone(items) }
      },
      () => apiClient.get(`/customers/${customerId}/memberships`),
    ),

  /* ── Stats (dashboard cards + reports) ── */
  getStats: () =>
    withMock(
      () => {
        const now = new Date()
        const items = membershipsStore.map((membership) => withEffectiveStatus(membership, now))
        const active = items.filter((membership) => membership.status === 'active')
        const expiringIn7 = active.filter((membership) => membership.daysLeft >= 0 && membership.daysLeft <= 7)
        const month = now.toISOString().slice(0, 7)
        const expiredThisMonth = items.filter((membership) => membership.status === 'expired' && membership.endDate.slice(0, 7) === month)
        const paid = items.filter((membership) => membership.payment.status === 'paid' && (membership.payment.paidAt ?? '').slice(0, 7) === month)
        const revenueThisMonth = paid.reduce((sum, membership) => sum + (membership.payment.amount ?? 0), 0)

        const revenueByMonth = []
        for (let offset = 5; offset >= 0; offset -= 1) {
          const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          const label = date.toLocaleDateString(undefined, { month: 'short' })
          const value = membershipsStore
            .filter((membership) => membership.payment.status === 'paid' && (membership.payment.paidAt ?? '').slice(0, 7) === key)
            .reduce((sum, membership) => sum + (membership.payment.amount ?? 0), 0)
          revenueByMonth.push({ label, value })
        }

        const planDistribution = plansStore.map((plan) => ({
          label: plan.name,
          value: membershipsStore.filter((membership) => membership.planId === plan.id).length,
        }))

        return clone({
          total: items.length,
          active: active.length,
          expiringIn7: expiringIn7.length,
          expiredThisMonth: expiredThisMonth.length,
          revenueThisMonth,
          revenueByMonth,
          planDistribution,
        })
      },
      () => apiClient.get('/membership-stats'),
    ),
}

// Convenience for other features (customer page badge): map of customerId → active membership.
export const activeMembershipMap = async () => {
  const result = await membershipApi.listMemberships({ status: 'active' })
  return new Map((result.items ?? []).map((membership) => [membership.customerId, membership]))
}
