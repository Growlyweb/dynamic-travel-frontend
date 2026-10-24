/**
 * Accounting data API for the reports module.
 *
 * All reads derive from the double-entry journal through the engine; writes
 * clone the stored state, post balanced journals and persist atomically.
 */

import { exportToCsv, exportToExcel } from '@/utils/exportEngine'
import {
  ACCOUNTS,
  ACCOUNT_TYPES,
  AGING_BUCKETS,
  AP_ACCOUNT,
  AR_ACCOUNT,
  COMPANY,
  FILE_TYPES,
  GROUP_ORDER,
  SEGMENTS,
  methodAccount,
} from './accounting/coa'
import {
  MONTH_NAMES,
  addDays,
  formatDateShort,
  priorYearWindow,
  todayISO,
} from './accounting/dates'
import {
  accountBalances,
  buildBalanceSheet,
  buildDashboard,
  buildFiles,
  buildIndex,
  buildLedger,
  buildMonthly,
  buildPartyStatement,
  buildPayables,
  buildProfitLoss,
  buildReceivableByKind,
  buildReceivables,
  buildSegmentReport,
  buildTrialBalance,
  fileFinancials,
  filterJournals,
  journalTotals,
} from './accounting/engine'
import { nextFileNo, postJournal } from './accounting/posting'
import { loadState, resetState, saveState } from './accounting/storage'

export { MONTH_NAMES, COMPANY, ACCOUNTS, ACCOUNT_TYPES, GROUP_ORDER, SEGMENTS, AGING_BUCKETS, FILE_TYPES }

/* ── Formatting helpers ────────────────────────────────────── */

export const formatMoney = (value) => {
  const num = Number(value) || 0
  const sign = num < 0 ? '−' : ''
  return `${Math.abs(Math.round(num)).toLocaleString('en-IN')}`
}

export const formatMoneyExact = (value) => {
  const num = Number(value) || 0
  const sign = num < 0 ? '−' : ''
  return `${sign}৳${Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const formatNumber = (value) => {
  const num = Number(value) || 0
  return num.toLocaleString('en-IN')
}

export const formatPct = (value, digits = 1) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  return `${num.toFixed(digits)}%`
}

export const formatPercentVal = (part, total) => {
  const denominator = Number(total) || 0
  if (!denominator) return '0.0%'
  return `${((Number(part) || 0) / denominator * 100).toFixed(1)}%`
}

/** Compact BDT for chart axes / tight table cells. */
export const formatCompact = (value) => {
  const num = Number(value) || 0
  const sign = num < 0 ? '−' : ''
  const abs = Math.abs(num)
  if (abs >= 10000000) return `${sign}৳${(abs / 10000000).toFixed(2)}Cr`
  if (abs >= 100000) return `${sign}৳${(abs / 100000).toFixed(1)}L`
  if (abs >= 1000) return `${sign}৳${Math.round(abs / 1000)}k`
  return `${sign}৳${Math.round(abs)}`
}

export const formatDate = formatDateShort

export const PALETTE = SEGMENTS.map((segment) => segment.color)

/* ── Internal helpers ──────────────────────────────────────── */

const clone = (value) => {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

const round = (value) => Math.round(Number(value) || 0)

const DEFAULT_VENDOR_BY_SEGMENT = {
  visa: 'Visa Processing Services Ltd.',
  tour: 'Siam DMC Co. Ltd.',
  air: 'Thai Airways (GSA)',
  hotel: 'Bangkok Hospitality Group',
  transport: 'Dhaka Car Rental',
  other: 'Visa Processing Services Ltd.',
}

function defaultVendor(state, segment) {
  const preferred = DEFAULT_VENDOR_BY_SEGMENT[segment]
  return (
    state.parties.find((party) => party.type === 'Vendor' && party.name === preferred) ||
    state.parties.find((party) => party.type === 'Vendor')
  )
}

function addPartyToState(state, { type = 'B2C', name, phone, email, address, creditLimit = 0 }) {
  const prefix = type === 'Vendor' ? 'V' : type === 'B2B' ? 'A' : 'C'
  const maxSequence = (state.parties || [])
    .filter((party) => String(party.code).startsWith(`${prefix}-`))
    .reduce((max, party) => Math.max(max, Number(String(party.code).split('-')[1]) || 0), 0)
  const sequence = maxSequence + 1
  const party = {
    id: `${prefix.toLowerCase()}_${String(sequence).padStart(2, '0')}`,
    code: `${prefix}-${String(sequence).padStart(4, '0')}`,
    type,
    name: name.trim(),
    phone: phone?.trim() || '—',
    email: email?.trim() || '',
    address: address?.trim() || 'Dhaka, Bangladesh',
    creditLimit: Math.max(0, round(creditLimit)),
    active: true,
    since: todayISO(),
  }
  state.parties.push(party)
  return party
}

function attachNames(state, rows) {
  return rows.map((row) => ({
    ...row,
    partyName: row.partyId
      ? state.parties.find((party) => party.id === row.partyId)?.name || null
      : null,
    fileNo: row.fileId
      ? state.files.find((file) => file.id === row.fileId)?.fileNo || null
      : null,
  }))
}

/* ── Public API ────────────────────────────────────────────── */

export const reportsApi = {
  async resetToDefaultData() {
    resetState()
    return { success: true }
  },

  /* Dashboard ------------------------------------------------ */

  async getDashboard({ year, month } = {}) {
    const state = loadState()
    const now = new Date()
    const data = buildDashboard(state, {
      year: year ?? now.getFullYear(),
      month: month ?? now.getMonth(),
      now,
    })
    return { success: true, data }
  },

  /* Journal vouchers ---------------------------------------- */

  async getJournals(filters = {}) {
    const state = loadState()
    const rows = filterJournals(state, filters).map((journal) => ({
      ...journal,
      segmentName: SEGMENTS.find((segment) => segment.id === journal.segment)?.name || 'General',
    }))
    const summary = {
      count: rows.length,
      debit: rows.filter((row) => row.status !== 'void').reduce((sum, row) => sum + row.debit, 0),
      credit: rows.filter((row) => row.status !== 'void').reduce((sum, row) => sum + row.credit, 0),
    }
    return { success: true, data: { rows, summary } }
  },

  async getJournal(id) {
    const state = loadState()
    const journal = (state.journals || []).find((row) => row.id === id)
    if (!journal) throw new Error('Voucher not found.')
    const accountMap = (state.accounts || []).reduce((map, account) => {
      map[account.code] = account
      return map
    }, {})
    return {
      success: true,
      data: {
        ...journal,
        ...journalTotals(journal),
        partyName: state.parties.find((party) => party.id === journal.partyId)?.name || null,
        fileNo: state.files.find((file) => file.id === journal.fileId)?.fileNo || null,
        segmentName: SEGMENTS.find((segment) => segment.id === journal.segment)?.name || 'General',
        lines: journal.lines.map((line) => ({
          ...line,
          accountName: accountMap[line.account]?.name || line.account,
          accountType: accountMap[line.account]?.type || '—',
          partyName: line.partyId
            ? state.parties.find((party) => party.id === line.partyId)?.name || null
            : null,
        })),
      },
    }
  },

  async createJournal(payload) {
    const state = clone(loadState())
    const journal = postJournal(state, {
      date: payload.date,
      type: payload.type || 'JV',
      narration: payload.narration,
      segment: payload.segment || null,
      partyId: payload.partyId || null,
      fileId: payload.fileId || null,
      ref: payload.ref,
      lines: (payload.lines || []).map((line) => ({
        ...line,
        partyId: line.partyId || (line.account === AR_ACCOUNT || line.account === AP_ACCOUNT ? payload.partyId : null),
      })),
    })
    saveState(state)
    return { success: true, data: journal }
  },

  async voidJournal(id) {
    const state = clone(loadState())
    const journal = (state.journals || []).find((row) => row.id === id)
    if (!journal) throw new Error('Voucher not found.')
    if (journal.status === 'void') throw new Error('This voucher is already void.')
    if (journal.closing) throw new Error('Year-end closing vouchers cannot be voided.')
    if (journal.fileId) {
      throw new Error('This voucher belongs to a service file. Cancel the file from Visa & Tour Files instead.')
    }
    journal.status = 'void'
    journal.voidedAt = new Date().toISOString()
    saveState(state)
    return { success: true }
  },

  /* Chart of accounts --------------------------------------- */

  async getChartOfAccounts(asOf = todayISO()) {
    const state = loadState()
    const rows = accountBalances(state, asOf)
    const byType = ACCOUNT_TYPES.map((type) => ({
      type,
      rows: rows.filter((row) => row.type === type),
    }))
    const totals = rows.reduce((acc, row) => {
      if (row.type === 'Asset') acc.assets += row.balance
      if (row.type === 'Liability') acc.liabilities += row.balance
      if (row.type === 'Equity') acc.equity += row.balance
      if (row.type === 'Income') acc.income += row.balance
      if (row.type === 'Expense') acc.expenses += row.balance
      return acc
    }, { assets: 0, liabilities: 0, equity: 0, income: 0, expenses: 0 })
    return { success: true, data: { asOf, rows, byType, totals } }
  },

  async addAccount({ code, name, type, group }) {
    const state = clone(loadState())
    const trimmedCode = String(code || '').trim()
    const trimmedName = String(name || '').trim()
    if (!/^[0-9]{3,5}$/.test(trimmedCode)) throw new Error('Account code must be 3–5 digits.')
    if (!trimmedName) throw new Error('Account name is required.')
    if (!ACCOUNT_TYPES.includes(type)) throw new Error('Choose a valid account type.')
    if ((state.accounts || []).some((account) => account.code === trimmedCode)) {
      throw new Error(`Account code ${trimmedCode} already exists.`)
    }
    const defaultGroup = {
      Asset: 'Current Assets',
      Liability: 'Current Liabilities',
      Equity: 'Capital & Partners',
      Income: 'Operating Revenue',
      Expense: 'Operating Expenses',
    }[type]
    state.accounts = [
      ...(state.accounts || []),
      { code: trimmedCode, name: trimmedName, type, group: group || defaultGroup, custom: true },
    ]
    saveState(state)
    return { success: true, data: state.accounts[state.accounts.length - 1] }
  },

  /* Ledger & statements ------------------------------------- */

  async getLedger({ code, from, to }) {
    const state = loadState()
    if (!code) throw new Error('Choose an account to view its ledger.')
    const ledger = buildLedger(state, code, from, to)
    return {
      success: true,
      data: {
        ...ledger,
        rows: attachNames(state, ledger.rows),
      },
    }
  },

  async getTrialBalance(asOf = todayISO()) {
    const state = loadState()
    return { success: true, data: buildTrialBalance(state, asOf) }
  },

  async getProfitLoss(from, to) {
    const state = loadState()
    const pl = buildProfitLoss(state, from, to)
    const range = priorYearWindow(from, to)
    const previous = buildProfitLoss(state, range.from, range.to)
    return { success: true, data: { ...pl, previous, previousRange: range } }
  },

  async getBalanceSheet(asOf = todayISO()) {
    const state = loadState()
    return { success: true, data: buildBalanceSheet(state, asOf) }
  },

  /* Parties & sub-ledgers ----------------------------------- */

  async getParties(type) {
    const state = loadState()
    const parties = (state.parties || []).filter((party) => !type || party.type === type)
    return { success: true, data: parties }
  },

  async getReceivables(kind = 'all', asOf = todayISO()) {
    const state = loadState()
    const data = kind === 'all'
      ? buildReceivables(state, asOf)
      : buildReceivableByKind(state, kind, asOf)
    return { success: true, data }
  },

  async getPayables(asOf = todayISO()) {
    const state = loadState()
    return { success: true, data: buildPayables(state, asOf) }
  },

  async getPartyStatement(partyId, asOf = todayISO()) {
    const state = loadState()
    const statement = buildPartyStatement(state, partyId, asOf)
    if (!statement) throw new Error('Party not found.')
    return { success: true, data: statement }
  },

  async addParty(payload) {
    const state = clone(loadState())
    const name = String(payload.name || '').trim()
    if (!name) throw new Error('Name is required.')
    if (!['B2C', 'B2B', 'Vendor'].includes(payload.type)) throw new Error('Choose a valid party type.')
    const party = addPartyToState(state, {
      type: payload.type,
      name,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      creditLimit: payload.creditLimit,
    })
    saveState(state)
    return { success: true, data: party }
  },

  async createReceipt({ date, partyId, amount, method = 'city', fileId, ref, narration }) {
    const state = clone(loadState())
    const party = state.parties.find((row) => row.id === partyId)
    if (!party) throw new Error('Select the client or agent receiving the payment.')
    const value = round(amount)
    if (value <= 0) throw new Error('Receipt amount must be greater than zero.')
    const file = fileId ? state.files.find((row) => row.id === fileId) : null
    if (file && file.partyId !== party.id) {
      throw new Error('The selected file belongs to a different client.')
    }

    const journal = postJournal(state, {
      date,
      type: 'RV',
      narration: narration?.trim() || `Payment received — ${party.name}`,
      segment: file?.segment || null,
      partyId: party.id,
      fileId: file?.id || null,
      ref: ref?.trim() || file?.fileNo || '',
      lines: [
        { account: methodAccount(method), debit: value, memo: `Received from ${party.name}` },
        { account: AR_ACCOUNT, credit: value, partyId: party.id, memo: file?.fileNo || 'On account' },
      ],
    })
    saveState(state)
    return { success: true, data: journal }
  },

  async createPayment({ date, vendorId, amount, method = 'city', ref, narration }) {
    const state = clone(loadState())
    const vendor = state.parties.find((row) => row.id === vendorId)
    if (!vendor) throw new Error('Select the supplier being paid.')
    const value = round(amount)
    if (value <= 0) throw new Error('Payment amount must be greater than zero.')

    const journal = postJournal(state, {
      date,
      type: 'PV',
      narration: narration?.trim() || `Supplier payment — ${vendor.name}`,
      segment: null,
      partyId: vendor.id,
      ref: ref?.trim() || '',
      lines: [
        { account: AP_ACCOUNT, debit: value, partyId: vendor.id, memo: vendor.name },
        { account: methodAccount(method), credit: value, memo: 'Bank payment' },
      ],
    })
    saveState(state)
    return { success: true, data: journal }
  },

  /* Operating files ----------------------------------------- */

  async getFiles(filters = {}) {
    const state = loadState()
    return { success: true, data: buildFiles(state, filters) }
  },

  async getFile(id) {
    const state = loadState()
    const file = (state.files || []).find((row) => row.id === id)
    if (!file) throw new Error('File not found.')
    const index = buildIndex(state)
    const accountMap = (state.accounts || []).reduce((map, account) => {
      map[account.code] = account
      return map
    }, {})
    const journals = (state.journals || [])
      .filter((journal) => journal.fileId === id && journal.status !== 'void')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((journal) => ({
        ...journal,
        ...journalTotals(journal),
        lines: journal.lines.map((line) => ({
          ...line,
          accountName: accountMap[line.account]?.name || line.account,
          partyName: line.partyId
            ? state.parties.find((party) => party.id === line.partyId)?.name || null
            : null,
        })),
      }))
    return {
      success: true,
      data: {
        ...file,
        ...fileFinancials(state, file, index),
        journals,
        party: state.parties.find((party) => party.id === file.partyId) || null,
      },
    }
  },

  async createFile(payload) {
    const state = clone(loadState())
    const meta = FILE_TYPES[payload.type]
    if (!meta) throw new Error('Choose a valid service type.')
    const date = payload.date
    if (!date) throw new Error('File date is required.')
    if (date > todayISO()) throw new Error('A file cannot be dated in the future.')

    let party = payload.partyId
      ? state.parties.find((row) => row.id === payload.partyId)
      : null
    if (!party) {
      const name = String(payload.clientName || '').trim()
      if (!name) throw new Error('Select an existing client or enter a new applicant name.')
      party = addPartyToState(state, {
        type: payload.clientType || 'B2C',
        name,
        phone: payload.clientPhone,
        creditLimit: payload.clientType === 'B2B' ? payload.creditLimit || 100000 : 0,
      })
    }

    const sale = round(payload.sale)
    if (sale <= 0) throw new Error('Sale value must be greater than zero.')
    const pax = Math.max(1, round(payload.pax) || 1)
    const costs = (payload.costs || [])
      .map((line, index) => ({
        account: line.account,
        label: String(line.label || `Cost line ${index + 1}`).trim(),
        amount: Math.max(0, round(line.amount)),
        paidVia: line.paidVia === 'bank' || line.paidVia === 'cash' ? line.paidVia : 'credit',
        vendorId: line.vendorId || null,
      }))
      .filter((line) => line.amount > 0)

    const year = date.slice(0, 4)
    state.counters.file = (state.counters.file || 0) + 1
    state.files = state.files || []
    const file = {
      id: `f${state.counters.file}`,
      fileNo: nextFileNo(state, payload.type, meta.prefix, year),
      type: payload.type,
      segment: meta.segment,
      date,
      applicant: String(payload.applicant || party.name).trim(),
      partyId: party.id,
      partyName: party.name,
      partyType: party.type,
      destination: String(payload.destination || '').trim(),
      detail: String(payload.detail || '').trim(),
      passportNo: String(payload.passportNo || '').trim(),
      pax,
      sale,
      costs,
      status: payload.status || 'Processing',
      travelDate: payload.travelDate || '',
      dueDate: addDays(date, meta.dueDays),
      notes: String(payload.notes || '').trim(),
      createdAt: new Date().toISOString(),
    }
    state.files.push(file)

    const saleJournal = postJournal(state, {
      date,
      type: 'SV',
      narration: `${file.type} sale — ${file.fileNo}`,
      segment: file.segment,
      partyId: party.id,
      fileId: file.id,
      ref: file.fileNo,
      lines: [
        {
          account: AR_ACCOUNT,
          debit: sale,
          partyId: party.id,
          dueDate: addDays(date, meta.dueDays),
          memo: [file.destination, file.detail].filter(Boolean).join(' · ') || file.type,
        },
        {
          account: meta.revenue,
          credit: sale,
          memo: `${file.applicant} — ${file.fileNo}`,
        },
      ],
    })
    file.saleJournalId = saleJournal.id

    if (costs.length > 0) {
      const debitLines = costs.map((line) => ({
        account: line.account,
        debit: line.amount,
        memo: line.label,
      }))
      const creditBuckets = new Map()
      for (const line of costs) {
        if (line.paidVia === 'credit') {
          const vendor = line.vendorId
            ? state.parties.find((partyRow) => partyRow.id === line.vendorId)
            : defaultVendor(state, file.segment)
          if (!vendor) throw new Error('No supplier is configured for this cost.')
          if (!creditBuckets.has(vendor.id)) {
            creditBuckets.set(vendor.id, {
              account: AP_ACCOUNT,
              credit: 0,
              partyId: vendor.id,
              dueDate: addDays(date, 30),
              memo: `Supplier bill — ${vendor.name}`,
            })
          }
          creditBuckets.get(vendor.id).credit += line.amount
        } else {
          const account = line.paidVia === 'cash' ? '1010' : '1020'
          const key = `cash-${account}`
          if (!creditBuckets.has(key)) {
            creditBuckets.set(key, { account, credit: 0, memo: 'Paid at booking' })
          }
          creditBuckets.get(key).credit += line.amount
        }
      }
      const costJournal = postJournal(state, {
        date,
        type: 'JV',
        narration: `Service cost — ${file.fileNo}`,
        segment: file.segment,
        partyId: party.id,
        fileId: file.id,
        ref: file.fileNo,
        lines: [...debitLines, ...creditBuckets.values()],
      })
      file.costJournalId = costJournal.id
    }

    const deposit = round(payload.deposit)
    if (deposit > 0) {
      if (deposit > sale) throw new Error('Advance received cannot exceed the sale value.')
      const receipt = postJournal(state, {
        date: payload.depositDate || date,
        type: 'RV',
        narration: `Advance received — ${file.fileNo}`,
        segment: file.segment,
        partyId: party.id,
        fileId: file.id,
        ref: file.fileNo,
        lines: [
          {
            account: methodAccount(payload.depositMethod || 'city'),
            debit: deposit,
            memo: `Received from ${party.name}`,
          },
          { account: AR_ACCOUNT, credit: deposit, partyId: party.id, memo: file.fileNo },
        ],
      })
      file.receiptId = receipt.id
    }

    saveState(state)
    return { success: true, data: { ...file, ...fileFinancials(state, file, buildIndex(state)) } }
  },

  async updateFileStatus(id, status) {
    if (!['Processing', 'Completed', 'Cancelled'].includes(status)) {
      throw new Error('Invalid file status.')
    }
    const state = clone(loadState())
    const file = (state.files || []).find((row) => row.id === id)
    if (!file) throw new Error('File not found.')
    file.status = status
    saveState(state)
    return { success: true, data: file }
  },

  async voidFile(id) {
    const state = clone(loadState())
    const file = (state.files || []).find((row) => row.id === id)
    if (!file) throw new Error('File not found.')
    if (file.status === 'Cancelled') throw new Error('This file is already cancelled.')
    const stamp = new Date().toISOString()
    for (const journal of state.journals) {
      if (journal.fileId === id && journal.status !== 'void') {
        journal.status = 'void'
        journal.voidedAt = stamp
      }
    }
    file.status = 'Cancelled'
    saveState(state)
    return { success: true }
  },

  /* Analytics ----------------------------------------------- */

  async getSegmentReport(from, to) {
    const state = loadState()
    return { success: true, data: buildSegmentReport(state, from, to) }
  },

  async getMonthly(year) {
    const state = loadState()
    return { success: true, data: buildMonthly(state, year) }
  },

  /* Exports ------------------------------------------------- */

  async exportJournals(filters = {}, format = 'csv') {
    const state = loadState()
    const rows = filterJournals(state, filters)
    const headers = [
      { key: 'date', label: 'Date' },
      { key: 'no', label: 'Voucher No' },
      { key: 'type', label: 'Type' },
      { key: 'narration', label: 'Narration' },
      { key: 'segment', label: 'Segment' },
      { key: 'partyName', label: 'Party' },
      { key: 'fileNo', label: 'File' },
      { key: 'debit', label: 'Debit (BDT)' },
      { key: 'credit', label: 'Credit (BDT)' },
      { key: 'status', label: 'Status' },
    ]
    if (format === 'excel') {
      exportToExcel('Journal-Register', {
        title: 'Journal Register',
        subtitle: 'All vouchers posted in the selected period',
        headers: headers.map((header) => ({
          ...header,
          isCurrency: ['Debit (BDT)', 'Credit (BDT)'].includes(header.label),
        })),
        rows,
        summaryTotals: [
          { label: 'Total Debit', value: formatMoney(rows.reduce((sum, row) => sum + row.debit, 0)) },
          { label: 'Total Credit', value: formatMoney(rows.reduce((sum, row) => sum + row.credit, 0)) },
        ],
      })
    } else {
      exportToCsv('Journal-Register', headers, rows)
    }
    return { success: true }
  },

  async exportLedger({ code, from, to }, format = 'csv') {
    const state = loadState()
    const ledger = buildLedger(state, code, from, to)
    const rows = [
      {
        date: from,
        no: '',
        type: '',
        narration: 'Opening balance',
        ref: '',
        debit: '',
        credit: '',
        balance: ledger.opening,
      },
      ...ledger.rows.map((row) => ({
        date: row.date,
        no: row.no,
        type: row.type,
        narration: row.narration,
        ref: row.ref,
        debit: row.debit || '',
        credit: row.credit || '',
        balance: row.balance,
      })),
    ]
    const headers = [
      { key: 'date', label: 'Date' },
      { key: 'no', label: 'Voucher' },
      { key: 'type', label: 'Type' },
      { key: 'narration', label: 'Particulars' },
      { key: 'ref', label: 'Reference' },
      { key: 'debit', label: 'Debit' },
      { key: 'credit', label: 'Credit' },
      { key: 'balance', label: 'Balance' },
    ]
    const filename = `Ledger-${ledger.account.code}-${from}-${to}`
    if (format === 'excel') {
      exportToExcel(filename, {
        title: `General Ledger — ${ledger.account.name}`,
        subtitle: `${formatDateShort(from)} to ${formatDateShort(to)} · Opening ${formatMoney(ledger.opening)}`,
        headers: headers.map((header) => ({ ...header, isCurrency: ['debit', 'credit', 'balance'].includes(header.key) })),
        rows,
        summaryTotals: [
          { label: 'Opening Balance', value: formatMoney(ledger.opening) },
          { label: 'Total Debit', value: formatMoney(ledger.debit) },
          { label: 'Total Credit', value: formatMoney(ledger.credit) },
          { label: 'Closing Balance', value: formatMoney(ledger.closing) },
        ],
      })
    } else {
      exportToCsv(filename, headers, rows)
    }
    return { success: true }
  },

  async exportTrialBalance(asOf, format = 'csv') {
    const state = loadState()
    const trial = buildTrialBalance(state, asOf)
    const rows = trial.rows.map((row) => ({
      code: row.code,
      name: row.name,
      type: row.type,
      debit: row.debitBalance,
      credit: row.creditBalance,
    }))
    const headers = [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Account' },
      { key: 'type', label: 'Type' },
      { key: 'debit', label: 'Debit (BDT)' },
      { key: 'credit', label: 'Credit (BDT)' },
    ]
    const filename = `Trial-Balance-${asOf}`
    if (format === 'excel') {
      exportToExcel(filename, {
        title: 'Trial Balance',
        subtitle: `As at ${formatDateShort(asOf)}`,
        headers: headers.map((header) => ({ ...header, isCurrency: ['debit', 'credit'].includes(header.key) })),
        rows,
        summaryTotals: [
          { label: 'Total Debit', value: formatMoney(trial.totals.debit) },
          { label: 'Total Credit', value: formatMoney(trial.totals.credit) },
          { label: 'Difference', value: formatMoney(trial.totals.difference) },
        ],
        metadata: { Status: trial.balanced ? 'Balanced' : 'Out of balance' },
      })
    } else {
      exportToCsv(filename, headers, rows)
    }
    return { success: true }
  },

  async exportProfitLoss(from, to, format = 'csv') {
    const state = loadState()
    const pl = buildProfitLoss(state, from, to)
    const rows = [
      ...pl.revenueRows.map((row) => ({ section: 'Revenue', code: row.code, account: row.name, amount: row.amount })),
      { section: 'Revenue', code: '', account: 'Total revenue', amount: pl.totalRevenue },
      ...pl.cogsRows.map((row) => ({ section: 'Direct costs', code: row.code, account: row.name, amount: row.amount })),
      { section: 'Direct costs', code: '', account: 'Total direct costs', amount: pl.totalCogs },
      { section: 'Gross profit', code: '', account: 'Gross profit', amount: pl.grossProfit },
      ...pl.opexRows.map((row) => ({ section: 'Operating expenses', code: row.code, account: row.name, amount: row.amount })),
      { section: 'Operating expenses', code: '', account: 'Total operating expenses', amount: pl.totalOpex },
      { section: 'Net profit', code: '', account: 'Net profit', amount: pl.netProfit },
    ]
    const headers = [
      { key: 'section', label: 'Section' },
      { key: 'code', label: 'Code' },
      { key: 'account', label: 'Account' },
      { key: 'amount', label: 'Amount (BDT)' },
    ]
    const filename = `Profit-Loss-${from}-${to}`
    if (format === 'excel') {
      exportToExcel(filename, {
        title: 'Profit & Loss Statement',
        subtitle: `${formatDateShort(from)} to ${formatDateShort(to)}`,
        headers: headers.map((header) => ({ ...header, isCurrency: header.key === 'amount' })),
        rows,
        summaryTotals: [
          { label: 'Revenue', value: formatMoney(pl.totalRevenue) },
          { label: 'Gross Profit', value: formatMoney(pl.grossProfit) },
          { label: 'Net Profit', value: formatMoney(pl.netProfit) },
        ],
        metadata: { 'Gross margin': formatPct(pl.grossMargin), 'Net margin': formatPct(pl.netMargin) },
      })
    } else {
      exportToCsv(filename, headers, rows)
    }
    return { success: true }
  },

  async exportBalanceSheet(asOf, format = 'csv') {
    const state = loadState()
    const sheet = buildBalanceSheet(state, asOf)
    const rows = [
      ...sheet.assetGroups.flatMap((group) => [
        { section: group.group, code: '', account: group.group, amount: '' },
        ...group.rows.map((row) => ({ section: group.group, code: row.code, account: row.name, amount: row.amount })),
        { section: group.group, code: '', account: `Total ${group.group}`, amount: group.total },
      ]),
      { section: 'Assets', code: '', account: 'Total assets', amount: sheet.totalAssets },
      ...sheet.liabilityGroups.flatMap((group) => [
        ...group.rows.map((row) => ({ section: group.group, code: row.code, account: row.name, amount: row.amount })),
        { section: group.group, code: '', account: `Total ${group.group}`, amount: group.total },
      ]),
      { section: 'Liabilities', code: '', account: 'Total liabilities', amount: sheet.totalLiabilities },
      ...sheet.equityGroups.flatMap((group) =>
        group.rows.map((row) => ({ section: group.group, code: row.code, account: row.name, amount: row.amount }))
      ),
      { section: 'Equity', code: '', account: 'Current year earnings', amount: sheet.netProfit },
      { section: 'Equity', code: '', account: 'Total equity', amount: sheet.totalEquity },
      {
        section: 'Total',
        code: '',
        account: 'Total liabilities & equity',
        amount: sheet.totalLiabilitiesAndEquity,
      },
    ]
    const headers = [
      { key: 'section', label: 'Section' },
      { key: 'code', label: 'Code' },
      { key: 'account', label: 'Account' },
      { key: 'amount', label: 'Amount (BDT)' },
    ]
    const filename = `Balance-Sheet-${asOf}`
    if (format === 'excel') {
      exportToExcel(filename, {
        title: 'Balance Sheet',
        subtitle: `As at ${formatDateShort(asOf)}`,
        headers: headers.map((header) => ({ ...header, isCurrency: header.key === 'amount' })),
        rows,
        summaryTotals: [
          { label: 'Total Assets', value: formatMoney(sheet.totalAssets) },
          { label: 'Total Liabilities', value: formatMoney(sheet.totalLiabilities) },
          { label: 'Total Equity', value: formatMoney(sheet.totalEquity) },
        ],
        metadata: { Balanced: sheet.balanced ? 'Yes' : 'No' },
      })
    } else {
      exportToCsv(filename, headers, rows)
    }
    return { success: true }
  },

  async exportReceivables(kind = 'all', asOf = todayISO(), format = 'csv') {
    const state = loadState()
    const data = kind === 'all' ? buildReceivables(state, asOf) : buildReceivableByKind(state, kind, asOf)
    const rows = data.parties.map((party) => ({
      code: party.code,
      name: party.name,
      type: party.type,
      invoices: party.invoices,
      invoiced: party.invoiced,
      collected: party.collected,
      due: party.due,
      overdue: party.overdue,
      status: party.status,
    }))
    const headers = [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'invoices', label: 'Invoices' },
      { key: 'invoiced', label: 'Invoiced (BDT)' },
      { key: 'collected', label: 'Collected (BDT)' },
      { key: 'due', label: 'Outstanding (BDT)' },
      { key: 'overdue', label: 'Overdue (BDT)' },
      { key: 'status', label: 'Status' },
    ]
    const filename = `Receivables-${kind}-${asOf}`
    if (format === 'excel') {
      exportToExcel(filename, {
        title: 'Receivables Ageing',
        subtitle: `As at ${formatDateShort(asOf)}`,
        headers: headers.map((header) => ({
          ...header,
          isCurrency: ['invoiced', 'collected', 'due', 'overdue'].includes(header.key),
        })),
        rows,
        summaryTotals: [
          { label: 'Invoiced', value: formatMoney(data.summary.invoiced) },
          { label: 'Collected', value: formatMoney(data.summary.collected) },
          { label: 'Outstanding', value: formatMoney(data.summary.due) },
          { label: 'Overdue', value: formatMoney(data.summary.overdue) },
        ],
      })
    } else {
      exportToCsv(filename, headers, rows)
    }
    return { success: true }
  },

  async exportPayables(asOf = todayISO(), format = 'csv') {
    const state = loadState()
    const data = buildPayables(state, asOf)
    const rows = data.parties.map((party) => ({
      code: party.code,
      name: party.name,
      bills: party.invoices,
      billed: party.invoiced,
      paid: party.collected,
      due: party.due,
      overdue: party.overdue,
      status: party.status,
    }))
    const headers = [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Supplier' },
      { key: 'bills', label: 'Bills' },
      { key: 'billed', label: 'Billed (BDT)' },
      { key: 'paid', label: 'Paid (BDT)' },
      { key: 'due', label: 'Outstanding (BDT)' },
      { key: 'overdue', label: 'Overdue (BDT)' },
      { key: 'status', label: 'Status' },
    ]
    const filename = `Payables-${asOf}`
    if (format === 'excel') {
      exportToExcel(filename, {
        title: 'Supplier Payables Ageing',
        subtitle: `As at ${formatDateShort(asOf)}`,
        headers: headers.map((header) => ({
          ...header,
          isCurrency: ['billed', 'paid', 'due', 'overdue'].includes(header.key),
        })),
        rows,
        summaryTotals: [
          { label: 'Billed', value: formatMoney(data.summary.invoiced) },
          { label: 'Paid', value: formatMoney(data.summary.collected) },
          { label: 'Outstanding', value: formatMoney(data.summary.due) },
          { label: 'Overdue', value: formatMoney(data.summary.overdue) },
        ],
      })
    } else {
      exportToCsv(filename, headers, rows)
    }
    return { success: true }
  },

  async exportFiles(filters = {}, format = 'csv') {
    const state = loadState()
    const { rows } = buildFiles(state, filters)
    const data = rows.map((row) => ({
      fileNo: row.fileNo,
      date: row.date,
      type: row.type,
      applicant: row.applicant,
      party: row.partyName,
      destination: row.destination,
      sale: row.sale,
      cost: row.cost,
      profit: row.profit,
      margin: formatPct(row.margin),
      received: row.received,
      due: row.due,
      status: row.status,
    }))
    const headers = [
      { key: 'fileNo', label: 'File No' },
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' },
      { key: 'applicant', label: 'Applicant' },
      { key: 'party', label: 'Client / Agent' },
      { key: 'destination', label: 'Destination' },
      { key: 'sale', label: 'Sale (BDT)' },
      { key: 'cost', label: 'Cost (BDT)' },
      { key: 'profit', label: 'Gross Profit (BDT)' },
      { key: 'margin', label: 'Margin' },
      { key: 'received', label: 'Received (BDT)' },
      { key: 'due', label: 'Due (BDT)' },
      { key: 'status', label: 'Status' },
    ]
    const filename = `Visa-Tour-Files-${todayISO()}`
    if (format === 'excel') {
      exportToExcel(filename, {
        title: 'Visa & Tour File Profitability',
        subtitle: 'Job-wise sale, cost and gross profit',
        headers: headers.map((header) => ({
          ...header,
          isCurrency: ['sale', 'cost', 'profit', 'received', 'due'].includes(header.key),
        })),
        rows: data,
        summaryTotals: [
          { label: 'Sale', value: formatMoney(rows.reduce((sum, row) => sum + row.sale, 0)) },
          { label: 'Cost', value: formatMoney(rows.reduce((sum, row) => sum + row.cost, 0)) },
          { label: 'Gross Profit', value: formatMoney(rows.reduce((sum, row) => sum + row.profit, 0)) },
        ],
      })
    } else {
      exportToCsv(filename, headers, data)
    }
    return { success: true }
  },

  async exportMonthly(year, format = 'csv') {
    const state = loadState()
    const data = buildMonthly(state, year)
    const headers = [
      { key: 'monthName', label: 'Month' },
      { key: 'revenue', label: 'Revenue (BDT)' },
      { key: 'cogs', label: 'Direct Costs (BDT)' },
      { key: 'opex', label: 'Operating Expenses (BDT)' },
      { key: 'netProfit', label: 'Net Profit (BDT)' },
      { key: 'margin', label: 'Margin %' },
      { key: 'files', label: 'Files' },
      { key: 'collections', label: 'Collections (BDT)' },
    ]
    const rows = data.rows.map((row) => ({ ...row, margin: formatPct(row.margin) }))
    const filename = `Monthly-Performance-${year}`
    if (format === 'excel') {
      exportToExcel(filename, {
        title: `Monthly Performance — ${year}`,
        subtitle: 'Revenue, direct costs, overheads and profit by month',
        headers: headers.map((header) => ({
          ...header,
          isCurrency: ['revenue', 'cogs', 'opex', 'netProfit', 'collections'].includes(header.key),
        })),
        rows,
        summaryTotals: [
          { label: 'Annual Revenue', value: formatMoney(data.totals.revenue) },
          { label: 'Annual Net Profit', value: formatMoney(data.totals.netProfit) },
          { label: 'Annual Files', value: data.totals.files },
        ],
      })
    } else {
      exportToCsv(filename, headers, rows)
    }
    return { success: true }
  },
}

export default reportsApi
