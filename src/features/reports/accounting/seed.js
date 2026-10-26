/**
 * Deterministic demo dataset for the accounting module.
 *
 * The generator posts balanced double-entry journals for a full trading year
 * of a travel agency: visa files, tour packages, air tickets, hotel bookings,
 * transport jobs, supplier bills, receipts, overheads, drawings and capital.
 * Running it twice on the same day produces the same books.
 */

import {
  ACCOUNTS,
  AP_ACCOUNT,
  AR_ACCOUNT,
  DESTINATIONS,
  FILE_TYPES,
  SEGMENTS,
  buildCostLines,
} from './coa.js'
import { addDays, daysBetween, daysInMonth, todayISO } from './dates.js'
import { postJournal as post } from './posting.js'

export const SEED_VERSION = 6

const B2C_NAMES = [
  'Rahim Uddin', 'Nusrat Jahan', 'Karim Hossain', 'Farhana Islam',
  'Sabbir Ahmed', 'Tania Akter', 'Mizanur Rahman', 'Sharmin Sultana',
  'Arif Chowdhury', 'Mehedi Hasan', 'Sadia Afrin', 'Imran Kabir',
  'Jannatul Ferdous', 'Rakibul Islam', 'Fahmida Yasmin', 'Tanvir Alam',
]

const B2B_AGENCIES = [
  'Skyline Travels', 'Global Travel Hub', 'Blue Sky Holidays', 'Dhaka Voyage',
  'Oceanic Tours', 'Prime Holidays', 'Unity Travels', 'Bengal Travel House',
]

const PASSENGERS = [
  'Ayesha Siddika', 'Mahmudul Hasan', 'Rumana Begum', 'Shakib Al Hasan',
  'Nazmul Huda', 'Parveen Akter', 'Rezaul Karim', 'Sumaiya Islam',
  'Anisur Rahman', 'Moushumi Das', 'Zahid Hossain', 'Lubna Yeasmin',
  'Faisal Ahmed', 'Nasrin Sultana',
]

const VENDORS = [
  { name: 'Thai Airways (GSA)', segment: 'air', payRatio: 0.96 },
  { name: 'Emirates (GSA)', segment: 'air', payRatio: 0.93 },
  { name: 'Biman Bangladesh Airlines', segment: 'air', payRatio: 0.98 },
  { name: 'Saudia (GSA)', segment: 'air', payRatio: 0.82, slow: true },
  { name: 'Siam DMC Co. Ltd.', segment: 'tour', payRatio: 0.94 },
  { name: 'Global Destination Management', segment: 'tour', payRatio: 0.86, slow: true },
  { name: 'Turkey Blue DMC', segment: 'tour', payRatio: 0.92 },
  { name: 'Bangkok Hospitality Group', segment: 'hotel', payRatio: 0.95 },
  { name: 'Makkah Grand Hotels', segment: 'hotel', payRatio: 0.8, slow: true },
  { name: 'Dubai Marina Hospitality', segment: 'hotel', payRatio: 0.96 },
  { name: 'Dhaka Car Rental', segment: 'transport', payRatio: 0.97 },
  { name: 'Cox Travel Transport', segment: 'transport', payRatio: 0.94 },
  { name: 'Visa Processing Services Ltd.', segment: 'visa', payRatio: 0.95 },
]

const OPEX = [
  { account: '6010', label: 'Salaries & allowances', amount: 120000, day: 1 },
  { account: '6020', label: 'Office rent', amount: 45000, day: 2 },
  { account: '6030', label: 'Utilities & internet', amount: 12000, day: 5 },
  { account: '6040', label: 'Marketing & promotion', amount: 18000, day: 8 },
  { account: '6050', label: 'Travel & conveyance', amount: 8000, day: 12 },
  { account: '6060', label: 'Professional & legal fees', amount: 5000, day: 15 },
  { account: '6080', label: 'Printing & office supplies', amount: 4500, day: 18 },
  { account: '6100', label: 'Miscellaneous expenses', amount: 3500, day: 22 },
  { account: '6070', label: 'Bank charges & fees', amount: 1500, day: 26 },
]

/* ── Helpers ───────────────────────────────────────────────── */

function mulberry32(seed) {
  let state = seed >>> 0
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), 1 | t)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const roundTo = (value, step = 100) => Math.round(value / step) * step

function pad(value, size) {
  return String(value).padStart(size, '0')
}

function phone(rng) {
  const prefix = ['017', '018', '019', '015', '016'][Math.floor(rng() * 5)]
  return `${prefix}${Math.floor(10000000 + rng() * 89999999)}`.replace(
    /^(\d{4})(\d{3})(\d{4})$/,
    '$1-$2-$3'
  )
}

function passport(rng) {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ'
  const prefix = `${letters[Math.floor(rng() * letters.length)]}${letters[Math.floor(rng() * letters.length)]}`
  return `${prefix}${Math.floor(1000000 + rng() * 8999999)}`
}

/* ── Posting primitives ────────────────────────────────────── */

function makeParty(state, { type, name, creditLimit = 0, since }) {
  const prefix = type === 'Vendor' ? 'V' : type === 'B2B' ? 'A' : 'C'
  const sequence = state.partySeq[prefix] || 0
  state.partySeq[prefix] = sequence + 1
  const party = {
    id: `${prefix.toLowerCase()}_${pad(sequence + 1, 2)}`,
    code: `${prefix}-${pad(sequence + 1, 4)}`,
    type,
    name,
    phone: phone(state.rng),
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@example.com`,
    address: 'Dhaka, Bangladesh',
    creditLimit,
    active: true,
    since,
  }
  state.parties.push(party)
  return party
}

/* ── Filing & posting operating jobs ───────────────────────── */

function nextFileNo(state, type, year) {
  const prefix = FILE_TYPES[type].prefix
  state.fileSeq[prefix] = (state.fileSeq[prefix] || 0) + 1
  return `${prefix}-${year}-${pad(state.fileSeq[prefix], 4)}`
}

function vendorFor(state, segment) {
  const pool = state.vendorPool[segment] || []
  if (!pool.length) return state.parties.find((party) => party.type === 'Vendor')
  return pool[Math.floor(state.rng() * pool.length)]
}

function postSale(state, file, party) {
  return post(state, {
    date: file.date,
    type: 'SV',
    narration: `${file.type} sale — ${file.fileNo}`,
    segment: file.segment,
    partyId: party.id,
    fileId: file.id,
    ref: file.fileNo,
    lines: [
      {
        account: AR_ACCOUNT,
        debit: file.sale,
        partyId: party.id,
        dueDate: addDays(file.date, FILE_TYPES[file.type].dueDays),
        memo: `${file.destination} · ${file.detail}`,
      },
      {
        account: FILE_TYPES[file.type].revenue,
        credit: file.sale,
        memo: `${file.applicant} — ${file.fileNo}`,
      },
    ],
  })
}

function postCosts(state, file) {
  const lines = []
  const creditBuckets = new Map()

  for (const costLine of file.costs) {
    if (costLine.amount <= 0) continue
    lines.push({
      account: costLine.account,
      debit: costLine.amount,
      memo: costLine.label,
    })

    if (costLine.paidVia === 'credit') {
      const vendor = vendorFor(state, file.segment)
      const key = `${vendor.id}`
      if (!creditBuckets.has(key)) {
        creditBuckets.set(key, {
          account: AP_ACCOUNT,
          credit: 0,
          partyId: vendor.id,
          dueDate: addDays(file.date, 30),
          memo: `Supplier bill — ${vendor.name}`,
          vendor,
        })
      }
      creditBuckets.get(key).credit += costLine.amount
    } else {
      const key = 'bank'
      if (!creditBuckets.has(key)) {
        creditBuckets.set(key, {
          account: '1020',
          credit: 0,
          memo: 'Paid from City Bank',
        })
      }
      creditBuckets.get(key).credit += costLine.amount
    }
  }

  for (const bucket of creditBuckets.values()) {
    const { vendor, ...line } = bucket
    lines.push(line)
    if (vendor) {
      state.apCreditByVendorThisMonth[vendor.id] =
        (state.apCreditByVendorThisMonth[vendor.id] || 0) + line.credit
    }
  }

  return post(state, {
    date: file.date,
    type: 'JV',
    narration: `Service cost — ${file.fileNo}`,
    segment: file.segment,
    partyId: file.partyId,
    fileId: file.id,
    ref: file.fileNo,
    lines,
  })
}

function postReceipt(state, file, party, amount, methodCode, date) {
  return post(state, {
    date,
    type: 'RV',
    narration: `Payment received — ${file.fileNo}`,
    segment: file.segment,
    partyId: party.id,
    fileId: file.id,
    ref: file.fileNo,
    lines: [
      { account: methodCode, debit: amount, memo: `Received from ${party.name}` },
      { account: AR_ACCOUNT, credit: amount, partyId: party.id, memo: file.fileNo },
    ],
  })
}

function createOperatingFiles(state, month, maxDay, year, volume = 1) {
  const rng = state.rng
  const elapsed = maxDay / daysInMonth(year, month)
  const scale = elapsed * volume
  const plan = {
    Visa: Math.max(3, Math.round(26 * scale)),
    Tour: Math.max(1, Math.round(6 * scale)),
    'Air Ticket': Math.max(1, Math.round(8 * scale)),
    Hotel: Math.max(1, Math.round(4 * scale)),
    Transport: Math.max(1, Math.round(5 * scale)),
  }

  const specs = []
  for (const [type, count] of Object.entries(plan)) {
    for (let i = 0; i < count; i += 1) {
      specs.push({ type, day: 1 + Math.floor(rng() * maxDay) })
    }
  }
  specs.sort((a, b) => a.day - b.day)

  for (const spec of specs) {
    const type = spec.type
    const meta = FILE_TYPES[type]
    const destinations = DESTINATIONS[meta.segment]
    let destination = destinations[Math.floor(rng() * destinations.length)]
    // Keep the sales mix from being dominated by rare high-value outliers.
    if (destination.b2c > 95000 && rng() < 0.55) {
      destination = destinations[Math.floor(rng() * destinations.length)]
    }
    const isB2B = rng() < (type === 'Air Ticket' ? 0.3 : 0.35)
    const candidates = state.parties.filter((party) => party.type === (isB2B ? 'B2B' : 'B2C'))
    const party = candidates[Math.floor(rng() * candidates.length)]
    const pax = type === 'Tour' && rng() < 0.35 ? 2 : 1
    const date = `${year}-${pad(month + 1, 2)}-${pad(spec.day, 2)}`
    const price = isB2B ? destination.b2b : destination.b2c
    const sale = roundTo(price * pax, 100)
    const cost = roundTo(destination.cost * pax, 100)
    const costs = buildCostLines(type, destination.name, cost)
    const applicant = isB2B ? PASSENGERS[Math.floor(rng() * PASSENGERS.length)] : party.name

    const file = {
      id: `f${state.counters.file + 1}`,
      fileNo: nextFileNo(state, type, year),
      type,
      segment: meta.segment,
      date,
      applicant,
      partyId: party.id,
      partyName: party.name,
      partyType: party.type,
      destination: destination.name,
      detail: destination.detail,
      passportNo: type === 'Visa' ? passport(rng) : '',
      pax,
      sale,
      costs,
      status: year < new Date().getFullYear() || month < new Date().getMonth() ? 'Completed' : rng() < 0.5 ? 'Completed' : 'Processing',
      travelDate: addDays(date, 15 + Math.floor(rng() * 45)),
      dueDate: addDays(date, meta.dueDays),
      notes: '',
      createdAt: `${date}T11:00:00.000`,
    }
    state.counters.file += 1
    state.files.push(file)

    const saleJournal = postSale(state, file, party)
    const costJournal = postCosts(state, file)
    file.saleJournalId = saleJournal.id
    file.costJournalId = costJournal.id

    // Collections: retail clients settle faster than credit agents.
    const roll = rng()
    let ratio = 0
    if (isB2B) {
      if (roll < 0.45) ratio = 1
      else if (roll < 0.78) ratio = 0.4 + rng() * 0.25
    } else if (roll < 0.68) ratio = 1
    else if (roll < 0.9) ratio = 0.35 + rng() * 0.3

    if (ratio > 0) {
      const settleDate = addDays(date, Math.floor(rng() * (isB2B ? 26 : 12)))
      if (settleDate <= todayISO()) {
        const amount = Math.min(sale, roundTo(sale * ratio, 100))
        if (amount > 0) {
          const method = rng() < 0.01 ? '1010' : '1020'
          file.received = (file.received || 0) + amount
          postReceipt(state, file, party, amount, method, settleDate)
        }
      }
    }
  }
}

/**
 * Chases a slice of the older open invoices each month so receivables settle
 * over time instead of accumulating forever. Also recovers the brought-forward
 * receivables during the first month.
 */
function collectOutstanding(state, month, maxDay, year, includeOpening = false) {
  const rng = state.rng
  const today = todayISO()
  const monthStart = `${year}-${pad(month + 1, 2)}-01`

  if (month === 0 && includeOpening) {
    const opening = [
      { code: 'A-0001', amount: 80000 },
      { code: 'A-0002', amount: 40000 },
      { code: 'C-0001', amount: 20000 },
    ]
    for (const item of opening) {
      const party = state.parties.find((row) => row.code === item.code)
      if (!party) continue
      const date = `${year}-01-${pad(Math.min(18, maxDay), 2)}`
      post(state, {
        date,
        type: 'RV',
        narration: `Opening balance recovery — ${party.name}`,
        partyId: party.id,
        ref: 'OB-RECOVERY',
        lines: [
          { account: '1020', debit: item.amount, memo: `Received from ${party.name}` },
          { account: AR_ACCOUNT, credit: item.amount, partyId: party.id, memo: 'Opening receivable' },
        ],
      })
    }
  }

  for (const file of state.files) {
    if (file.date >= monthStart) continue
    const outstanding = file.sale - (file.received || 0)
    if (outstanding <= 0) continue
    if (rng() > 0.62) continue
    const ratio = 0.45 + rng() * 0.55
    const lateDays = daysBetween(file.date, today)
    const amount =
      outstanding <= 500 || (lateDays > 120 && outstanding <= 2000)
        ? outstanding
        : Math.min(outstanding, roundTo(outstanding * ratio, 100))
    if (amount <= 0) continue
    const day = 2 + Math.floor(rng() * Math.max(1, maxDay - 2))
    const date = `${year}-${pad(month + 1, 2)}-${pad(day, 2)}`
    if (date > today) continue
    const party = state.parties.find((row) => row.id === file.partyId)
    if (!party) continue
    file.received = (file.received || 0) + amount
    postReceipt(state, file, party, amount, rng() < 0.01 ? '1010' : '1020', date)
  }
}

function postOverheads(state, month, maxDay, year) {  for (const item of OPEX) {
    const day = Math.min(item.day, maxDay)
    const date = `${year}-${pad(month + 1, 2)}-${pad(day, 2)}`
    post(state, {
      date,
      type: 'PV',
      narration: `${item.label} — ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month]} ${year}`,
      segment: null,
      ref: 'OPEX',
      lines: [
        { account: item.account, debit: item.amount, memo: item.label },
        { account: '1020', credit: item.amount, memo: 'Paid from City Bank' },
      ],
    })
  }

  // Monthly depreciation of office equipment and furniture
  const date = `${year}-${pad(month + 1, 2)}-${pad(Math.min(28, maxDay), 2)}`
  post(state, {
    date,
    type: 'JV',
    narration: 'Monthly depreciation charge',
    segment: null,
    ref: 'DEP',
    lines: [
      { account: '6090', debit: 9000, memo: 'Depreciation — equipment & fixtures' },
      { account: '1590', credit: 9000, memo: 'Accumulated depreciation' },
    ],
  })
}

function payVendors(state, month, maxDay, year) {
  const closed = month < new Date().getMonth()
  if (!closed && maxDay < 24) return

  for (const party of state.parties) {
    if (party.type !== 'Vendor') continue
    const owed = state.apCreditByVendorThisMonth[party.id] || 0
    if (owed <= 0) continue

    const vendorMeta = VENDORS.find((vendor) => vendor.name === party.name)
    const ratio = vendorMeta?.payRatio ?? 0.9
    const slowMonth = vendorMeta?.slow && month % 3 === 1
    const payRatio = slowMonth ? ratio * 0.35 : ratio
    const amount = roundTo(owed * payRatio, 100)
    if (amount <= 0) continue

    const day = Math.min(maxDay, 25 + Math.floor(state.rng() * 3))
    const date = `${year}-${pad(month + 1, 2)}-${pad(day, 2)}`
    post(state, {
      date,
      type: 'PV',
      narration: `Supplier payment — ${party.name}`,
      segment: null,
      partyId: party.id,
      ref: 'AP-RUN',
      lines: [
        { account: AP_ACCOUNT, debit: amount, partyId: party.id, memo: party.name },
        { account: '1020', credit: amount, memo: 'Paid from City Bank' },
      ],
    })
  }
  state.apCreditByVendorThisMonth = {}
}

function postPartnerDrawings(state, month, maxDay, year) {
  const date = `${year}-${pad(month + 1, 2)}-${pad(Math.min(20, maxDay), 2)}`
  const drawings = []
  if ([2, 6, 9].includes(month)) drawings.push({ account: '3030', name: 'Partner A', amount: 40000 })
  if ([3, 7].includes(month)) drawings.push({ account: '3040', name: 'Partner B', amount: 30000 })

  for (const drawing of drawings) {
    post(state, {
      date,
      type: 'PV',
      narration: `Partner drawing — ${drawing.name}`,
      segment: null,
      ref: 'DRAW',
      lines: [
        { account: drawing.account, debit: drawing.amount, memo: `${drawing.name} drawings` },
        { account: '1020', credit: drawing.amount, memo: 'Bank transfer to partner' },
      ],
    })
  }
}

/* ── Year-end closing ──────────────────────────────────────── */

/**
 * Close every income and expense account for the year into retained
 * earnings. This is what makes the comparative year's profit & loss
 * and the opening balance sheet of the following year tie out.
 */
function closeYear(state, year) {
  const accounts = ACCOUNTS.reduce((map, account) => {
    map[account.code] = account
    return map
  }, {})
  const totals = new Map()
  const prefix = `${year}-`

  for (const journal of state.journals) {
    if (journal.status === 'void' || !journal.date.startsWith(prefix)) continue
    for (const line of journal.lines) {
      const account = accounts[line.account]
      if (!account || (account.type !== 'Income' && account.type !== 'Expense')) continue
      totals.set(line.account, (totals.get(line.account) || 0) + line.debit - line.credit)
    }
  }

  const lines = []
  let profit = 0
  for (const [code, raw] of totals) {
    const account = accounts[code]
    if (!account || raw === 0) continue
    if (account.type === 'Income') {
      lines.push({ account: code, debit: -raw, memo: 'Close revenue to retained earnings' })
      profit += -raw
    } else {
      lines.push({ account: code, credit: raw, memo: 'Close expense to retained earnings' })
      profit -= raw
    }
  }
  if (lines.length === 0) return

  if (profit >= 0) {
    lines.push({ account: '3050', credit: profit, memo: `Profit for FY ${year}` })
  } else {
    lines.push({ account: '3050', debit: -profit, memo: `Loss for FY ${year}` })
  }

  post(state, {
    date: `${year}-12-31`,
    type: 'JV',
    narration: `Year-end closing — FY ${year}`,
    ref: 'CLOSING',
    lines,
  })

  const closingJournal = state.journals[state.journals.length - 1]
  closingJournal.closing = true
}

/* ── Entry point ───────────────────────────────────────────── */

export function buildSeed(now = new Date()) {
  const year = now.getFullYear()
  const priorYear = year - 1
  const lastMonth = now.getMonth()
  const today = todayISO()

  const state = {
    version: SEED_VERSION,
    createdAt: new Date().toISOString(),
    seedYear: year,
    accounts: ACCOUNTS.map((account) => ({ ...account })),
    segments: SEGMENTS.map((segment) => ({ ...segment })),
    parties: [],
    journals: [],
    files: [],
    seq: {},
    fileSeq: {},
    partySeq: {},
    counters: { journal: 0, file: 0 },
    apCreditByVendorThisMonth: {},
    rng: mulberry32(year * 7919 + 104729),
  }

  // Parties ---------------------------------------------------
  B2C_NAMES.forEach((name) => makeParty(state, { type: 'B2C', name, since: `${year - 1}-04-01` }))
  B2B_AGENCIES.forEach((name, index) =>
    makeParty(state, {
      type: 'B2B',
      name,
      creditLimit: 200000 + index * 60000,
      since: `${year - 2}-01-15`,
    })
  )
  VENDORS.forEach((vendor) => {
    const party = makeParty(state, { type: 'Vendor', name: vendor.name, since: `${year - 2}-06-01` })
    if (!state.vendorPool) state.vendorPool = {}
    if (!state.vendorPool[vendor.segment]) state.vendorPool[vendor.segment] = []
    state.vendorPool[vendor.segment].push(party)
  })

  const vendorByCode = (code) => state.parties.find((party) => party.code === code)

  // Opening balances -----------------------------------------
  post(state, {
    date: `${priorYear}-01-01`,
    type: 'OB',
    narration: `Opening balances brought forward — FY ${priorYear}`,
    ref: `FY ${priorYear}`,
    lines: [
      { account: '1020', debit: 2800000, memo: 'City Bank opening balance' },
      { account: '1030', debit: 1200000, memo: 'BRAC Bank opening balance' },
      { account: '1010', debit: 150000, memo: 'Cash float' },
      {
        account: AR_ACCOUNT,
        debit: 180000,
        partyId: state.parties.find((party) => party.code === 'A-0001').id,
        dueDate: `${priorYear}-11-30`,
        memo: 'Opening receivable — earlier files',
      },
      {
        account: AR_ACCOUNT,
        debit: 90000,
        partyId: state.parties.find((party) => party.code === 'A-0002').id,
        dueDate: `${priorYear}-12-10`,
        memo: 'Opening receivable — earlier files',
      },
      {
        account: AR_ACCOUNT,
        debit: 50000,
        partyId: state.parties.find((party) => party.code === 'C-0001').id,
        dueDate: `${priorYear}-12-20`,
        memo: 'Opening receivable — retail',
      },
      {
        account: AP_ACCOUNT,
        credit: 110000,
        partyId: vendorByCode('V-0001').id,
        dueDate: `${priorYear}-12-15`,
        memo: 'Opening airline payable',
      },
      {
        account: AP_ACCOUNT,
        credit: 70000,
        partyId: vendorByCode('V-0005').id,
        dueDate: `${priorYear}-12-20`,
        memo: 'Opening DMC payable',
      },
      { account: '3010', credit: 2500000, memo: 'Partner A capital' },
      { account: '3020', credit: 1650000, memo: 'Partner B capital' },
      { account: '3050', credit: 140000, memo: 'Retained earnings brought forward' },
    ],
  })

  post(state, {
    date: `${priorYear}-01-03`,
    type: 'JV',
    narration: 'Office equipment and furniture purchased',
    ref: 'CAPEX-01',
    lines: [
      { account: '1500', debit: 450000, memo: 'Computers, printers & UPS' },
      { account: '1510', debit: 180000, memo: 'Desks, chairs & partitions' },
      { account: '1020', credit: 630000, memo: 'Bank transfer' },
    ],
  })

  // Prior financial year (comparatives) ----------------------
  for (let month = 0; month < 12; month += 1) {
    const totalDays = daysInMonth(priorYear, month)
    createOperatingFiles(state, month, totalDays, priorYear, 0.78)
    collectOutstanding(state, month, totalDays, priorYear, true)
    postOverheads(state, month, totalDays, priorYear)
    payVendors(state, month, totalDays, priorYear)
    postPartnerDrawings(state, month, totalDays, priorYear)
  }
  closeYear(state, priorYear)

  // Current financial year -----------------------------------
  for (let month = 0; month <= lastMonth; month += 1) {
    const totalDays = daysInMonth(year, month)
    const maxDay = month === lastMonth && year === now.getFullYear()
      ? Math.min(now.getDate(), totalDays)
      : totalDays

    createOperatingFiles(state, month, maxDay, year)
    collectOutstanding(state, month, maxDay, year)
    postOverheads(state, month, maxDay, year)
    payVendors(state, month, maxDay, year)
    postPartnerDrawings(state, month, maxDay, year)
  }

  // Leave the books in a clean, JSON-serialisable shape
  delete state.rng
  delete state.vendorPool
  delete state.apCreditByVendorThisMonth
  state.lastUpdated = today

  return state
}
