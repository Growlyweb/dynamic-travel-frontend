/**
 * Reports & Financial Accounting API & Storage Layer
 * Manages daily entries, monthly aggregations, categories, B2B agents, and B2C clients
 * with localStorage persistence and export capabilities.
 * Uses ABL Travel brand tokens and design system constants.
 */

import {
  exportToCsv as engineExportToCsv,
  exportToExcel,
  printReportDocument,
} from '@/utils/exportEngine'

const STORAGE_KEY = 'abl_reports_data_v1'

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

// Project brand palette
export const PALETTE = [
  '#0879E8', // Primary ABL Blue
  '#16a34a', // Success Emerald
  '#FFB000', // Accent Gold
  '#7C3AED', // Purple
  '#0284C7', // Sky Blue
  '#dc2626', // Danger Rose
  '#0d9488', // Teal
  '#64748b', // Slate
]

export const formatMoney = (n) => {
  const num = Number(n) || 0
  const sign = num < 0 ? '−' : ''
  return `${sign}৳${Math.abs(Math.round(num)).toLocaleString('en-IN')}`
}

export const formatPercentVal = (a, b) => {
  if (!b) return '0.0%'
  return `${((a / b) * 100).toFixed(1)}%`
}

const ds = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

function generateInitialData() {
  const svc = [
    { n: 'Saudi Visa', cost: 8500, b2b: 10000, b2c: 13000 },
    { n: 'Thailand Visa', cost: 5200, b2b: 6500, b2c: 8500 },
    { n: 'Dubai Visa', cost: 7000, b2b: 8800, b2c: 11500 },
    { n: "Cox's Bazar Tour", cost: 8000, b2b: 10000, b2c: 15000 },
    { n: 'Thailand Tour Pack', cost: 32000, b2b: 38000, b2c: 48000 },
  ]

  const cl = [
    { t: 'B2B', name: 'ABC Travels', contact: '01711-000001', limit: 200000, inv: 185000, paid: 100000, over: 40000 },
    { t: 'B2B', name: 'Global Tours', contact: '01811-000002', limit: 150000, inv: 90000, paid: 58000, over: 0 },
    { t: 'B2B', name: 'Sky Way Agency', contact: '01911-000003', limit: 100000, inv: 96000, paid: 30000, over: 50000 },
    { t: 'B2C', name: 'Rahim Uddin', contact: '01511-000004', limit: 0, inv: 13000, paid: 0, over: 13000 },
    { t: 'B2C', name: 'Nusrat Jahan', contact: '01611-000005', limit: 0, inv: 48000, paid: 30000, over: 0 },
    { t: 'B2C', name: 'Karim Hossain', contact: '01311-000006', limit: 0, inv: 15000, paid: 15000, over: 0 },
    { t: 'B2B', name: 'Blue Sky Holidays', contact: '01711-000007', limit: 120000, inv: 110000, paid: 45000, over: 30000 },
    { t: 'B2B', name: 'Dhaka Voyage', contact: '01811-000008', limit: 80000, inv: 64000, paid: 20000, over: 0 },
    { t: 'B2C', name: 'Sabbir Ahmed', contact: '01911-000009', limit: 0, inv: 26000, paid: 6000, over: 20000 },
    { t: 'B2C', name: 'Tania Akter', contact: '01511-000010', limit: 0, inv: 8500, paid: 0, over: 8500 },
    { t: 'B2C', name: 'Mizanur Rahman', contact: '01611-000011', limit: 0, inv: 15000, paid: 5000, over: 0 },
  ]

  const vendors = [
    { name: 'Vendor 1', billNo: 'BILL-209', billed: 95000, paid: 9500, dueDate: '2026-10-25' },
    { name: 'Vendor 2', billNo: 'BILL-214', billed: 210000, paid: 120000, dueDate: '2026-10-30' },
    { name: 'Hotel Partner', billNo: 'BILL-220', billed: 160000, paid: 160000, dueDate: '2026-10-10' },
  ]

  const aging = [
    { label: '0–30 days', amount: 95000, color: '#0879E8' },
    { label: '31–60 days', amount: 60000, color: '#FFB000' },
    { label: '61–90 days', amount: 33000, color: '#dc2626' },
    { label: '90+ days', amount: 0, color: '#7f1d1d' },
  ]

  const exp = [
    { name: 'Salaries', amount: 70000 },
    { name: 'Office rent', amount: 30000 },
    { name: 'Marketing', amount: 18000 },
    { name: 'Utilities', amount: 9000 },
    { name: 'Other', amount: 13000 },
  ]

  const inv = [
    { d: '2026-01-05', p: 'A', t: 'Investment', a: 700000, note: 'Opening capital' },
    { d: '2026-01-05', p: 'B', t: 'Investment', a: 500000, note: 'Opening capital' },
    { d: '2026-04-12', p: 'A', t: 'Investment', a: 300000, note: 'Office setup' },
    { d: '2026-06-20', p: 'B', t: 'Investment', a: 200000, note: 'Visa float' },
    { d: '2026-08-30', p: 'A', t: 'Withdrawal', a: 50000, note: 'Drawings' },
  ]

  const cats = [
    { n: 'Visa', c: '#0879E8' },
    { n: 'Tour Package', c: '#16a34a' },
  ]

  const ent = []
  let nextId = 1
  for (let m = 0; m < 10; m++) {
    ent.push({
      id: nextId++,
      d: ds(2026, m, 5),
      k: 'Expense',
      ch: 'General',
      cat: 'Expense',
      desc: 'Salaries, rent, overhead',
      sell: 0,
      cost: 140000,
    })

    const endDay = m === 9 ? 16 : 28
    for (let d = 1; d <= endDay; d += 2) {
      const s = 60000 + ((d * 37 + m * 91) % 30) * 3000
      ent.push({
        id: nextId++,
        d: ds(2026, m, d),
        k: 'Sale',
        cat: d % 4 ? 'Visa' : 'Tour Package',
        ch: d % 5 < 2 ? 'B2C' : 'B2B',
        desc: d % 4 ? 'Visa sale' : 'Tour package sale',
        sell: s,
        cost: Math.round(s * (0.7 + ((d + m) % 5) * 0.02)),
      })
    }
  }

  return {
    svc,
    cl,
    vendors,
    aging,
    exp,
    inv,
    cats,
    ent,
    nextId: nextId + 10,
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.ent) && parsed.ent.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Failed reading reports data from storage:', err)
  }
  const initial = generateInitialData()
  saveState(initial)
  return initial
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Failed saving reports data to storage:', err)
  }
}

// ── Calculations & Helpers ────────────────────────────────────
export const calculateClientDue = (client) =>
  Math.max(0, (Number(client.inv) || 0) - (Number(client.paid) || 0))

export const getClientStatus = (client) => {
  const due = calculateClientDue(client)
  if (due === 0) return 'Paid'
  if (client.over > 0) return 'Overdue'
  if (client.paid > 0) return 'Partial'
  return 'Unpaid'
}

export const aggregateEntries = (entries, categories = []) => {
  const sales = entries.filter((e) => e.k === 'Sale')
  const expenses = entries.filter((e) => e.k === 'Expense')

  const sell = sales.reduce((sum, e) => sum + (Number(e.sell) || 0), 0)
  const cost = sales.reduce((sum, e) => sum + (Number(e.cost) || 0), 0)
  const ex = expenses.reduce((sum, e) => sum + (Number(e.cost) || 0), 0)

  const gp = sell - cost
  const net = gp - ex
  const margin = sell > 0 ? (net / sell) * 100 : 0

  const by = {}
  const cc = {}
  categories.forEach((cat) => {
    by[cat.n] = sales
      .filter((e) => e.cat === cat.n)
      .reduce((sum, e) => sum + (Number(e.sell) || 0), 0)
    cc[cat.n] = sales
      .filter((e) => e.cat === cat.n)
      .reduce((sum, e) => sum + (Number(e.cost) || 0), 0)
  })

  const b2b = sales
    .filter((e) => e.ch === 'B2B')
    .reduce((sum, e) => sum + (Number(e.sell) || 0), 0)

  const b2c = sales
    .filter((e) => e.ch === 'B2C')
    .reduce((sum, e) => sum + (Number(e.sell) || 0), 0)

  return {
    sell,
    cost,
    gp,
    ex,
    net,
    margin,
    by,
    cc,
    b2b,
    b2c,
    salesCount: sales.length,
    expensesCount: expenses.length,
  }
}

// ── Reports API Methods ───────────────────────────────────────
export const reportsApi = {
  resetToDefaultData: async () => {
    const fresh = generateInitialData()
    saveState(fresh)
    return { success: true, data: fresh }
  },

  getServices: async () => {
    const state = loadState()
    return { success: true, data: state.svc }
  },

  getFinancialOverview: async () => {
    const state = loadState()
    const now = new Date()
    const curYear = now.getFullYear()
    const curMonth = now.getMonth()

    const monthPrefix = ds(curYear, curMonth, 1).slice(0, 7)
    const currentMonthEntries = state.ent.filter((e) => e.d.startsWith(monthPrefix))
    const currentMonthAgg = aggregateEntries(currentMonthEntries, state.cats)

    const customerDues = state.cl.reduce((sum, c) => sum + calculateClientDue(c), 0)
    const b2bDues = state.cl.filter((c) => c.t === 'B2B').reduce((sum, c) => sum + calculateClientDue(c), 0)
    const b2cDues = state.cl.filter((c) => c.t === 'B2C').reduce((sum, c) => sum + calculateClientDue(c), 0)
    const vendorPayables = state.vendors.reduce((sum, v) => sum + (v.billed - v.paid), 0)

    const getPartnerNet = (id) =>
      state.inv
        .filter((x) => x.p === id)
        .reduce((sum, x) => sum + (x.t === 'Investment' ? x.a : -x.a), 0)

    const partnerANet = getPartnerNet('A')
    const partnerBNet = getPartnerNet('B')
    const totalPartnerCapital = partnerANet + partnerBNet

    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(curYear, curMonth - i, 1)
      const prefix = ds(d.getFullYear(), d.getMonth(), 1).slice(0, 7)
      const mEntries = state.ent.filter((e) => e.d.startsWith(prefix))
      const mAgg = aggregateEntries(mEntries, state.cats)
      last6Months.push({
        label: SHORT_MONTHS[d.getMonth()],
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        revenue: mAgg.sell,
        cost: mAgg.cost,
        net: mAgg.net,
        byCategory: mAgg.by,
      })
    }

    const topDues = [...state.cl]
      .filter((c) => calculateClientDue(c) > 0)
      .map((c) => ({
        ...c,
        due: calculateClientDue(c),
        status: getClientStatus(c),
      }))
      .sort((a, b) => b.due - a.due)
      .slice(0, 10)

    return {
      success: true,
      data: {
        year: curYear,
        month: curMonth,
        monthName: MONTH_NAMES[curMonth],
        currentMonth: currentMonthAgg,
        customerDues,
        b2bDues,
        b2cDues,
        vendorPayables,
        totalPartnerCapital,
        partnerA: {
          net: partnerANet,
          sharePercent: totalPartnerCapital > 0 ? (partnerANet / totalPartnerCapital) * 100 : 50,
        },
        partnerB: {
          net: partnerBNet,
          sharePercent: totalPartnerCapital > 0 ? (partnerBNet / totalPartnerCapital) * 100 : 50,
        },
        last6Months,
        topDues,
        aging: state.aging,
        categories: state.cats,
        expensesBreakdown: state.exp,
      },
    }
  },

  getMonthlyReport: async (year, month) => {
    const state = loadState()
    const prefix = ds(year, month, 1).slice(0, 7)
    const monthEntries = state.ent
      .filter((e) => e.d.startsWith(prefix))
      .sort((a, b) => a.d.localeCompare(b.d))

    const agg = aggregateEntries(monthEntries, state.cats)
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const dailyBreakdown = Array.from({ length: daysInMonth }, (_, idx) => {
      const dayNum = idx + 1
      const dayStr = String(dayNum).padStart(2, '0')
      const targetDate = `${prefix}-${dayStr}`
      const dayEntries = monthEntries.filter((e) => e.d === targetDate)
      const dayAgg = aggregateEntries(dayEntries, state.cats)
      return {
        day: dayNum,
        date: targetDate,
        sell: dayAgg.sell,
        cost: dayAgg.cost,
        net: dayAgg.net,
        entriesCount: dayEntries.length,
      }
    })

    const trend6Months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - i, 1)
      const dPrefix = ds(d.getFullYear(), d.getMonth(), 1).slice(0, 7)
      const mEntries = state.ent.filter((e) => e.d.startsWith(dPrefix))
      const mAgg = aggregateEntries(mEntries, state.cats)
      trend6Months.push({
        label: SHORT_MONTHS[d.getMonth()],
        byCategory: mAgg.by,
        total: mAgg.sell,
      })
    }

    const yearlyRows = Array.from({ length: 12 }, (_, i) => {
      const mPrefix = ds(year, i, 1).slice(0, 7)
      const mEntries = state.ent.filter((e) => e.d.startsWith(mPrefix))
      const mAgg = aggregateEntries(mEntries, state.cats)
      return {
        monthIndex: i,
        monthName: MONTH_NAMES[i],
        shortName: SHORT_MONTHS[i],
        byCategory: mAgg.by,
        sell: mAgg.sell,
        cost: mAgg.cost,
        expenses: mAgg.ex,
        net: mAgg.net,
        margin: mAgg.margin,
      }
    })

    const yearEntries = state.ent.filter((e) => e.d.startsWith(String(year)))
    const yearTotal = aggregateEntries(yearEntries, state.cats)

    const availableYears = [
      ...new Set([
        new Date().getFullYear(),
        year,
        ...state.ent.map((e) => parseInt(e.d.slice(0, 4), 10)),
      ]),
    ].sort()

    return {
      success: true,
      data: {
        year,
        month,
        monthName: MONTH_NAMES[month],
        isLiveMonth:
          year === new Date().getFullYear() && month === new Date().getMonth(),
        agg,
        categories: state.cats,
        dailyBreakdown,
        trend6Months,
        entries: monthEntries,
        yearlyRows,
        yearTotal,
        availableYears,
      },
    }
  },

  addDailyEntry: async (entry) => {
    const state = loadState()
    const newEntry = {
      id: state.nextId++,
      d: entry.date,
      k: entry.type || 'Sale',
      ch: entry.channel || 'B2C',
      cat: entry.type === 'Sale' ? entry.category || 'Visa' : 'Expense',
      desc: entry.description?.trim() || (entry.type === 'Sale' ? 'Sales record' : 'Expense record'),
      sell: entry.type === 'Sale' ? Math.max(0, Number(entry.sell) || 0) : 0,
      cost: Math.max(0, Number(entry.cost) || 0),
    }

    state.ent.push(newEntry)
    saveState(state)
    return { success: true, data: newEntry }
  },

  deleteDailyEntry: async (id) => {
    const state = loadState()
    const targetId = Number(id)
    state.ent = state.ent.filter((e) => e.id !== targetId)
    saveState(state)
    return { success: true }
  },

  getCategoryReport: async (year, month) => {
    const state = loadState()
    const prefix = ds(year, month, 1).slice(0, 7)
    const monthEntries = state.ent.filter((e) => e.d.startsWith(prefix))
    const agg = aggregateEntries(monthEntries, state.cats)

    const totalCategorySales = state.cats.reduce(
      (sum, cat) => sum + (agg.by[cat.n] || 0),
      0
    )

    const categoriesWithStats = state.cats.map((cat) => {
      const sell = agg.by[cat.n] || 0
      const cost = agg.cc[cat.n] || 0
      const profit = sell - cost
      const share = totalCategorySales > 0 ? (sell / totalCategorySales) * 100 : 0
      const isUsed = state.ent.some((e) => e.cat === cat.n)
      return {
        ...cat,
        sell,
        cost,
        profit,
        share,
        isUsed,
      }
    })

    const availableYears = [
      ...new Set([
        new Date().getFullYear(),
        year,
        ...state.ent.map((e) => parseInt(e.d.slice(0, 4), 10)),
      ]),
    ].sort()

    return {
      success: true,
      data: {
        year,
        month,
        monthName: MONTH_NAMES[month],
        categories: categoriesWithStats,
        totalCategorySales,
        availableYears,
      },
    }
  },

  addCategory: async ({ name, color }) => {
    const state = loadState()
    const trimmed = name?.trim()
    if (!trimmed) throw new Error('Category name is required')

    if (state.cats.some((c) => c.n.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Category "${trimmed}" already exists`)
    }

    const newCat = {
      n: trimmed,
      c: color || PALETTE[state.cats.length % PALETTE.length],
    }

    state.cats.push(newCat)
    saveState(state)
    return { success: true, data: newCat }
  },

  deleteCategory: async (categoryName) => {
    const state = loadState()
    const isUsed = state.ent.some((e) => e.cat === categoryName)
    if (isUsed) {
      throw new Error(`Cannot delete "${categoryName}" because entries already exist with this category.`)
    }

    state.cats = state.cats.filter((c) => c.n !== categoryName)
    saveState(state)
    return { success: true }
  },

  getB2BAgents: async () => {
    const state = loadState()
    const agents = state.cl
      .filter((c) => c.t === 'B2B')
      .map((c, idx) => {
        const due = calculateClientDue(c)
        const creditUsedPercent = c.limit > 0 ? (due / c.limit) * 100 : 0
        const collectedPercent = c.inv > 0 ? (c.paid / c.inv) * 100 : 0
        return {
          id: `b2b_${idx + 1}`,
          ...c,
          due,
          creditUsedPercent,
          collectedPercent,
          status: getClientStatus(c),
        }
      })

    const summary = {
      totalCount: agents.length,
      totalInvoiced: agents.reduce((sum, a) => sum + (Number(a.inv) || 0), 0),
      totalPaid: agents.reduce((sum, a) => sum + (Number(a.paid) || 0), 0),
      totalDue: agents.reduce((sum, a) => sum + a.due, 0),
      totalOverdue: agents.reduce((sum, a) => sum + (Number(a.over) || 0), 0),
    }

    return {
      success: true,
      data: {
        agents,
        summary,
        services: state.svc,
      },
    }
  },

  addB2BAgent: async ({ name, contact, limit, serviceIndex, qty, paidNow }) => {
    const state = loadState()
    const trimmed = name?.trim()
    if (!trimmed) throw new Error('Agency name is required')

    const sIndex = Number(serviceIndex) || 0
    const svc = state.svc[sIndex] || state.svc[0]
    const quantity = Math.max(1, Number(qty) || 1)
    const unitPrice = svc.b2b
    const totalInvoiced = unitPrice * quantity
    const paid = Math.min(totalInvoiced, Math.max(0, Number(paidNow) || 0))

    const newAgent = {
      t: 'B2B',
      name: trimmed,
      contact: contact?.trim() || '—',
      limit: Math.max(0, Number(limit) || 100000),
      inv: totalInvoiced,
      paid,
      over: 0,
    }

    state.cl.push(newAgent)
    saveState(state)
    return { success: true, data: newAgent }
  },

  getB2CClients: async () => {
    const state = loadState()
    const clients = state.cl
      .filter((c) => c.t === 'B2C')
      .map((c, idx) => {
        const due = calculateClientDue(c)
        const collectedPercent = c.inv > 0 ? (c.paid / c.inv) * 100 : 0
        return {
          id: `b2c_${idx + 1}`,
          ...c,
          due,
          collectedPercent,
          status: getClientStatus(c),
        }
      })

    const summary = {
      totalCount: clients.length,
      totalInvoiced: clients.reduce((sum, a) => sum + (Number(a.inv) || 0), 0),
      totalPaid: clients.reduce((sum, a) => sum + (Number(a.paid) || 0), 0),
      totalDue: clients.reduce((sum, a) => sum + a.due, 0),
      totalOverdue: clients.reduce((sum, a) => sum + (Number(a.over) || 0), 0),
    }

    return {
      success: true,
      data: {
        clients,
        summary,
        services: state.svc,
      },
    }
  },

  addB2CClient: async ({ name, contact, serviceIndex, qty, paidNow }) => {
    const state = loadState()
    const trimmed = name?.trim()
    if (!trimmed) throw new Error('Client name is required')

    const sIndex = Number(serviceIndex) || 0
    const svc = state.svc[sIndex] || state.svc[0]
    const quantity = Math.max(1, Number(qty) || 1)
    const unitPrice = svc.b2c
    const totalInvoiced = unitPrice * quantity
    const paid = Math.min(totalInvoiced, Math.max(0, Number(paidNow) || 0))

    const newClient = {
      t: 'B2C',
      name: trimmed,
      contact: contact?.trim() || '—',
      limit: 0,
      inv: totalInvoiced,
      paid,
      over: 0,
    }

    state.cl.push(newClient)
    saveState(state)
    return { success: true, data: newClient }
  },

  exportMonthlyReport: async (year, month, format = 'csv') => {
    const state = loadState()
    const prefix = ds(year, month, 1).slice(0, 7)
    const monthEntries = state.ent
      .filter((e) => e.d.startsWith(prefix))
      .sort((a, b) => a.d.localeCompare(b.d))

    const agg = aggregateEntries(monthEntries, state.cats)
    const monthName = MONTH_NAMES[month]
    const filename = `Report-${year}-${String(month + 1).padStart(2, '0')}`

    if (format === 'csv') {
      const headers = [
        { key: 'd', label: 'Date' },
        { key: 'k', label: 'Type' },
        { key: 'cat', label: 'Category' },
        { key: 'ch', label: 'Channel' },
        { key: 'desc', label: 'Description' },
        { key: (r) => (r.k === 'Sale' ? r.sell : 0), label: 'Selling Price (BDT)' },
        { key: 'cost', label: 'Cost Price (BDT)' },
        { key: (r) => (r.k === 'Sale' ? r.sell - r.cost : -r.cost), label: 'Profit (BDT)' },
      ]
      engineExportToCsv(filename, headers, monthEntries)
    } else if (format === 'excel') {
      exportToExcel(filename, {
        title: `Monthly Financial Report - ${monthName} ${year}`,
        subtitle: `Generated: ${new Date().toLocaleDateString('en-GB')} | Currency: BDT (৳)`,
        headers: [
          { key: 'd', label: 'Date' },
          { key: 'k', label: 'Type' },
          { key: 'cat', label: 'Category' },
          { key: 'ch', label: 'Channel' },
          { key: 'desc', label: 'Description' },
          { key: 'sell', label: 'Selling Price', isCurrency: true },
          { key: 'cost', label: 'Cost Price', isCurrency: true },
          { key: (r) => (r.k === 'Sale' ? r.sell - r.cost : -r.cost), label: 'Net Profit', isCurrency: true },
        ],
        rows: monthEntries,
        summaryTotals: [
          { label: 'Total Sales (Revenue)', value: formatMoney(agg.sell) },
          { label: 'Direct Costs', value: formatMoney(agg.cost) },
          { label: 'Operating Expenses', value: formatMoney(agg.ex) },
          { label: 'Net Profit', value: formatMoney(agg.net) },
        ],
        metadata: {
          Month: `${monthName} ${year}`,
          'Total Entries': monthEntries.length,
          'Net Margin': `${agg.margin.toFixed(1)}%`,
        },
      })
    } else if (format === 'pdf') {
      printReportDocument({
        title: `Monthly Financial Report - ${monthName} ${year}`,
        subtitle: `ABL Travel Financial Overview · ${monthName} ${year}`,
        headers: ['Date', 'Type', 'Category', 'Description', 'Selling Price', 'Cost Price', 'Profit'],
        rows: monthEntries.map((e) => [
          e.d,
          e.k,
          e.cat,
          e.desc,
          e.k === 'Sale' ? formatMoney(e.sell) : '—',
          formatMoney(e.cost),
          e.k === 'Sale' ? formatMoney(e.sell - e.cost) : formatMoney(-e.cost),
        ]),
        summaryTotals: [
          { label: 'Total Revenue', value: formatMoney(agg.sell) },
          { label: 'Total Costs', value: formatMoney(agg.cost + agg.ex) },
          { label: 'Net Profit', value: formatMoney(agg.net) },
        ],
      })
    }

    return { success: true }
  },

  exportYearlyReport: async (year, format = 'csv') => {
    const state = loadState()
    const rows = Array.from({ length: 12 }, (_, i) => {
      const prefix = ds(year, i, 1).slice(0, 7)
      const mEntries = state.ent.filter((e) => e.d.startsWith(prefix))
      const mAgg = aggregateEntries(mEntries, state.cats)
      return {
        month: MONTH_NAMES[i],
        ...mAgg.by,
        sell: mAgg.sell,
        cost: mAgg.cost,
        expenses: mAgg.ex,
        net: mAgg.net,
        margin: `${mAgg.margin.toFixed(1)}%`,
      }
    })

    const yearEntries = state.ent.filter((e) => e.d.startsWith(String(year)))
    const yt = aggregateEntries(yearEntries, state.cats)
    const filename = `Yearly-Report-${year}`

    if (format === 'csv') {
      const headers = [
        { key: 'month', label: 'Month' },
        ...state.cats.map((c) => ({ key: c.n, label: `${c.n} (BDT)` })),
        { key: 'sell', label: 'Selling Price (BDT)' },
        { key: 'cost', label: 'Cost Price (BDT)' },
        { key: 'expenses', label: 'Operating Expenses (BDT)' },
        { key: 'net', label: 'Net Profit (BDT)' },
        { key: 'margin', label: 'Margin %' },
      ]
      engineExportToCsv(filename, headers, rows)
    } else {
      exportToExcel(filename, {
        title: `Yearly Financial Performance - ${year}`,
        subtitle: `Consolidated Operations · Currency: BDT (৳)`,
        headers: [
          { key: 'month', label: 'Month' },
          ...state.cats.map((c) => ({ key: c.n, label: c.n, isCurrency: true })),
          { key: 'sell', label: 'Total Sales', isCurrency: true },
          { key: 'cost', label: 'Direct Costs', isCurrency: true },
          { key: 'expenses', label: 'Expenses', isCurrency: true },
          { key: 'net', label: 'Net Profit', isCurrency: true },
          { key: 'margin', label: 'Margin' },
        ],
        rows,
        summaryTotals: [
          { label: 'Annual Revenue', value: formatMoney(yt.sell) },
          { label: 'Annual Direct Costs', value: formatMoney(yt.cost) },
          { label: 'Annual Expenses', value: formatMoney(yt.ex) },
          { label: 'Annual Net Profit', value: formatMoney(yt.net) },
        ],
      })
    }
    return { success: true }
  },
}
