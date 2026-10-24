/**
 * Post a Visa application into the Accounts books.
 *
 * The visa form already collects the selling amount, discount, advance,
 * payment method and vendor costs. This bridge turns those values into:
 *   - one client sale (with due)
 *   - one vendor cost / payable per vendor row
 *   - one money receipt when an advance was taken
 *
 * The application then appears in Accounts → Sales, Client Dues and
 * Vendor Payables without duplicate entry.
 */

import { AP_ACCOUNT, AR_ACCOUNT, methodAccount } from '@/features/reports/accounting/coa'
import { postJournal } from '@/features/reports/accounting/posting'
import { loadState, saveState } from '@/features/reports/accounting/storage'
import { addDays, todayISO } from '@/features/reports/accounting/dates'

const DISCOUNT_ACCOUNT = '4090'

const SERVICE_MAP = {
  visa: { type: 'Visa', category: 'Visa', segment: 'visa', account: '5010', revenue: '4010' },
  ticket: { type: 'Air Ticket', category: 'Air Ticket', segment: 'air', account: '5040', revenue: '4030' },
  air: { type: 'Air Ticket', category: 'Air Ticket', segment: 'air', account: '5040', revenue: '4030' },
  hotel: { type: 'Hotel', category: 'Hotel', segment: 'hotel', account: '5050', revenue: '4040' },
  tour: { type: 'Tour', category: 'Tour Package', segment: 'tour', account: '5030', revenue: '4020' },
  transport: { type: 'Transport', category: 'Transport', segment: 'transport', account: '5060', revenue: '4050' },
}

function metaForService(service) {
  const key = String(service || 'visa').toLowerCase()
  return SERVICE_MAP[key] || { type: 'Other', category: 'Other', segment: 'other', account: '5090', revenue: '4060' }
}

function accountForVendorService(service) {
  return metaForService(service).account
}

function paymentKey(value) {
  const text = String(value || '').toLowerCase()
  if (text.includes('cash')) return 'cash'
  if (text.includes('bkash') || text.includes('nagad')) return 'bkash'
  return 'bank'
}

function ensureParty(state, { type, name, phone, email, passport, vendorId }) {
  let party = (state.parties || []).find((row) => {
    if (vendorId) return row.vendorId === vendorId
    if (passport) return row.passport === passport
    return row.type === type && row.name?.toLowerCase() === String(name || '').toLowerCase()
  })

  if (!party) {
    const prefix = type === 'Vendor' ? 'V' : type === 'B2B' ? 'A' : 'C'
    const sequence = (state.parties || []).filter((row) => row.code?.startsWith(`${prefix}-`)).length + 1
    party = {
      id: `${prefix.toLowerCase()}_${Date.now().toString(36)}_${sequence}`,
      code: vendorId
        ? `VND-${String(sequence).padStart(4, '0')}`
        : `${prefix}-${String(sequence).padStart(4, '0')}`,
      type,
      name: name || 'Client',
      phone: phone || '—',
      email: email || '',
      address: 'Dhaka, Bangladesh',
      passport: passport || '',
      active: true,
      since: todayISO(),
      vendorId: vendorId || undefined,
    }
    state.parties.push(party)
  } else {
    if (phone) party.phone = phone
    if (email) party.email = email
    if (passport) party.passport = passport
    if (name) party.name = name
  }
  return party
}

export function postVisaApplicationToAccounts(application, payload) {
  const state = loadState()
  const date = application.submittedAt || todayISO()
  const service = metaForService(payload.serviceType || 'visa')
  const isB2B = payload.clientType === 'b2b'
  const clientName =
    isB2B && payload.clientName && !/b2b partner/i.test(payload.clientName)
      ? payload.clientName
      : payload.name || payload.clientName || 'Visa Client'

  const client = ensureParty(state, {
    type: isB2B ? 'B2B' : 'B2C',
    name: clientName,
    phone: payload.phone,
    email: payload.email,
    passport: payload.passportNumber,
  })

  const vendorRows = Array.isArray(payload.vendorList) ? payload.vendorList : []
  const vendors = vendorRows.map((row) => {
    const party = ensureParty(state, {
      type: 'Vendor',
      name: row.name || 'Vendor',
      vendorId: row.vendorId,
    })
    return { row, party }
  })

  const total = Math.max(0, Number(payload.totalAmount) || 0)
  const discount = Math.min(total, Math.max(0, Number(payload.discountAmount) || 0))
  const net = Math.max(0, Number(payload.netAmount ?? total - discount) || 0)
  const advance = Math.min(net, Math.max(0, Number(payload.advancePaid) || 0))
  const due = Math.max(0, net - advance)

  state.counters = state.counters || { journal: 0, file: 0 }
  state.counters.file = (state.counters.file || 0) + 1
  const file = {
    id: `f${state.counters.file}`,
    fileNo: application.number || `VISA-${date.slice(0, 4)}-${String(state.counters.file).padStart(6, '0')}`,
    type: service.type,
    segment: service.segment,
    category: service.category,
    date,
    issueDate: date,
    applicant: payload.name || clientName,
    partyId: client.id,
    partyName: client.name,
    partyType: isB2B ? 'B2B' : 'B2C',
    destination: payload.country || 'Visa',
    detail: payload.phone || '',
    passportNo: payload.passportNumber || '',
    sale: net,
    costs: vendors
      .filter(({ row }) => Number(row.price) > 0)
      .map(({ row, party }) => ({
        account: accountForVendorService(row.service),
        label: `${row.name || 'Vendor'}${row.country ? ` — ${row.country}` : ''}`,
        amount: Number(row.price) || 0,
        paidVia: 'credit',
        partyId: party.id,
        date,
      })),
    status: due <= 0 ? 'Completed' : 'Processing',
    dueDate: addDays(date, 30),
    travelDate: null,
    notes: payload.vendorNotes || '',
    createdAt: new Date().toISOString(),
    visaApplicationId: application.id,
    salesBy: 'Visa Desk',
    createdBy: 'Visa Application',
  }
  state.files = state.files || []
  state.files.push(file)

  const saleJournal = postJournal(state, {
    date,
    type: 'SV',
    narration: `Visa sale ${file.fileNo} — ${client.name}`,
    segment: service.segment,
    partyId: client.id,
    fileId: file.id,
    ref: file.fileNo,
    lines: [
      { account: AR_ACCOUNT, debit: net, partyId: client.id, memo: file.fileNo },
      ...(discount > 0
        ? [{ account: DISCOUNT_ACCOUNT, debit: discount, kind: 'discount', memo: 'Visa discount' }]
        : []),
      {
        account: service.revenue,
        credit: total,
        memo: `${service.category}${payload.country ? ` — ${payload.country}` : ''}`,
      },
    ],
  })
  file.saleJournalId = saleJournal.id

  let costJournal = null
  if (file.costs.length) {
    const costLines = []
    for (const cost of file.costs) {
      costLines.push({
        account: cost.account,
        debit: cost.amount,
        memo: cost.label,
      })
      costLines.push({
        account: AP_ACCOUNT,
        credit: cost.amount,
        partyId: cost.partyId,
        memo: cost.label,
      })
    }
    costJournal = postJournal(state, {
      date,
      type: 'JV',
      narration: `Vendor cost ${file.fileNo}`,
      segment: service.segment,
      partyId: client.id,
      fileId: file.id,
      ref: file.fileNo,
      lines: costLines,
    })
    file.costJournalId = costJournal.id
  }

  let receiptJournal = null
  if (advance > 0) {
    const cash = methodAccount(paymentKey(payload.paymentMethod))
    receiptJournal = postJournal(state, {
      date,
      type: 'RV',
      narration: `Visa advance ${file.fileNo} — ${client.name}`,
      segment: service.segment,
      partyId: client.id,
      fileId: file.id,
      ref: file.fileNo,
      lines: [
        { account: cash, debit: advance, memo: 'Advance received' },
        { account: AR_ACCOUNT, credit: advance, partyId: client.id, memo: file.fileNo },
      ],
    })
    file.receiptId = receiptJournal.id
  }

  saveState(state)
  return {
    file,
    saleJournal,
    costJournal,
    receiptJournal,
    due,
    advance,
    net,
    discount,
  }
}
