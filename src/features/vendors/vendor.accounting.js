/**
 * Bridge between the Vendors module and the double-entry Accounts engine.
 *
 * Vendor creation, bills, payments, advances and opening balances are posted
 * into the same `abl_accounting_v1` books used by Accounts → Vendor Payables.
 * Every posting is linked back to the vendor record, so edits and deletes can
 * reverse the previous entry instead of changing history.
 */

import { AP_ACCOUNT, methodAccount } from '@/features/reports/accounting/coa'
import { postJournal } from '@/features/reports/accounting/posting'
import { loadState, saveState } from '@/features/reports/accounting/storage'
import { todayISO } from '@/features/reports/accounting/dates'

const ADVANCE_ACCOUNT = '1200'
const OPENING_EQUITY = '3050'

const SERVICE_ACCOUNTS = [
  { match: ['visa', 'embassy'], account: '5010', segment: 'visa' },
  { match: ['air', 'ticket', 'airline'], account: '5040', segment: 'air' },
  { match: ['hotel', 'room'], account: '5050', segment: 'hotel' },
  { match: ['tour', 'package', 'dmc'], account: '5030', segment: 'tour' },
  { match: ['transport', 'transfer', 'bus'], account: '5060', segment: 'transport' },
]

function serviceTarget(service) {
  const name = `${service?.name || ''} ${service?.code || ''}`.toLowerCase()
  const found = SERVICE_ACCOUNTS.find((entry) => entry.match.some((word) => name.includes(word)))
  return found || { account: '5090', segment: 'other' }
}

function vendorPhone(vendor) {
  const number = vendor.mobile?.number || vendor.mobileNumber || ''
  const code = vendor.mobile?.countryCode || ''
  return `${code} ${number}`.trim()
}

function ensureParty(state, vendor) {
  let party = (state.parties || []).find((row) => row.vendorId === vendor.id)
  if (!party) {
    party = (state.parties || []).find(
      (row) => row.type === 'Vendor' && (row.code === vendor.vendorCode || row.name === vendor.name)
    )
  }
  if (!party) {
    party = {
      id: `vparty_${vendor.id}`,
      code: vendor.vendorCode || `VND-${String((state.parties || []).length + 1).padStart(4, '0')}`,
      type: 'Vendor',
      name: vendor.name || 'Vendor',
      phone: vendorPhone(vendor),
      email: vendor.email || '',
      address: vendor.address || 'Dhaka, Bangladesh',
      creditLimit: Number(vendor.creditLimit) || 0,
      active: vendor.isActive !== false,
      since: String(vendor.createdAt || todayISO()).slice(0, 10),
      vendorId: vendor.id,
    }
    state.parties.push(party)
  }
  Object.assign(party, {
    vendorId: vendor.id,
    name: vendor.name || party.name,
    phone: vendorPhone(vendor) || party.phone,
    email: vendor.email || party.email,
    address: vendor.address || party.address,
    creditLimit: Number(vendor.creditLimit) || 0,
    active: vendor.isActive !== false,
  })
  return party
}

function postOpening(state, vendor, party) {
  const opening = Math.max(0, Number(vendor.openingBalance) || 0)
  if (opening <= 0) return null
  const isAdvance = vendor.openingBalanceType === 'advance'
  const date = String(vendor.createdAt || todayISO()).slice(0, 10)
  return postJournal(state, {
    date,
    type: 'OB',
    narration: `Opening ${isAdvance ? 'advance' : 'due'} — ${vendor.name}`,
    segment: null,
    partyId: party.id,
    ref: `VOPEN:${vendor.vendorCode || vendor.id}`,
    lines: isAdvance
      ? [
          { account: ADVANCE_ACCOUNT, debit: opening, memo: 'Opening vendor advance' },
          { account: OPENING_EQUITY, credit: opening, memo: 'Opening balance' },
        ]
      : [
          { account: OPENING_EQUITY, debit: opening, memo: 'Opening vendor due' },
          { account: AP_ACCOUNT, credit: opening, partyId: party.id, memo: 'Opening vendor due' },
        ],
  })
}

function postBill(state, vendor, bill, party, service) {
  const amount = Math.round(Number(bill.amount) || 0)
  if (amount <= 0) return null
  const target = serviceTarget(service)
  return postJournal(state, {
    date: bill.date || todayISO(),
    type: 'JV',
    narration: `Vendor bill ${bill.billNo} — ${vendor.name}`,
    segment: target.segment,
    partyId: party.id,
    ref: `VBILL:${bill.billNo}`,
    lines: [
      {
        account: target.account,
        debit: amount,
        memo: `${service?.name || 'Vendor service'} ${bill.invoiceRef ? `· ${bill.invoiceRef}` : ''}`.trim(),
      },
      {
        account: AP_ACCOUNT,
        credit: amount,
        partyId: party.id,
        memo: `Bill ${bill.billNo}${bill.invoiceRef ? ` · ${bill.invoiceRef}` : ''}`,
      },
    ],
  })
}

function postPayment(state, vendor, payment, party, service) {
  const amount = Math.round(Number(payment.amount) || 0)
  if (amount <= 0) return null
  const isAdvance = Boolean(payment.isAdvance)
  const cashAccount = methodAccount(payment.method || 'bank')
  return postJournal(state, {
    date: payment.date || todayISO(),
    type: 'PV',
    narration: isAdvance
      ? `Vendor advance — ${vendor.name}`
      : `Vendor payment ${payment.voucherNo} — ${vendor.name}`,
    segment: serviceTarget(service).segment,
    partyId: party.id,
    ref: `VPAY:${payment.voucherNo}`,
    lines: isAdvance
      ? [
          { account: ADVANCE_ACCOUNT, debit: amount, memo: payment.advancePurpose || 'Advance to supplier' },
          { account: cashAccount, credit: amount, memo: payment.account || 'Advance paid' },
        ]
      : [
          { account: AP_ACCOUNT, debit: amount, partyId: party.id, memo: `Payment ${payment.voucherNo}` },
          { account: cashAccount, credit: amount, memo: payment.account || 'Vendor payment' },
        ],
  })
}

export function reverseVendorJournal(journalId, reason = 'Vendor entry changed') {
  if (!journalId) return false
  const state = loadState()
  const changed = voidInState(state, journalId, reason)
  if (changed) saveState(state)
  return changed
}

function voidInState(state, journalId, reason) {
  if (!journalId) return false
  const journal = (state.journals || []).find((row) => row.id === journalId)
  if (!journal || journal.status === 'void') return false
  journal.status = 'void'
  journal.voidedAt = new Date().toISOString()
  journal.voidReason = reason
  return true
}

function journalActive(state, journalId) {
  if (!journalId) return false
  return (state.journals || []).some((row) => row.id === journalId && row.status !== 'void')
}

/**
 * Backfill and keep vendor books in sync with Accounts.
 * Mutates vendors/bills/payments so the caller can persist the linked journal IDs.
 */
export function syncVendorAccounting({ vendors = [], bills = [], payments = [], services = [] }) {
  const state = loadState()
  const serviceById = new Map(services.map((service) => [service.id, service]))
  let changed = false

  for (const vendor of vendors) {
    const party = ensureParty(state, vendor)

    const opening = Math.max(0, Number(vendor.openingBalance) || 0)
    if (opening > 0) {
      if (!journalActive(state, vendor.openingJournalId)) {
        if (vendor.openingJournalId) voidInState(state, vendor.openingJournalId, 'Opening balance changed')
        const journal = postOpening(state, vendor, party)
        vendor.openingJournalId = journal?.id || null
        changed = true
      }
    } else if (vendor.openingJournalId) {
      voidInState(state, vendor.openingJournalId, 'Opening balance removed')
      vendor.openingJournalId = null
      changed = true
    }
  }

  for (const bill of bills) {
    const vendor = vendors.find((row) => row.id === bill.vendorId)
    if (!vendor) continue
    const party = ensureParty(state, vendor)
    if (!journalActive(state, bill.journalId)) {
      if (bill.journalId) voidInState(state, bill.journalId, 'Vendor bill changed')
      const service = serviceById.get(bill.serviceId)
      const journal = postBill(state, vendor, bill, party, service)
      bill.journalId = journal?.id || null
      changed = true
    }
  }

  for (const payment of payments) {
    const vendor = vendors.find((row) => row.id === payment.vendorId)
    if (!vendor) continue
    const party = ensureParty(state, vendor)
    if (!journalActive(state, payment.journalId)) {
      if (payment.journalId) voidInState(state, payment.journalId, 'Vendor payment changed')
      const service = serviceById.get(payment.serviceId)
      const journal = postPayment(state, vendor, payment, party, service)
      payment.journalId = journal?.id || null
      changed = true
    }
  }

  saveState(state)
  return { changed, state }
}
