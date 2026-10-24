/**
 * Double-entry accounting engine.
 *
 * Everything here is pure: it receives the stored state and derives ledgers,
 * trial balance, financial statements, sub-ledgers and job-costing figures.
 * No React, no storage, no side effects — which keeps the numbers testable.
 */

import {
  ACCOUNT_BY_CODE,
  AGING_BUCKETS,
  AP_ACCOUNT,
  AR_ACCOUNT,
  CASH_ACCOUNTS,
  DEBIT_TYPES,
  SEGMENTS,
  SEGMENT_BY_ID,
  TYPE_ORDER,
} from './coa.js'
import {
  MONTHS_SHORT,
  addDays,
  daysBetween,
  firstOfMonth,
  isoDate,
  monthWindow,
  previousMonthToDate,
} from './dates.js'

/* ── Lookups ───────────────────────────────────────────────── */

const accountMapCache = new WeakMap()

export function accountMap(state) {
  if (!state) return ACCOUNT_BY_CODE
  let map = accountMapCache.get(state)
  if (!map) {
    map = {}
    ;(state.accounts || []).forEach((account) => {
      map[account.code] = account
    })
    accountMapCache.set(state, map)
  }
  return map
}

export function accountOf(state, code) {
  return (
    accountMap(state)[code] ||
    ACCOUNT_BY_CODE[code] || {
      code,
      name: code,
      type: 'Expense',
      group: 'Operating Expenses',
    }
  )
}

export function isDebitNormal(account) {
  return DEBIT_TYPES.includes(account.type)
}

/** Positive amount in the account's natural direction. */
export function displayAmount(account, raw) {
  return isDebitNormal(account) ? raw : -raw
}

export function postedJournals(state, asOf) {
  return (state.journals || []).filter(
    (journal) => journal.status !== 'void' && (!asOf || journal.date <= asOf)
  )
}

export function sortedJournals(journals) {
  const sequence = (journal) => {
    const numeric = Number(String(journal.id || '').replace(/\D/g, ''))
    return Number.isFinite(numeric) ? numeric : 0
  }
  return [...journals].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      sequence(a) - sequence(b) ||
      String(a.no).localeCompare(String(b.no))
  )
}

export function journalTotals(journal) {
  let debit = 0
  let credit = 0
  for (const line of journal.lines || []) {
    debit += Number(line.debit) || 0
    credit += Number(line.credit) || 0
  }
  return { debit, credit }
}

/** Index every posted journal line for fast reporting. */
export function buildIndex(state, asOf) {
  const journals = sortedJournals(postedJournals(state, asOf))
  const totals = {}
  const linesByAccount = {}
  const arDocs = {}
  const arPays = {}
  const apDocs = {}
  const apPays = {}
  const fileReceived = {}
  const fileCredited = {}
  const fileDiscount = {}
  const fileJournals = {}
  const fileReceiptNo = {}
  let totalDebit = 0
  let totalCredit = 0

  const push = (bucket, key, row) => {
    if (!bucket[key]) bucket[key] = []
    bucket[key].push(row)
  }

  for (const journal of journals) {
    if (journal.fileId) {
      if (!fileJournals[journal.fileId]) fileJournals[journal.fileId] = []
      fileJournals[journal.fileId].push(journal.id)
      if (journal.type === 'RV') fileReceiptNo[journal.fileId] = journal.no
    }
    for (const line of journal.lines || []) {
      const debit = Number(line.debit) || 0
      const credit = Number(line.credit) || 0
      totalDebit += debit
      totalCredit += credit

      if (!totals[line.account]) totals[line.account] = { debit: 0, credit: 0 }
      totals[line.account].debit += debit
      totals[line.account].credit += credit

      if (!linesByAccount[line.account]) linesByAccount[line.account] = []
      linesByAccount[line.account].push({ line, journal })

      const partyId = line.partyId || journal.partyId || null
      const row = {
        id: journal.id,
        no: journal.no,
        date: journal.date,
        type: journal.type,
        ref: journal.ref || line.memo || journal.narration,
        narration: journal.narration,
        memo: line.memo || '',
        amount: debit || credit,
        dueDate: line.dueDate || null,
        fileId: journal.fileId || null,
        partyId,
      }

      if (line.account === AR_ACCOUNT && partyId) {
        if (debit > 0) push(arDocs, partyId, { ...row, amount: debit })
        if (credit > 0) push(arPays, partyId, { ...row, amount: credit })
      }
      if (line.account === AP_ACCOUNT && partyId) {
        if (credit > 0) push(apDocs, partyId, { ...row, amount: credit })
        if (debit > 0) push(apPays, partyId, { ...row, amount: debit })
      }
      if (journal.fileId && line.account === AR_ACCOUNT && credit > 0) {
        fileCredited[journal.fileId] = (fileCredited[journal.fileId] || 0) + credit
        fileReceived[journal.fileId] = (fileReceived[journal.fileId] || 0) + credit
      }
      if (journal.fileId && journal.type === 'RV' && line.account === '4090' && debit > 0 && line.kind === 'discount') {
        fileDiscount[journal.fileId] = (fileDiscount[journal.fileId] || 0) + debit
      }
    }
  }

  return {
    journals,
    totals,
    linesByAccount,
    arDocs,
    arPays,
    apDocs,
    apPays,
    fileReceived,
    fileCredited,
    fileDiscount,
    fileJournals,
    fileReceiptNo,
    totalDebit,
    totalCredit,
  }
}

/* ── Account balances ──────────────────────────────────────── */

export function accountBalances(state, asOf) {
  const index = buildIndex(state, asOf)
  return (state.accounts || []).map((account) => {
    const total = index.totals[account.code] || { debit: 0, credit: 0 }
    const raw = total.debit - total.credit
    return {
      ...account,
      debit: total.debit,
      credit: total.credit,
      raw,
      balance: displayAmount(account, raw),
      entries: index.linesByAccount[account.code]?.length || 0,
    }
  })
}

export function balanceOf(state, code, asOf) {
  const index = buildIndex(state, asOf)
  const total = index.totals[code]
  if (!total) return 0
  return total.debit - total.credit
}

export function cashPosition(state, asOf) {
  const index = buildIndex(state, asOf)
  return CASH_ACCOUNTS.map((code) => {
    const account = accountOf(state, code)
    const total = index.totals[code] || { debit: 0, credit: 0 }
    return {
      code,
      name: account.name,
      balance: total.debit - total.credit,
    }
  })
}

/* ── General ledger ────────────────────────────────────────── */

export function buildLedger(state, code, from, to) {
  const account = accountOf(state, code)
  const journals = sortedJournals(postedJournals(state, to))
  let openingRaw = 0
  let running = 0
  let debit = 0
  let credit = 0
  const rows = []

  for (const journal of journals) {
    for (const line of journal.lines || []) {
      if (line.account !== code) continue
      const lineDebit = Number(line.debit) || 0
      const lineCredit = Number(line.credit) || 0
      if (journal.date < from) {
        openingRaw += lineDebit - lineCredit
        continue
      }
      running += lineDebit - lineCredit
      debit += lineDebit
      credit += lineCredit
      rows.push({
        id: journal.id,
        no: journal.no,
        date: journal.date,
        type: journal.type,
        narration: line.memo || journal.narration,
        ref: journal.ref || '',
        partyId: line.partyId || journal.partyId || null,
        fileId: journal.fileId || null,
        debit: lineDebit,
        credit: lineCredit,
        balance: displayAmount(account, openingRaw + running),
      })
    }
  }

  return {
    account,
    from,
    to,
    openingRaw,
    opening: displayAmount(account, openingRaw),
    rows,
    debit,
    credit,
    closingRaw: openingRaw + running,
    closing: displayAmount(account, openingRaw + running),
    entries: rows.length,
  }
}

/* ── Trial balance ─────────────────────────────────────────── */

export function buildTrialBalance(state, asOf) {
  const index = buildIndex(state, asOf)
  const rows = []
  let debitTotal = 0
  let creditTotal = 0

  for (const account of state.accounts || []) {
    const total = index.totals[account.code]
    if (!total || (total.debit === 0 && total.credit === 0)) continue
    const closing = total.debit - total.credit
    rows.push({
      code: account.code,
      name: account.name,
      type: account.type,
      group: account.group,
      debit: total.debit,
      credit: total.credit,
      closing,
      debitBalance: Math.max(closing, 0),
      creditBalance: Math.max(-closing, 0),
    })
    debitTotal += Math.max(closing, 0)
    creditTotal += Math.max(-closing, 0)
  }

  rows.sort((a, b) => a.code.localeCompare(b.code))

  const byType = {}
  for (const row of rows) {
    if (!byType[row.type]) byType[row.type] = { type: row.type, rows: [], debit: 0, credit: 0 }
    byType[row.type].rows.push(row)
    byType[row.type].debit += row.debitBalance
    byType[row.type].credit += row.creditBalance
  }
  const groups = Object.values(byType).sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type])

  return {
    asOf,
    rows,
    groups,
    totals: {
      debit: debitTotal,
      credit: creditTotal,
      difference: debitTotal - creditTotal,
      movementDebit: index.totalDebit,
      movementCredit: index.totalCredit,
    },
    balanced: Math.abs(debitTotal - creditTotal) < 0.5,
  }
}

/* ── Profit & loss ─────────────────────────────────────────── */

export function buildProfitLoss(state, from, to) {
  const map = accountMap(state)
  const journals = postedJournals(state).filter(
    (journal) => journal.date >= from && journal.date <= to && !journal.closing
  )
  const totals = {}

  for (const journal of journals) {
    for (const line of journal.lines || []) {
      if (!totals[line.account]) totals[line.account] = { debit: 0, credit: 0 }
      totals[line.account].debit += Number(line.debit) || 0
      totals[line.account].credit += Number(line.credit) || 0
    }
  }

  const revenueRows = []
  const cogsRows = []
  const opexRows = []
  const segmentStats = SEGMENTS.reduce((acc, segment) => {
    acc[segment.id] = {
      id: segment.id,
      name: segment.name,
      short: segment.short,
      color: segment.color,
      revenue: 0,
      cost: 0,
      grossProfit: 0,
      margin: 0,
      files: 0,
    }
    return acc
  }, {})
  const segmentFiles = {}

  for (const journal of journals) {
    const segmentId = journal.segment || null
    for (const line of journal.lines || []) {
      const account = map[line.account] || ACCOUNT_BY_CODE[line.account]
      if (!account) continue
      const debit = Number(line.debit) || 0
      const credit = Number(line.credit) || 0
      const key = segmentId || account.segment || 'other'
      const target = segmentStats[key]
      if (!target) continue
      if (account.type === 'Income') target.revenue += credit - debit
      if (account.group === 'Direct Costs') target.cost += debit - credit
    }
    if (journal.fileId && segmentId) {
      if (!segmentFiles[segmentId]) segmentFiles[segmentId] = new Set()
      segmentFiles[segmentId].add(journal.fileId)
    }
  }

  for (const [code, total] of Object.entries(totals)) {
    const account = map[code] || ACCOUNT_BY_CODE[code]
    if (!account) continue
    const amount = account.type === 'Income' ? total.credit - total.debit : total.debit - total.credit
    if (Math.abs(amount) < 0.5) continue
    const row = {
      code,
      name: account.name,
      type: account.type,
      group: account.group,
      segment: account.segment || null,
      amount,
    }
    if (account.type === 'Income') revenueRows.push(row)
    else if (account.group === 'Direct Costs') cogsRows.push(row)
    else if (account.group === 'Operating Expenses') opexRows.push(row)
  }

  const sortRows = (rows) => rows.sort((a, b) => a.code.localeCompare(b.code))
  sortRows(revenueRows)
  sortRows(cogsRows)
  sortRows(opexRows)

  const totalRevenue = revenueRows.reduce((sum, row) => sum + row.amount, 0)
  const totalCogs = cogsRows.reduce((sum, row) => sum + row.amount, 0)
  const totalOpex = opexRows.reduce((sum, row) => sum + row.amount, 0)
  const grossProfit = totalRevenue - totalCogs
  const netProfit = grossProfit - totalOpex

  const segments = Object.values(segmentStats)
    .map((segment) => {
      const gross = segment.revenue - segment.cost
      return {
        ...segment,
        grossProfit: gross,
        margin: segment.revenue > 0 ? (gross / segment.revenue) * 100 : 0,
        files: segmentFiles[segment.id]?.size || 0,
        share: totalRevenue > 0 ? (segment.revenue / totalRevenue) * 100 : 0,
      }
    })
    .filter((segment) => segment.revenue !== 0 || segment.cost !== 0 || segment.files > 0)

  return {
    from,
    to,
    revenueRows,
    cogsRows,
    opexRows,
    totalRevenue,
    totalCogs,
    grossProfit,
    grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
    totalOpex,
    netProfit,
    netMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
    segments,
    entryCount: journals.length,
  }
}

/* ── Balance sheet ─────────────────────────────────────────── */

export function buildBalanceSheet(state, asOf) {
  const index = buildIndex(state, asOf)
  const value = (code) => {
    const total = index.totals[code]
    return total ? total.debit - total.credit : 0
  }

  const assetRows = []
  const liabilityRows = []
  const equityRows = []

  for (const account of state.accounts || []) {
    if (!index.totals[account.code]) continue
    const raw = value(account.code)
    const row = {
      code: account.code,
      name: account.name,
      group: account.group,
      type: account.type,
      contra: Boolean(account.contra),
      amount: account.type === 'Asset' ? raw : -raw,
    }
    if (account.type === 'Asset') assetRows.push(row)
    else if (account.type === 'Liability') liabilityRows.push(row)
    else if (account.type === 'Equity') equityRows.push(row)
  }

  assetRows.sort((a, b) => a.code.localeCompare(b.code))
  liabilityRows.sort((a, b) => a.code.localeCompare(b.code))
  equityRows.sort((a, b) => a.code.localeCompare(b.code))

  const totalAssets = assetRows.reduce((sum, row) => sum + row.amount, 0)
  const totalLiabilities = liabilityRows.reduce((sum, row) => sum + row.amount, 0)
  const capitalEquity = equityRows.reduce((sum, row) => sum + row.amount, 0)

  const asOfYear = Number(String(asOf).slice(0, 4))
  const yearStart = `${asOfYear}-01-01`
  const currentYear = buildProfitLoss(state, yearStart, asOf)
  const closingExists = postedJournals(state, asOf).some(
    (journal) => journal.closing && journal.date >= yearStart && journal.date <= asOf
  )
  const netProfit = closingExists ? 0 : currentYear.netProfit

  const totalEquity = capitalEquity + netProfit
  const difference = totalAssets - totalLiabilities - totalEquity

  const groupRows = (rows) => {
    const groups = {}
    for (const row of rows) {
      if (!groups[row.group]) groups[row.group] = { group: row.group, rows: [], total: 0 }
      groups[row.group].rows.push(row)
      groups[row.group].total += row.amount
    }
    return Object.values(groups)
  }

  return {
    asOf,
    assetRows,
    liabilityRows,
    equityRows,
    assetGroups: groupRows(assetRows),
    liabilityGroups: groupRows(liabilityRows),
    equityGroups: groupRows(equityRows),
    totalAssets,
    totalLiabilities,
    capitalEquity,
    netProfit,
    totalEquity,
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    difference,
    balanced: Math.abs(difference) < 0.5,
    currentYear,
  }
}

/* ── Receivables / payables with ageing ────────────────────── */

const BUCKET_KEYS = AGING_BUCKETS.map((bucket) => bucket.key)

function emptyBuckets() {
  return BUCKET_KEYS.reduce((acc, key) => {
    acc[key] = 0
    return acc
  }, {})
}

function allocateDocuments(docs, payments) {
  const sequence = (doc) => {
    const numeric = Number(String(doc.id || '').replace(/\D/g, ''))
    return Number.isFinite(numeric) ? numeric : 0
  }
  const sorted = [...docs].sort(
    (a, b) =>
      a.date.localeCompare(b.date) || sequence(a) - sequence(b) || a.no.localeCompare(b.no)
  )
  let pool = payments.reduce((sum, payment) => sum + payment.amount, 0)
  return sorted.map((doc) => {
    const applied = Math.max(0, Math.min(pool, doc.amount))
    pool -= applied
    return { ...doc, applied, open: Math.max(0, doc.amount - applied) }
  })
}

function bucketDocs(docs, asOf) {
  const buckets = emptyBuckets()
  let overdue = 0
  let oldestDays = 0
  for (const doc of docs) {
    if (doc.open <= 0) continue
    const dueDate = doc.dueDate || addDays(doc.date, 15)
    const lateDays = daysBetween(dueDate, asOf)
    let key = 'current'
    if (lateDays > 90) key = 'd90_plus'
    else if (lateDays > 60) key = 'd61_90'
    else if (lateDays > 30) key = 'd31_60'
    else if (lateDays > 0) key = 'd1_30'
    buckets[key] += doc.open
    if (lateDays > 0) {
      overdue += doc.open
      oldestDays = Math.max(oldestDays, lateDays)
    }
  }
  return { buckets, overdue, oldestDays }
}

function partyRows(state, { kind, asOf }) {
  const index = buildIndex(state, asOf)
  const isVendor = kind === 'Vendor'
  const docsByParty = isVendor ? index.apDocs : index.arDocs
  const paysByParty = isVendor ? index.apPays : index.arPays

  const parties = (state.parties || []).filter((party) => {
    if (kind === 'Vendor') return party.type === 'Vendor'
    if (kind === 'all') return party.type === 'B2C' || party.type === 'B2B'
    return party.type === kind
  })

  const rows = []
  const aging = emptyBuckets()

  for (const party of parties) {
    const docs = docsByParty[party.id] || []
    const pays = paysByParty[party.id] || []
    if (!docs.length && !pays.length) continue

    const allocated = allocateDocuments(docs, pays)
    const invoiced = docs.reduce((sum, doc) => sum + doc.amount, 0)
    const collected = pays.reduce((sum, payment) => sum + payment.amount, 0)
    const due = allocated.reduce((sum, doc) => sum + doc.open, 0)
    const { buckets, overdue, oldestDays } = bucketDocs(allocated, asOf)

    BUCKET_KEYS.forEach((key) => {
      aging[key] += buckets[key]
    })

    let status = 'Unpaid'
    if (due <= 0.5) status = 'Paid'
    else if (overdue > 0) status = 'Overdue'
    else if (collected > 0) status = 'Partial'

    const lastPayment = [...pays].sort((a, b) => b.date.localeCompare(a.date))[0]

    rows.push({
      ...party,
      invoices: docs.length,
      invoiced,
      collected,
      due,
      overdue,
      oldestDays,
      buckets,
      status,
      lastPaymentDate: lastPayment?.date || null,
      creditUsed: party.creditLimit > 0 ? (due / party.creditLimit) * 100 : 0,
    })
  }

  rows.sort((a, b) => b.due - a.due || b.overdue - a.overdue)

  const summary = {
    count: rows.length,
    invoiced: rows.reduce((sum, row) => sum + row.invoiced, 0),
    collected: rows.reduce((sum, row) => sum + row.collected, 0),
    due: rows.reduce((sum, row) => sum + row.due, 0),
    overdue: rows.reduce((sum, row) => sum + row.overdue, 0),
    creditLimit: rows.reduce((sum, row) => sum + (row.creditLimit || 0), 0),
  }

  return {
    kind,
    asOf,
    parties: rows,
    summary,
    aging: AGING_BUCKETS.map((bucket) => ({
      ...bucket,
      amount: aging[bucket.key] || 0,
      count: rows.filter((row) => (row.buckets[bucket.key] || 0) > 0).length,
    })),
    totalAging: Object.values(aging).reduce((sum, amount) => sum + amount, 0),
  }
}

export function buildReceivables(state, asOf) {
  return partyRows(state, { kind: 'all', asOf })
}

export function buildReceivableByKind(state, kind, asOf) {
  return partyRows(state, { kind, asOf })
}

export function buildPayables(state, asOf) {
  return partyRows(state, { kind: 'Vendor', asOf })
}

export function buildPartyStatement(state, partyId, asOf) {
  const party = (state.parties || []).find((row) => row.id === partyId)
  if (!party) return null
  const code = party.type === 'Vendor' ? AP_ACCOUNT : AR_ACCOUNT
  const account = accountOf(state, code)
  const journals = sortedJournals(postedJournals(state, asOf))
  const rows = []
  let raw = 0
  let debit = 0
  let credit = 0

  for (const journal of journals) {
    for (const line of journal.lines || []) {
      if (line.account !== code) continue
      const partyOfLine = line.partyId || journal.partyId
      if (partyOfLine !== partyId) continue
      const lineDebit = Number(line.debit) || 0
      const lineCredit = Number(line.credit) || 0
      raw += lineDebit - lineCredit
      debit += lineDebit
      credit += lineCredit
      rows.push({
        id: journal.id,
        no: journal.no,
        date: journal.date,
        type: journal.type,
        narration: line.memo || journal.narration,
        ref: journal.ref || '',
        fileId: journal.fileId || null,
        debit: lineDebit,
        credit: lineCredit,
        balance: displayAmount(account, raw),
      })
    }
  }

  return {
    party,
    account,
    asOf,
    rows,
    debit,
    credit,
    closing: displayAmount(account, raw),
  }
}

/* ── Operating files (job costing) ─────────────────────────── */

export function fileFinancials(state, file, index) {
  const costs = file.costs || []
  const cost = costs.reduce((sum, line) => sum + (Number(line.amount) || 0), 0)
  const sale = Number(file.sale) || 0
  const profit = sale - cost
  const credited = index?.fileCredited?.[file.id] || index?.fileReceived?.[file.id] || 0
  const discount = index?.fileDiscount?.[file.id] || 0
  const received = Math.max(0, credited - discount)
  const due = Math.max(0, sale - credited)

  let paymentStatus = 'Unpaid'
  if (due <= 0.5) paymentStatus = 'Paid'
  else if (received > 0) paymentStatus = 'Partial'

  return {
    sale,
    cost,
    profit,
    margin: sale > 0 ? (profit / sale) * 100 : 0,
    received,
    due,
    paymentStatus,
    costLines: costs,
    journals: index?.fileJournals?.[file.id] || [],
  }
}

export function buildFiles(state, filters = {}) {
  const index = buildIndex(state)
  const { type, status, from, to, search, segment, category } = filters
  const query = String(search || '').trim().toLowerCase()
  const categoryLabel = (file) =>
    file.category ||
    { Visa: 'Visa', Tour: 'Tour Package', 'Air Ticket': 'Air Ticket', Hotel: 'Hotel', Transport: 'Transport' }[
      file.type
    ] ||
    file.type

  const rows = []
  for (const file of state.files || []) {
    if (file.isDeleted) continue
    if (type && type !== 'all' && file.type !== type) continue
    if (segment && file.segment !== segment) continue
    if (category && category !== 'all' && categoryLabel(file) !== category) continue
    if (status && status !== 'all' && file.status !== status) continue
    if (from && file.date < from) continue
    if (to && file.date > to) continue
    const party = (state.parties || []).find((row) => row.id === file.partyId)
    if (query) {
      const haystack = [
        file.fileNo,
        file.applicant,
        file.destination,
        file.detail,
        file.passportNo,
        file.partyName,
        party?.phone,
        file.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(query)) continue
    }
    rows.push({
      ...file,
      category: categoryLabel(file),
      receiptNo: index.fileReceiptNo?.[file.id] || '',
      partyPhone: party?.phone || '',
      issueDate: file.issueDate || file.date,
      salesBy: file.salesBy || 'Admin',
      createdBy: file.createdBy || 'ABL Travel',
      ...fileFinancials(state, file, index),
    })
  }

  rows.sort((a, b) => b.date.localeCompare(a.date) || b.fileNo.localeCompare(a.fileNo))

  const totalSale = rows.reduce((sum, row) => sum + row.sale, 0)
  const totalCost = rows.reduce((sum, row) => sum + row.cost, 0)
  const totalProfit = totalSale - totalCost
  const totalReceived = rows.reduce((sum, row) => sum + row.received, 0)
  const totalDue = rows.reduce((sum, row) => sum + row.due, 0)

  return {
    rows,
    summary: {
      count: rows.length,
      sale: totalSale,
      cost: totalCost,
      profit: totalProfit,
      margin: totalSale > 0 ? (totalProfit / totalSale) * 100 : 0,
      received: totalReceived,
      due: totalDue,
      averageTicket: rows.length ? totalSale / rows.length : 0,
    },
  }
}

export function fileSummaryByType(state, from, to) {
  const { rows } = buildFiles(state, { from, to })
  const byType = {}
  for (const row of rows) {
    if (!byType[row.type]) {
      byType[row.type] = { type: row.type, segment: row.segment, count: 0, sale: 0, cost: 0, profit: 0, due: 0 }
    }
    const bucket = byType[row.type]
    bucket.count += 1
    bucket.sale += row.sale
    bucket.cost += row.cost
    bucket.profit += row.profit
    bucket.due += row.due
  }
  return Object.values(byType)
}

/* ── Segment analysis ──────────────────────────────────────── */

export function buildSegmentReport(state, from, to) {
  const pl = buildProfitLoss(state, from, to)
  const { rows } = buildFiles(state, { from, to })
  const fileCounts = {}
  for (const row of rows) {
    fileCounts[row.segment] = (fileCounts[row.segment] || 0) + 1
  }

  const segments = SEGMENTS.map((segment) => {
    const stats = pl.segments.find((row) => row.id === segment.id) || {
      revenue: 0,
      cost: 0,
      grossProfit: 0,
      margin: 0,
    }
    return {
      ...segment,
      revenue: stats.revenue,
      cost: stats.cost,
      grossProfit: stats.grossProfit,
      margin: stats.margin,
      share: stats.share || 0,
      files: fileCounts[segment.id] || stats.files || 0,
    }
  })

  // Six-month trend per segment
  const endDate = new Date(`${to}T00:00:00`)
  const monthly = []
  for (let i = 5; i >= 0; i -= 1) {
    const start = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    const monthFrom = firstOfMonth(start.getFullYear(), start.getMonth())
    const monthTo = isoDate(end)
    const window = monthTo > to ? to : monthTo
    const monthPl = buildProfitLoss(state, monthFrom, window)
    const row = {
      label: MONTHS_SHORT[start.getMonth()],
      month: start.getMonth(),
      year: start.getFullYear(),
    }
    for (const segment of SEGMENTS) {
      const stats = monthPl.segments.find((entry) => entry.id === segment.id)
      row[segment.id] = stats?.revenue || 0
    }
    monthly.push(row)
  }

  return {
    from,
    to,
    segments,
    monthly,
    totals: {
      revenue: pl.totalRevenue,
      cost: pl.totalCogs,
      grossProfit: pl.grossProfit,
      grossMargin: pl.grossMargin,
      files: rows.length,
    },
  }
}

/* ── Monthly performance ───────────────────────────────────── */

export function buildMonthly(state, year, now = new Date()) {
  const index = buildIndex(state)
  const rows = []
  const fileCounts = {}
  const collectionByMonth = {}
  const paymentByMonth = {}

  for (const file of state.files || []) {
    const key = file.date.slice(0, 7)
    fileCounts[key] = (fileCounts[key] || 0) + 1
  }
  for (const journal of index.journals) {
    const key = journal.date.slice(0, 7)
    for (const line of journal.lines || []) {
      if (line.account === AR_ACCOUNT && Number(line.credit) > 0) {
        collectionByMonth[key] = (collectionByMonth[key] || 0) + Number(line.credit)
      }
      if (line.account === AP_ACCOUNT && Number(line.debit) > 0) {
        paymentByMonth[key] = (paymentByMonth[key] || 0) + Number(line.debit)
      }
    }
  }

  for (let month = 0; month < 12; month += 1) {
    const window = monthWindow(year, month, now)
    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    const hasStarted = window.from <= window.to
    const pl = hasStarted
      ? buildProfitLoss(state, window.from, window.to)
      : { totalRevenue: 0, totalCogs: 0, totalOpex: 0, grossProfit: 0, netProfit: 0, netMargin: 0 }
    rows.push({
      month,
      monthName: MONTHS_SHORT[month],
      key,
      from: window.from,
      to: window.to,
      isCurrent: month === now.getMonth() && year === now.getFullYear(),
      revenue: pl.totalRevenue,
      cogs: pl.totalCogs,
      opex: pl.totalOpex,
      grossProfit: pl.grossProfit,
      netProfit: pl.netProfit,
      margin: pl.netMargin,
      files: fileCounts[key] || 0,
      collections: collectionByMonth[key] || 0,
      payments: paymentByMonth[key] || 0,
    })
  }

  const totals = rows.reduce(
    (acc, row) => {
      acc.revenue += row.revenue
      acc.cogs += row.cogs
      acc.opex += row.opex
      acc.grossProfit += row.grossProfit
      acc.netProfit += row.netProfit
      acc.files += row.files
      acc.collections += row.collections
      acc.payments += row.payments
      return acc
    },
    { revenue: 0, cogs: 0, opex: 0, grossProfit: 0, netProfit: 0, files: 0, collections: 0, payments: 0 }
  )
  totals.margin = totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0

  const availableYears = [...new Set((state.journals || []).map((journal) => Number(journal.date.slice(0, 4))))]
  availableYears.sort((a, b) => b - a)

  return { year, rows, totals, availableYears }
}

/* ── Dashboard aggregate ───────────────────────────────────── */

export function buildDashboard(state, { year, month, now = new Date() }) {
  const window = monthWindow(year, month, now)
  const asOf = window.to
  const pl = buildProfitLoss(state, window.from, window.to)
  const previousRange = previousMonthToDate(window.from, window.to)
  const previous = buildProfitLoss(state, previousRange.from, previousRange.to)

  const receivables = buildReceivables(state, asOf)
  const payables = buildPayables(state, asOf)
  const cash = cashPosition(state, asOf)
  const balanceSheet = buildBalanceSheet(state, asOf)
  const index = buildIndex(state, asOf)

  const series = []
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(year, month - i, 1)
    const w = monthWindow(date.getFullYear(), date.getMonth(), now)
    const monthPl = buildProfitLoss(state, w.from, w.to)
    series.push({
      label: MONTHS_SHORT[date.getMonth()],
      month: date.getMonth(),
      year: date.getFullYear(),
      revenue: monthPl.totalRevenue,
      cost: monthPl.totalCogs + monthPl.totalOpex,
      cogs: monthPl.totalCogs,
      opex: monthPl.totalOpex,
      profit: monthPl.netProfit,
    })
  }

  let collections = 0
  for (const journal of postedJournals(state)) {
    if (journal.date < window.from || journal.date > window.to) continue
    for (const line of journal.lines || []) {
      if (line.account === AR_ACCOUNT && Number(line.credit) > 0) collections += Number(line.credit)
    }
  }

  const files = buildFiles(state, { from: window.from, to: window.to })
  const openFiles = (state.files || [])
    .filter((file) => file.status !== 'Completed' && file.status !== 'Cancelled')
    .map((file) => ({ ...file, ...fileFinancials(state, file, index) }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)

  const recentJournals = index.journals.slice(-8).reverse().map((journal) => ({
    ...journal,
    ...journalTotals(journal),
  }))

  const ytd = buildProfitLoss(state, `${year}-01-01`, asOf)

  return {
    year,
    month,
    asOf,
    from: window.from,
    to: window.to,
    pl,
    previous,
    previousRange,
    ytd,
    kpis: {
      revenue: pl.totalRevenue,
      cogs: pl.totalCogs,
      grossProfit: pl.grossProfit,
      grossMargin: pl.grossMargin,
      opex: pl.totalOpex,
      netProfit: pl.netProfit,
      netMargin: pl.netMargin,
      collections,
      receivables: receivables.summary.due,
      overdue: receivables.summary.overdue,
      payables: payables.summary.due,
      cash: cash.reduce((sum, row) => sum + row.balance, 0),
      equity: balanceSheet.totalEquity,
      files: files.summary.count,
      fileValue: files.summary.sale,
    },
    cash,
    receivables,
    payables,
    balanceSheet,
    series,
    segments: pl.segments,
    aging: receivables.aging,
    topReceivables: receivables.parties.slice(0, 5),
    topPayables: payables.parties.slice(0, 5),
    recentJournals,
    openFiles,
    counts: {
      journals: (state.journals || []).length,
      files: (state.files || []).length,
      parties: (state.parties || []).length,
      accounts: (state.accounts || []).length,
    },
  }
}

/* ── Journal list helper ───────────────────────────────────── */

export function filterJournals(state, { search, type, segment, from, to, status } = {}) {
  const query = String(search || '').trim().toLowerCase()
  return sortedJournals(state.journals || [])
    .filter((journal) => {
      if (status && status !== 'all' && journal.status !== status) return false
      if (type && type !== 'all' && journal.type !== type) return false
      if (segment && segment !== 'all' && journal.segment !== segment) return false
      if (from && journal.date < from) return false
      if (to && journal.date > to) return false
      if (query) {
        const party = (state.parties || []).find((row) => row.id === journal.partyId)
        const file = (state.files || []).find((row) => row.id === journal.fileId)
        const haystack = [
          journal.no,
          journal.narration,
          journal.ref,
          journal.type,
          party?.name,
          file?.fileNo,
          file?.applicant,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
    .reverse()
    .map((journal) => ({
      ...journal,
      ...journalTotals(journal),
      partyName: (state.parties || []).find((row) => row.id === journal.partyId)?.name || null,
      fileNo: (state.files || []).find((row) => row.id === journal.fileId)?.fileNo || null,
    }))
}

/** Segments ordered for dropdowns. */
export function segmentOptions() {
  return SEGMENTS.map((segment) => ({
    value: segment.id,
    label: segment.name,
    color: segment.color,
  }))
}

export function segmentLabel(id) {
  return SEGMENT_BY_ID[id]?.name || 'General'
}

export function fileTypeLabel(type) {
  return type || '—'
}
