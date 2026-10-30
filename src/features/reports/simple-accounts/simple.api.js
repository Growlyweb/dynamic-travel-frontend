/**
 * Plain-language accounts service for the simplified UI.
 * It writes the same double-entry journals as the advanced module, but only
 * exposes selling price, cost price, received, due and profit.
 */

import {
  AP_ACCOUNT,
  AR_ACCOUNT,
  CASH_ACCOUNTS,
  COMPANY,
  PAYMENT_METHODS,
  methodAccount,
} from '../accounting/coa.js'
import {
  MONTHS_SHORT,
  addDays,
  daysBetween,
  daysInMonth,
  monthWindow,
  todayISO,
} from '../accounting/dates.js'
import {
  buildFiles,
  buildIndex,
  buildPayables,
  buildProfitLoss,
  cashPosition,
  fileFinancials,
} from '../accounting/engine.js'
import { nextFileNo, postJournal } from '../accounting/posting.js'
import { loadState, saveState } from '../accounting/storage.js'
import { vendorApi } from '@/features/vendors/vendor.api'
import { apiClient } from '@/services/apiClient'
import { config } from '@/app/config'

export const SIMPLE_CATEGORIES = [
  { label: 'Visa', type: 'Visa', segment: 'visa', revenue: '4010', costAccount: '5010', prefix: 'VF', color: '#0879E8' },
  { label: 'Tour Package', type: 'Tour', segment: 'tour', revenue: '4020', costAccount: '5030', prefix: 'TF', color: '#16A34A' },
  { label: 'Air Ticket', type: 'Air Ticket', segment: 'air', revenue: '4030', costAccount: '5040', prefix: 'AF', color: '#7C3AED' },
  { label: 'Hotel', type: 'Hotel', segment: 'hotel', revenue: '4040', costAccount: '5050', prefix: 'HF', color: '#D97706' },
  { label: 'Transport', type: 'Transport', segment: 'transport', revenue: '4050', costAccount: '5060', prefix: 'XF', color: '#0D9488' },
]

const CUSTOM_CATEGORY = {
  type: 'Other',
  segment: 'other',
  revenue: '4060',
  costAccount: '5090',
  prefix: 'OF',
  color: '#64748B',
}

const PRICE_DEFAULTS = {
  Visa: { b2b: 12000, b2c: 15000, cost: 9000 },
  'Tour Package': { b2b: 52000, b2c: 60000, cost: 45000 },
  'Air Ticket': { b2b: 47000, b2c: 50000, cost: 43000 },
  Hotel: { b2b: 21000, b2c: 25000, cost: 18000 },
  Transport: { b2b: 4000, b2c: 5000, cost: 3000 },
}

export const PAY_METHODS = PAYMENT_METHODS.map((method) => ({
  ...method,
  label:
    method.account === '1020'
      ? 'Bank'
      : method.account === '1030'
        ? 'Bank (BRAC)'
        : method.account === '1040'
          ? 'bKash'
          : 'Cash',
}))

const clone = (value) =>
  typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value))
const round = (value) => Math.round(Number(value) || 0)

const metaFor = (category) =>
  SIMPLE_CATEGORIES.find((item) => item.label === category) || { ...CUSTOM_CATEGORY, label: category }

function ensureParty(state, payload) {
  const type = payload.clientType === 'B2B' ? 'B2B' : 'B2C'
  const name = String((type === 'B2B' ? payload.agencyName : payload.clientName) || payload.clientName || '').trim()
  if (!name) throw new Error('Client name is required.')
  const existing = (state.parties || []).find(
    (party) => party.type === type && party.name.toLowerCase() === name.toLowerCase()
  )
  if (existing) {
    if (payload.phone) existing.phone = payload.phone
    return existing
  }
  const prefix = type === 'B2B' ? 'A' : 'C'
  const maxSequence = (state.parties || [])
    .filter((party) => String(party.code).startsWith(`${prefix}-`))
    .reduce((max, party) => Math.max(max, Number(String(party.code).split('-')[1]) || 0), 0)
  const sequence = maxSequence + 1
  const party = {
    id: `${prefix.toLowerCase()}_${String(sequence).padStart(2, '0')}`,
    code: `${prefix}-${String(sequence).padStart(4, '0')}`,
    type,
    name,
    phone: payload.phone?.trim() || '—',
    email: '',
    address: 'Dhaka, Bangladesh',
    creditLimit: type === 'B2B' ? 100000 : 0,
    active: true,
    since: todayISO(),
  }
  state.parties.push(party)
  return party
}

function ensureCategory(state, label) {
  const clean = String(label || '').trim()
  if (!clean || SIMPLE_CATEGORIES.some((item) => item.label === clean)) return
  state.simpleCategories = state.simpleCategories || []
  if (!state.simpleCategories.some((item) => item.label === clean)) {
    state.simpleCategories.push({ label: clean, color: '#64748B' })
  }
}

function firstVendor(state) {
  return (state.parties || []).find((party) => party.type === 'Vendor') || null
}

function postSale(state, file, party) {
  const meta = metaFor(file.category)
  return postJournal(state, {
    date: file.date,
    type: 'SV',
    narration: `Sale — ${file.fileNo}`,
    segment: meta.segment,
    partyId: party.id,
    fileId: file.id,
    ref: file.fileNo,
    lines: [
      {
        account: AR_ACCOUNT,
        debit: file.sale,
        partyId: party.id,
        dueDate: addDays(file.date, 7),
        memo: `${file.category} — ${party.name}`,
      },
      { account: meta.revenue, credit: file.sale, memo: file.category },
    ],
  })
}

function postCost(state, file) {
  const meta = metaFor(file.category)
  const baseCost = (file.costs || []).reduce((sum, line) => sum + (Number(line.amount) || 0), 0)
  if (baseCost <= 0) return null
  const vendor = firstVendor(state)
  return postJournal(state, {
    date: file.date,
    type: 'JV',
    narration: `Cost price — ${file.fileNo}`,
    segment: meta.segment,
    partyId: file.partyId,
    fileId: file.id,
    ref: file.fileNo,
    lines: [
      { account: meta.costAccount, debit: baseCost, memo: 'Cost price' },
      {
        account: AP_ACCOUNT,
        credit: baseCost,
        partyId: vendor?.id || null,
        dueDate: addDays(file.date, 30),
        memo: 'Supplier cost',
      },
    ],
  })
}

function postReceiptToState(state, { file, amount, method, date, receiptNo, note, discount = 0 }) {
  const partyId = file.partyId
  const lines = []
  if (amount > 0) {
    lines.push({ account: methodAccount(method), debit: amount, memo: 'Money received' })
  }
  if (discount > 0) {
    lines.push({ account: '4090', debit: discount, kind: 'discount', memo: 'Discount allowed' })
  }
  lines.push({ account: AR_ACCOUNT, credit: amount + discount, partyId, memo: file.fileNo })

  const journal = postJournal(state, {
    date,
    type: 'RV',
    narration: note?.trim() || `Money receipt — ${file.fileNo}`,
    segment: metaFor(file.category).segment,
    partyId,
    fileId: file.id,
    ref: file.fileNo,
    lines,
  })

  if (receiptNo?.trim()) {
    const clean = receiptNo.trim()
    if (state.journals.some((row) => row.no === clean && row.id !== journal.id)) {
      throw new Error(`Receipt number ${clean} is already used.`)
    }
    journal.no = clean
  }
  return journal
}

const pad = (value) => String(value).padStart(2, '0')

function receiptFromJournal(state, index, journal) {
  const lines = journal.lines || []
  const cashLine = lines.find((line) => CASH_ACCOUNTS.includes(line.account) && Number(line.debit) > 0)
  const arLine = lines.find((line) => line.account === AR_ACCOUNT && Number(line.credit) > 0)
  const amount = lines
    .filter((line) => CASH_ACCOUNTS.includes(line.account))
    .reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
  const discount = lines
    .filter((line) => line.account === '4090' && line.kind === 'discount')
    .reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
  const file = (state.files || []).find((row) => row.id === journal.fileId)
  const party = (state.parties || []).find((row) => row.id === (journal.partyId || arLine?.partyId))
  const financials = file ? fileFinancials(state, file, index) : null
  const accountCode = cashLine?.account || ''
  const paymentType =
    accountCode === '1010' ? 'Cash' : accountCode === '1040' ? 'bKash' : accountCode ? 'Bank' : '—'

  return {
    id: journal.id,
    no: journal.no,
    date: journal.date,
    createdAt: journal.createdAt || journal.date,
    clientName: party?.name || file?.partyName || 'Client',
    clientPhone: party?.phone || '',
    partyCode: party?.code || '',
    partyType: party?.type || file?.partyType || '',
    invoiceType: file ? 'Invoice' : 'Overall',
    invoiceNo: file?.fileNo || '',
    category: file?.category || file?.type || 'Overall',
    paymentType,
    accountCode,
    accountName: COMPANY.name,
    manualNo: journal.manualNo || '',
    amount,
    discount,
    totalApplied: amount + discount,
    note: journal.narration || '',
    fileId: file?.id || null,
    sale: file?.sale || 0,
    dueNow: financials?.due || 0,
    createdBy: journal.createdBy || 'Admin',
    methodLabel: PAYMENT_METHODS.find((method) => method.account === accountCode)?.label || paymentType,
  }
}

const monthLabel = (year, month) =>
  new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

export const simpleApi = {
  async getCategories() {
    const state = loadState()
    const labels = new Set(SIMPLE_CATEGORIES.map((item) => item.label))
    for (const item of state.simpleCategories || []) labels.add(item.label)
    for (const file of state.files || []) if (file.category) labels.add(file.category)
    return [...labels].map((label) => {
      const meta = metaFor(label)
      const custom = (state.simpleCategories || []).find((item) => item.label === label)
      return { label, color: custom?.color || meta.color, type: meta.type }
    })
  },

  async addCategory(label, color) {
    const state = clone(loadState())
    const clean = String(label || '').trim()
    if (!clean) throw new Error('Category name is required.')
    const existing = await simpleApi.getCategories()
    if (existing.some((item) => item.label.toLowerCase() === clean.toLowerCase())) {
      throw new Error(`Category "${clean}" already exists.`)
    }
    ensureCategory(state, clean)
    const custom = (state.simpleCategories || []).find((item) => item.label === clean)
    if (custom && color) custom.color = color
    saveState(state)
    return { label: clean, color: custom?.color || CUSTOM_CATEGORY.color }
  },

  async deleteCategory(label) {
    const state = clone(loadState())
    const clean = String(label || '').trim()
    if (SIMPLE_CATEGORIES.some((item) => item.label === clean)) {
      throw new Error('Default categories cannot be deleted.')
    }
    if ((state.files || []).some((file) => file.category === clean && !file.isDeleted)) {
      throw new Error('This category is used by sales and cannot be deleted.')
    }
    state.simpleCategories = (state.simpleCategories || []).filter((item) => item.label !== clean)
    saveState(state)
    return { success: true }
  },

  async getCategoryReport(from, to) {
    const state = loadState()
    const { rows } = buildFiles(state, { from, to })
    const labels = new Set(SIMPLE_CATEGORIES.map((item) => item.label))
    for (const item of state.simpleCategories || []) labels.add(item.label)
    for (const row of rows) labels.add(row.category)
    const categories = await simpleApi.getCategories()
    return [...labels].map((label) => {
      const items = rows.filter((row) => row.category === label)
      const sale = items.reduce((sum, row) => sum + row.sale, 0)
      const cost = items.reduce((sum, row) => sum + row.cost, 0)
      return {
        label,
        color: categories.find((item) => item.label === label)?.color || metaFor(label).color,
        sale,
        cost,
        profit: sale - cost,
        count: items.length,
        isUsed: items.length > 0,
        removable: !SIMPLE_CATEGORIES.some((item) => item.label === label) && items.length === 0,
      }
    })
  },

  async getHome({ year, month } = {}) {
    if (!config.enableMocks) {
      try {
        const res = await apiClient.get('/accounts/home', { params: { year, month } })
        if (res?.data) return res.data
        if (res && typeof res === 'object' && res.sale !== undefined) return res
      } catch (err) {
        console.warn('Backend /accounts/home error, falling back to local state:', err)
      }
    }
    try {
      await vendorApi.syncAccounting()
    } catch {
      // Vendor books are optional for the Accounts dashboard.
    }
    const state = loadState()
    const now = new Date()
    const targetYear = year ?? now.getFullYear()
    const targetMonth = month ?? now.getMonth()
    const window = monthWindow(targetYear, targetMonth, now)
    const { rows } = buildFiles(state, { from: window.from, to: window.to })
    const pl = buildProfitLoss(state, window.from, window.to)
    const sale = rows.reduce((sum, row) => sum + row.sale, 0)
    const cost = rows.reduce((sum, row) => sum + row.cost, 0)
    const officeExpenses = pl.totalOpex
    const profit = sale - cost - officeExpenses

    const categoryMap = new Map()
    for (const row of rows) {
      if (!categoryMap.has(row.category)) {
        categoryMap.set(row.category, {
          label: row.category,
          color: metaFor(row.category).color,
          sale: 0,
          cost: 0,
          profit: 0,
          count: 0,
        })
      }
      const bucket = categoryMap.get(row.category)
      bucket.sale += row.sale
      bucket.cost += row.cost
      bucket.profit += row.sale - row.cost
      bucket.count += 1
    }

    const allFiles = buildFiles(state, {})
    const dueFiles = allFiles.rows.filter((row) => row.due > 0)
    const dueByClient = new Map()
    for (const row of dueFiles) {
      const key = row.partyId || row.partyName
      if (!dueByClient.has(key)) {
        dueByClient.set(key, {
          name: row.partyName || row.applicant,
          type: row.partyType,
          due: 0,
          invoices: 0,
        })
      }
      const client = dueByClient.get(key)
      client.due += row.due
      client.invoices += 1
    }
    const topClients = [...dueByClient.values()].sort((a, b) => b.due - a.due).slice(0, 10)

    const money = cashPosition(state, window.to)
    const accountValue = (codes) =>
      money.filter((row) => codes.includes(row.code)).reduce((sum, row) => sum + row.balance, 0)

    const previousMonth = new Date(targetYear, targetMonth - 1, 1)
    const previousWindow = monthWindow(previousMonth.getFullYear(), previousMonth.getMonth(), now)
    const previousPl = buildProfitLoss(state, previousWindow.from, previousWindow.to)

    const index = buildIndex(state)
    const netCapital = (capital, drawings) => {
      const c = index.totals[capital] || { debit: 0, credit: 0 }
      const d = index.totals[drawings] || { debit: 0, credit: 0 }
      return c.credit - c.debit - (d.debit - d.credit)
    }
    const partnerCapital = Math.max(0, netCapital('3010', '3030')) + Math.max(0, netCapital('3020', '3040'))
    const payables = buildPayables(state, window.to)

    const series = []
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(targetYear, targetMonth - i, 1)
      const w = monthWindow(date.getFullYear(), date.getMonth(), now)
      const { rows: monthRows } = buildFiles(state, { from: w.from, to: w.to })
      const monthPl = buildProfitLoss(state, w.from, w.to)
      const monthSale = monthRows.reduce((sum, row) => sum + row.sale, 0)
      const monthCost = monthRows.reduce((sum, row) => sum + row.cost, 0)
      series.push({
        label: MONTHS_SHORT[date.getMonth()],
        revenue: monthSale,
        cost: monthCost + monthPl.totalOpex,
        profit: monthSale - monthCost - monthPl.totalOpex,
      })
    }

    const today = todayISO()
    const agingBuckets = [
      { label: '0–30 days', color: '#16A34A', amount: 0 },
      { label: '31–60 days', color: '#0879E8', amount: 0 },
      { label: '61–90 days', color: '#D97706', amount: 0 },
      { label: '90+ days', color: '#DC2626', amount: 0 },
    ]
    let overdue = 0
    for (const row of dueFiles) {
      const age = Math.max(0, daysBetween(row.date, today))
      const bucketIndex = age <= 30 ? 0 : age <= 60 ? 1 : age <= 90 ? 2 : 3
      agingBuckets[bucketIndex].amount += row.due
      if (age > 30) overdue += row.due
    }

    return {
      year: targetYear,
      month: targetMonth,
      monthName: monthLabel(targetYear, targetMonth),
      from: window.from,
      to: window.to,
      sale,
      cost,
      officeExpenses,
      profit,
      margin: sale > 0 ? (profit / sale) * 100 : 0,
      previous: {
        sale: previousPl.totalRevenue,
        cost: previousPl.totalCogs,
        profit: previousPl.netProfit,
      },
      b2b: rows.filter((row) => row.partyType === 'B2B').reduce((sum, row) => sum + row.sale, 0),
      b2c: rows.filter((row) => row.partyType === 'B2C').reduce((sum, row) => sum + row.sale, 0),
      categories: [...categoryMap.values()].sort((a, b) => b.sale - a.sale),
      totalDue: dueFiles.reduce((sum, row) => sum + row.due, 0),
      overdue,
      topClients,
      series,
      aging: agingBuckets,
      vendorDue: payables.summary.due,
      vendorOverdue: payables.summary.overdue,
      partnerCapital,
      money: {
        cash: accountValue(['1010']),
        bank: accountValue(['1020', '1030']),
        bkash: accountValue(['1040']),
      },
      counts: {
        sales: rows.length,
        dueClients: dueByClient.size,
      },
    }
  },

  async listSales(filters = {}) {
    if (!config.enableMocks) {
      try {
        const res = await apiClient.get('/accounts/sales', { params: filters })
        const rawItems = res?.data ?? res?.rows
        if (Array.isArray(rawItems)) {
          return {
            rows: rawItems.map((row) => ({
              ...row,
              daysWaiting: row.due > 0 ? Math.max(0, daysBetween(row.date, todayISO())) : 0,
            })),
            summary: res.meta?.summary || { totalSale: 0, totalCost: 0, totalProfit: 0, totalDue: 0 },
            total: res.meta?.total
          }
        }
      } catch (err) {
        console.warn('Backend /accounts/sales error, falling back to local state:', err)
      }
    }
    const state = loadState()
    const { rows, summary } = buildFiles(state, filters)
    return {
      rows: rows.map((row) => ({
        ...row,
        daysWaiting: row.due > 0 ? Math.max(0, daysBetween(row.date, todayISO())) : 0,
      })),
      summary,
    }
  },

  async listDue(params = {}) {
    if (!config.enableMocks) {
      try {
        const res = await apiClient.get('/accounts/dues', { params })
        const rawItems = res?.data ?? res?.rows
        if (Array.isArray(rawItems)) {
          const rows = rawItems.map((row) => ({
            ...row,
            daysWaiting: Math.max(0, daysBetween(row.date, todayISO())),
          }))
          return {
            rows,
            totals: res.meta?.totals || {
              due: rows.reduce((sum, row) => sum + row.due, 0),
              b2b: rows.filter((row) => row.partyType === 'B2B').reduce((sum, row) => sum + row.due, 0),
              b2c: rows.filter((row) => row.partyType === 'B2C').reduce((sum, row) => sum + row.due, 0),
              count: rows.length,
            }
          }
        }
      } catch (err) {
        console.warn('Backend /accounts/dues error, falling back to local state:', err)
      }
    }
    const state = loadState()
    const { rows } = buildFiles(state, {})
    const dues = rows
      .filter((row) => row.due > 0)
      .map((row) => ({
        ...row,
        daysWaiting: Math.max(0, daysBetween(row.date, todayISO())),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
    return {
      rows: dues,
      totals: {
        due: dues.reduce((sum, row) => sum + row.due, 0),
        b2b: dues.filter((row) => row.partyType === 'B2B').reduce((sum, row) => sum + row.due, 0),
        b2c: dues.filter((row) => row.partyType === 'B2C').reduce((sum, row) => sum + row.due, 0),
        count: dues.length,
      },
    }
  },

  async getPriceList() {
    const state = loadState()
    const { rows } = buildFiles(state, {})
    const result = []
    for (const category of SIMPLE_CATEGORIES) {
      const items = rows.filter((row) => row.category === category.label)
      const b2b = items.filter((row) => row.partyType === 'B2B')
      const b2c = items.filter((row) => row.partyType === 'B2C')
      const avg = (list, key) =>
        list.length ? Math.round(list.reduce((sum, row) => sum + row[key], 0) / list.length / 100) * 100 : 0
      const fallback = PRICE_DEFAULTS[category.label] || { b2b: 0, b2c: 0, cost: 0 }
      result.push({
        label: category.label,
        b2b: avg(b2b, 'sale') || fallback.b2b,
        b2c: avg(b2c, 'sale') || fallback.b2c,
        cost: avg(items, 'cost') || fallback.cost,
        count: items.length,
      })
    }
    return result
  },

  async createSale(payload) {
    const state = clone(loadState())
    const meta = metaFor(payload.category)
    const party = ensureParty(state, payload)
    const date = payload.date || todayISO()
    const sale = round(payload.sale ?? payload.selling)
    const cost = round(payload.cost)
    const received = round(payload.received)
    if (sale <= 0) throw new Error('Selling price must be greater than zero.')
    if (received < 0 || cost < 0) throw new Error('Amounts cannot be negative.')
    if (received > sale) throw new Error('Received cannot be more than the selling price.')

    ensureCategory(state, payload.category)
    state.counters.file = (state.counters.file || 0) + 1
    const year = date.slice(0, 4)
    const file = {
      id: `f${state.counters.file}`,
      fileNo: nextFileNo(state, meta.type, meta.prefix, year),
      type: meta.type,
      segment: meta.segment,
      category: meta.label,
      date,
      applicant: String(payload.clientName || party.name).trim(),
      partyId: party.id,
      partyName: party.name,
      partyType: party.type,
      destination: meta.label,
      detail: String(payload.phone || '').trim(),
      passportNo: '',
      pax: 1,
      sale,
      costs:
        cost > 0
          ? [{ account: meta.costAccount, label: 'Cost price', amount: cost, paidVia: 'credit', date }]
          : [],
      status: 'Processing',
      travelDate: '',
      dueDate: addDays(date, 7),
      notes: String(payload.note || '').trim(),
      createdAt: new Date().toISOString(),
    }
    state.files.push(file)

    const saleJournal = postSale(state, file, party)
    file.saleJournalId = saleJournal.id
    const costJournal = postCost(state, file)
    if (costJournal) file.costJournalId = costJournal.id

    if (received > 0) {
      const receipt = postReceiptToState(state, {
        file,
        amount: received,
        method: payload.method || 'cash',
        date,
        note: 'Received at sale',
      })
      file.receiptId = receipt.id
    }

    saveState(state)
    return { ...file, ...fileFinancials(state, file, buildIndex(state)) }
  },

  async updateSale(id, payload) {
    const state = clone(loadState())
    const file = (state.files || []).find((row) => row.id === id)
    if (!file) throw new Error('Sale not found.')
    if (file.status === 'Cancelled') throw new Error('Cancelled sales cannot be edited.')

    const meta = metaFor(payload.category)
    const party = ensureParty(state, payload)
    const sale = round(payload.sale ?? payload.selling)
    const cost = round(payload.cost)
    if (sale <= 0) throw new Error('Selling price must be greater than zero.')
    if (cost < 0) throw new Error('Cost price cannot be negative.')

    const stamp = new Date().toISOString()
    for (const journal of state.journals || []) {
      if (journal.fileId === id && (journal.type === 'SV' || journal.type === 'JV') && journal.status !== 'void') {
        journal.status = 'void'
        journal.voidedAt = stamp
      }
    }

    const extraCosts = (file.costs || []).filter((line) => line.label !== 'Cost price')

    Object.assign(file, {
      type: meta.type,
      segment: meta.segment,
      category: meta.label,
      date: payload.date || file.date,
      applicant: String(payload.clientName || party.name).trim(),
      partyId: party.id,
      partyName: party.name,
      partyType: party.type,
      destination: meta.label,
      detail: String(payload.phone || '').trim(),
      sale,
      costs: [
        ...(cost > 0
          ? [{ account: meta.costAccount, label: 'Cost price', amount: cost, paidVia: 'credit', date: payload.date || file.date }]
          : []),
        ...extraCosts,
      ],
      notes: String(payload.note || '').trim(),
    })

    const saleJournal = postSale(state, file, party)
    file.saleJournalId = saleJournal.id
    const costJournal = postCost(state, file)
    file.costJournalId = costJournal?.id || null

    saveState(state)
    return { ...file, ...fileFinancials(state, file, buildIndex(state)) }
  },

  async deleteSale(id) {
    const state = clone(loadState())
    const file = (state.files || []).find((row) => row.id === id)
    if (!file) throw new Error('Sale not found.')
    const stamp = new Date().toISOString()
    for (const journal of state.journals || []) {
      if (journal.fileId === id && journal.status !== 'void') {
        journal.status = 'void'
        journal.voidedAt = stamp
      }
    }
    file.status = 'Cancelled'
    file.isDeleted = true
    saveState(state)
    return { success: true }
  },

  async addCost(id, payload) {
    const state = clone(loadState())
    const file = (state.files || []).find((row) => row.id === id)
    if (!file) throw new Error('Sale not found.')
    const amount = round(payload.amount)
    if (amount <= 0) throw new Error('Cost amount must be greater than zero.')
    const meta = metaFor(file.category)
    const date = payload.date || todayISO()
    file.costs = [
      ...(file.costs || []),
      {
        account: meta.costAccount,
        label: payload.note?.trim() || 'Extra cost',
        amount,
        paidVia: 'credit',
        date,
      },
    ]
    const vendor = firstVendor(state)
    postJournal(state, {
      date,
      type: 'JV',
      narration: `Extra cost — ${file.fileNo}`,
      segment: file.segment,
      partyId: file.partyId,
      fileId: file.id,
      ref: file.fileNo,
      lines: [
        { account: meta.costAccount, debit: amount, memo: payload.note?.trim() || 'Extra cost' },
        {
          account: AP_ACCOUNT,
          credit: amount,
          partyId: vendor?.id || null,
          dueDate: addDays(date, 30),
          memo: 'Supplier cost',
        },
      ],
    })
    saveState(state)
    return { success: true }
  },

  async listReceipts({ from, to, search } = {}) {
    const state = loadState()
    const index = buildIndex(state)
    const query = String(search || '').trim().toLowerCase()
    const rows = []
    for (const journal of state.journals || []) {
      if (journal.type !== 'RV' || journal.status === 'void') continue
      if (from && journal.date < from) continue
      if (to && journal.date > to) continue
      const receipt = receiptFromJournal(state, index, journal)
      if (query) {
        const haystack = `${receipt.no} ${receipt.clientName} ${receipt.clientPhone} ${receipt.invoiceNo} ${receipt.category} ${receipt.note}`.toLowerCase()
        if (!haystack.includes(query)) continue
      }
      rows.push(receipt)
    }
    rows.sort((a, b) => b.date.localeCompare(a.date) || b.no.localeCompare(a.no))
    return {
      rows,
      summary: {
        count: rows.length,
        total: rows.reduce((sum, row) => sum + row.amount, 0),
        cash: rows.filter((row) => row.accountCode === '1010').reduce((sum, row) => sum + row.amount, 0),
        bank: rows.filter((row) => ['1020', '1030'].includes(row.accountCode)).reduce((sum, row) => sum + row.amount, 0),
        bkash: rows.filter((row) => row.accountCode === '1040').reduce((sum, row) => sum + row.amount, 0),
        discount: rows.reduce((sum, row) => sum + row.discount, 0),
      },
    }
  },

  async getReceipt(idOrNo) {
    const state = loadState()
    const index = buildIndex(state)
    const journal = (state.journals || []).find(
      (row) => row.type === 'RV' && row.status !== 'void' && (row.id === idOrNo || row.no === idOrNo)
    )
    if (!journal) throw new Error('Money receipt not found.')
    return receiptFromJournal(state, index, journal)
  },

  async deleteReceipt(id) {
    const state = clone(loadState())
    const journal = (state.journals || []).find((row) => row.id === id)
    if (!journal || journal.type !== 'RV') throw new Error('Money receipt not found.')
    if (journal.status === 'void') throw new Error('This receipt is already deleted.')
    journal.status = 'void'
    journal.voidedAt = new Date().toISOString()
    journal.voidReason = 'Deleted from Money Receipts'
    saveState(state)
    return { success: true }
  },

  async addReceipt(payload) {
    const state = clone(loadState())
    const file = (state.files || []).find((row) => row.id === payload.invoiceId)
    if (!file) throw new Error('Sale not found.')
    const index = buildIndex(state)
    const financials = fileFinancials(state, file, index)
    const amount = round(payload.amount)
    const discount = round(payload.discount)
    if (amount < 0 || discount < 0) throw new Error('Amounts cannot be negative.')
    if (amount + discount <= 0) throw new Error('Enter an amount received or a discount.')
    if (amount + discount > financials.due + 0.5) {
      throw new Error(
        `Amount + discount cannot be more than the due of ৳${financials.due.toLocaleString('en-IN')}.`
      )
    }
    const date = payload.date || todayISO()
    const receipt = postReceiptToState(state, {
      file,
      amount,
      discount,
      method: payload.method || 'cash',
      date,
      receiptNo: payload.receiptNo,
      note: payload.note,
    })
    saveState(state)
    return receipt
  },

  async addExpense(payload) {
    const state = clone(loadState())
    const amount = round(payload.amount)
    if (amount <= 0) throw new Error('Expense amount must be greater than zero.')
    const date = payload.date || todayISO()
    const account = payload.account || '6100'
    postJournal(state, {
      date,
      type: 'PV',
      narration: payload.note?.trim() || 'Office expense',
      segment: null,
      ref: 'EXPENSE',
      lines: [
        { account, debit: amount, memo: payload.note?.trim() || 'Office expense' },
        { account: methodAccount(payload.method || 'cash'), credit: amount, memo: 'Paid' },
      ],
    })
    saveState(state)
    return { success: true }
  },

  async getMonthly(year, month) {
    const state = loadState()
    const now = new Date()
    const window = monthWindow(year, month, now)
    const { rows } = buildFiles(state, { from: window.from, to: window.to })
    const pl = buildProfitLoss(state, window.from, window.to)
    const lastDay =
      year === now.getFullYear() && month === now.getMonth() ? now.getDate() : daysInMonth(year, month)
    const byDay = Array.from({ length: lastDay }, (_, index) => {
      const date = `${year}-${pad(month + 1)}-${pad(index + 1)}`
      const dayFiles = rows.filter((row) => row.date === date)
      return {
        date,
        day: index + 1,
        sale: dayFiles.reduce((sum, row) => sum + row.sale, 0),
        cost: dayFiles.reduce((sum, row) => sum + row.cost, 0),
        profit: dayFiles.reduce((sum, row) => sum + (row.sale - row.cost), 0),
        count: dayFiles.length,
      }
    })

    const expenses = []
    for (const journal of state.journals || []) {
      if (journal.status === 'void' || journal.date < window.from || journal.date > window.to) continue
      const lines = (journal.lines || []).filter(
        (line) => line.account.startsWith('6') && Number(line.debit) > 0
      )
      if (!lines.length) continue
      expenses.push({
        id: journal.id,
        date: journal.date,
        amount: lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0),
        note: lines.map((line) => line.memo).filter(Boolean).join(', ') || journal.narration,
        account: lines[0].account,
      })
    }
    expenses.sort((a, b) => b.date.localeCompare(a.date))

    const categoryMap = new Map()
    for (const row of rows) {
      if (!categoryMap.has(row.category)) {
        categoryMap.set(row.category, {
          label: row.category,
          color: metaFor(row.category).color,
          sale: 0,
          cost: 0,
          profit: 0,
          count: 0,
        })
      }
      const bucket = categoryMap.get(row.category)
      bucket.sale += row.sale
      bucket.cost += row.cost
      bucket.profit += row.sale - row.cost
      bucket.count += 1
    }

    return {
      year,
      month,
      monthName: monthLabel(year, month),
      from: window.from,
      to: window.to,
      sale: rows.reduce((sum, row) => sum + row.sale, 0),
      cost: rows.reduce((sum, row) => sum + row.cost, 0),
      officeExpenses: pl.totalOpex,
      profit: rows.reduce((sum, row) => sum + row.sale - row.cost, 0) - pl.totalOpex,
      categories: [...categoryMap.values()],
      days: byDay,
      expenses,
      availableYears: [...new Set((state.files || []).map((file) => Number(file.date.slice(0, 4))))].sort(
        (a, b) => b - a
      ),
      counts: { sales: rows.length, expenses: expenses.length },
    }
  },

  async getYearly(year) {
    const state = loadState()
    const rows = []
    for (let month = 0; month < 12; month += 1) {
      const window = monthWindow(year, month, new Date())
      const pl = buildProfitLoss(state, window.from, window.to)
      const { rows: monthFiles } = buildFiles(state, { from: window.from, to: window.to })
      rows.push({
        month,
        monthName: new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'short' }),
        sale: monthFiles.reduce((sum, row) => sum + row.sale, 0),
        cost: monthFiles.reduce((sum, row) => sum + row.cost, 0),
        officeExpenses: pl.totalOpex,
        profit: monthFiles.reduce((sum, row) => sum + row.sale - row.cost, 0) - pl.totalOpex,
        count: monthFiles.length,
      })
    }
    return { year, rows }
  },

  async getVendorPayables() {
    try {
      await vendorApi.syncAccounting()
    } catch {
      // Keep Accounts usable even if vendor storage is unavailable.
    }
    const state = loadState()
    const data = buildPayables(state, todayISO())
    return {
      rows: data.parties,
      totals: data.summary,
      aging: data.aging,
    }
  },

  async getVendorAdvances() {
    const state = loadState()
    const balances = new Map()
    for (const journal of state.journals || []) {
      if (journal.status === 'void') continue
      for (const line of journal.lines || []) {
        if (line.account !== '1200') continue
        const partyId = line.partyId || journal.partyId
        if (!partyId) continue
        const balance = (Number(line.debit) || 0) - (Number(line.credit) || 0)
        balances.set(partyId, (balances.get(partyId) || 0) + balance)
      }
    }
    const rows = [...balances.entries()]
      .map(([partyId, amount]) => {
        const party = (state.parties || []).find((row) => row.id === partyId)
        return {
          partyId,
          name: party?.name || 'Vendor',
          code: party?.code || '',
          amount: Math.max(0, amount),
        }
      })
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount)
    return { rows, total: rows.reduce((sum, row) => sum + row.amount, 0) }
  },

  async listParties(type) {
    const state = loadState()
    const { rows } = buildFiles(state, {})
    return (state.parties || [])
      .filter((party) => party.type === type)
      .map((party) => {
        const files = rows.filter((row) => row.partyId === party.id)
        const invoiced = files.reduce((sum, row) => sum + row.sale, 0)
        const received = files.reduce((sum, row) => sum + row.received, 0)
        const due = files.reduce((sum, row) => sum + row.due, 0)
        return {
          ...party,
          invoices: files.length,
          invoiced,
          received,
          due,
          lastDate: files.map((row) => row.date).sort().at(-1) || null,
          creditUsed: party.creditLimit > 0 ? (due / party.creditLimit) * 100 : 0,
        }
      })
      .sort((a, b) => b.due - a.due || a.name.localeCompare(b.name))
  },

  async addClient(payload) {
    const state = clone(loadState())
    const type = payload.type === 'B2B' ? 'B2B' : 'B2C'
    const name = String(payload.name || '').trim()
    if (!name) throw new Error('Name is required.')
    if ((state.parties || []).some((party) => party.type === type && party.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`${type === 'B2B' ? 'Agent' : 'Client'} "${name}" already exists.`)
    }
    const party = ensureParty(state, {
      clientType: type,
      agencyName: type === 'B2B' ? name : '',
      clientName: name,
      phone: payload.phone,
    })
    if (type === 'B2B') party.creditLimit = Math.max(0, Number(payload.creditLimit) || 0)
    saveState(state)
    return party
  },

  async getPartners() {
    const state = loadState()
    const index = buildIndex(state)
    const net = (capital, drawings) => {
      const capitalTotal = index.totals[capital] || { debit: 0, credit: 0 }
      const drawTotal = index.totals[drawings] || { debit: 0, credit: 0 }
      return capitalTotal.credit - capitalTotal.debit - (drawTotal.debit - drawTotal.credit)
    }
    const netA = net('3010', '3030')
    const netB = net('3020', '3040')
    const sums = (capital, drawings) => {
      const c = index.totals[capital] || { debit: 0, credit: 0 }
      const d = index.totals[drawings] || { debit: 0, credit: 0 }
      return { invested: c.credit, withdrawn: Math.max(0, d.debit - d.credit) }
    }
    const capitalA = sums('3010', '3030')
    const capitalB = sums('3020', '3040')
    const total = Math.max(0, netA) + Math.max(0, netB)
    const now = new Date()
    const window = monthWindow(now.getFullYear(), now.getMonth(), now)
    const pl = buildProfitLoss(state, window.from, window.to)
    const { rows: monthRows } = buildFiles(state, { from: window.from, to: window.to })
    const monthProfit = monthRows.reduce((sum, row) => sum + row.sale - row.cost, 0) - pl.totalOpex
    const transactions = []
    for (const journal of state.journals || []) {
      if (journal.status === 'void') continue
      for (const line of journal.lines || []) {
        if (['3010', '3020', '3030', '3040'].includes(line.account)) {
          transactions.push({
            id: journal.id,
            date: journal.date,
            partner: ['3010', '3030'].includes(line.account) ? 'A' : 'B',
            type: ['3010', '3020'].includes(line.account) ? 'in' : 'out',
            amount: Number(line.debit) || Number(line.credit) || 0,
            note: line.memo || journal.narration,
          })
        }
      }
    }
    transactions.sort((a, b) => b.date.localeCompare(a.date))
    return {
      partners: [
        {
          id: 'A',
          name: 'Partner A',
          net: netA,
          invested: capitalA.invested,
          withdrawn: capitalA.withdrawn,
          share: total > 0 ? (Math.max(0, netA) / total) * 100 : 50,
        },
        {
          id: 'B',
          name: 'Partner B',
          net: netB,
          invested: capitalB.invested,
          withdrawn: capitalB.withdrawn,
          share: total > 0 ? (Math.max(0, netB) / total) * 100 : 50,
        },
      ],
      monthProfit,
      monthName: monthLabel(now.getFullYear(), now.getMonth()),
      transactions: transactions.slice(0, 50),
    }
  },

  async addPartnerTransaction(payload) {
    const state = clone(loadState())
    const amount = round(payload.amount)
    if (amount <= 0) throw new Error('Amount must be greater than zero.')
    const partner = payload.partner === 'B' ? 'B' : 'A'
    const date = payload.date || todayISO()
    const account = partner === 'B' ? '3020' : '3010'
    const drawings = partner === 'B' ? '3040' : '3030'
    const lines =
      payload.direction === 'out'
        ? [
            { account: drawings, debit: amount, memo: payload.note || 'Money out' },
            { account: methodAccount(payload.method || 'bank'), credit: amount, memo: 'Partner withdrawal' },
          ]
        : [
            { account: methodAccount(payload.method || 'bank'), debit: amount, memo: payload.note || 'Money in' },
            { account, credit: amount, memo: 'Partner capital' },
          ]
    postJournal(state, {
      date,
      type: 'PV',
      narration: payload.note?.trim() || `Partner ${partner} ${payload.direction === 'out' ? 'withdrawal' : 'capital'}`,
      segment: null,
      ref: 'PARTNER',
      lines,
    })
    saveState(state)
    return { success: true }
  },

  async getExpenseAccounts() {
    const state = loadState()
    return (state.accounts || [])
      .filter((account) => account.type === 'Expense' && account.group === 'Operating Expenses')
      .map((account) => ({ code: account.code, name: account.name }))
  },

  async getAccountBalances() {
    const state = loadState()
    const rows = cashPosition(state, todayISO())
    const find = (code) => rows.find((row) => row.code === code)?.balance || 0
    return [
      { key: 'cash', label: 'Cash', amount: find('1010') },
      { key: 'bank', label: 'Bank', amount: find('1020') + find('1030') },
      { key: 'bkash', label: 'bKash', amount: find('1040') },
    ]
  },
}

export { CASH_ACCOUNTS, metaFor }
