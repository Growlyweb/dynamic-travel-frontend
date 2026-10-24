/**
 * Print-ready accounting documents: tax-style invoices, money receipts,
 * journal vouchers, party statements and financial statements.
 */

import { numberToWords, openPrintWindow } from '@/utils/exportEngine'
import { COMPANY, PAYMENT_METHOD_BY_VALUE } from './accounting/coa'
import { formatDateShort } from './accounting/dates'
import { formatMoney, formatPct } from './reports.api'

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const LOGO_URL = () => `${window.location.origin}/company_logo.png`

const headerBlock = (title, subtitle, meta = '') => `
  <table class="header-table">
    <tr>
      <td style="vertical-align:top;">
        <img src="${LOGO_URL()}" alt="${COMPANY.name}" style="height:42px;margin-bottom:6px;" onerror="this.style.display='none'" />
        <div class="company-name">${esc(COMPANY.name)}</div>
        <div class="company-sub">${esc(COMPANY.address)}</div>
        <div class="company-sub">Tel: ${esc(COMPANY.phone)} · ${esc(COMPANY.email)} · ${esc(COMPANY.web)}</div>
        <div class="company-sub">${esc(COMPANY.bin)}</div>
      </td>
      <td class="doc-title-box">
        <div class="doc-title">${esc(title)}</div>
        ${subtitle ? `<div style="font-size:12px;color:#475569;margin-top:3px;">${subtitle}</div>` : ''}
        <div style="font-size:11px;color:#64748b;margin-top:4px;">${meta}</div>
      </td>
    </tr>
  </table>
`

const signatureBlock = (labels = ['Prepared By', 'Verified By', 'Accounts Head', 'Authorised Signatory']) => `
  <div class="sign-grid">
    ${labels
      .map(
        (label) => `
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">${esc(label)}</div>
      </div>`
      )
      .join('')}
  </div>
`

const footerBlock = (note) => `
  <div class="footer-note">
    ${esc(note || 'Computer generated document')} · Printed on ${new Date().toLocaleString('en-GB')}
  </div>
`

/* ── Service invoice ───────────────────────────────────────── */

export function printFileInvoice(file) {
  const isVisa = file.type === 'Visa'
  const title = isVisa ? 'Visa Service Invoice' : `${file.type} Invoice`
  const received = Number(file.received) || 0
  const total = Number(file.sale) || 0
  const due = Math.max(0, total - received)

  const lineLabel = [file.destination, file.detail].filter(Boolean).join(' — ') || file.type
  const description = isVisa
    ? `Visa processing & consultancy — ${lineLabel}`
    : `${file.type} service — ${lineLabel}`

  const html = `
    ${headerBlock(
      title,
      'VAT-Exempt Service Invoice',
      `Invoice No: <strong style="color:#0f172a;">${esc(file.fileNo)}</strong><br/>
       Date: <strong style="color:#0f172a;">${formatDateShort(file.date)}</strong><br/>
       Due: <strong style="color:#b91c1c;">${formatDateShort(file.dueDate || file.date)}</strong>`
    )}

    <div class="meta-grid">
      <div>
        <div class="meta-title">Billed To</div>
        <div class="meta-value">${esc(file.partyName || file.applicant)}</div>
        <div class="meta-sub">${esc(file.partyType === 'B2B' ? 'B2B Agent' : 'B2C Retail Client')} · ${esc(file.partyCode || '')}</div>
        <div class="meta-sub">Passenger / Applicant: <strong>${esc(file.applicant)}</strong></div>
        <div class="meta-sub">Phone: ${esc(file.partyPhone || '—')}</div>
      </div>
      <div>
        <div class="meta-title">File Particulars</div>
        <div class="meta-value">${esc(file.destination || '—')}</div>
        <div class="meta-sub">${esc(file.detail || '')}</div>
        ${isVisa ? `<div class="meta-sub">Passport: <strong>${esc(file.passportNo || '—')}</strong></div>` : ''}
        <div class="meta-sub">Travellers: ${file.pax || 1} · Travel date: ${esc(file.travelDate ? formatDateShort(file.travelDate) : '—')}</div>
        <div class="meta-sub">Status: ${esc(file.status)}</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width:42px;text-align:center;">SL</th>
          <th>Description</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Rate (BDT)</th>
          <th style="text-align:right;">Amount (BDT)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align:center;">1</td>
          <td>
            <strong>${esc(description)}</strong>
            <div style="color:#64748b;font-size:11px;margin-top:2px;">
              Service file ${esc(file.fileNo)} · professional fee and processing charge
            </div>
          </td>
          <td style="text-align:center;">${file.pax || 1}</td>
          <td style="text-align:right;">${formatMoney(total / (file.pax || 1))}</td>
          <td style="text-align:right;font-weight:600;">${formatMoney(total)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="text-align:right;color:#475569;">Subtotal</td>
          <td style="text-align:right;">${formatMoney(total)}</td>
        </tr>
        <tr>
          <td colspan="4" style="text-align:right;color:#15803d;">Advance / received</td>
          <td style="text-align:right;color:#15803d;">${formatMoney(received)}</td>
        </tr>
        <tr style="border-top:2px solid #0f172a;">
          <td colspan="4" style="text-align:right;font-weight:800;font-size:13px;">Balance due</td>
          <td style="text-align:right;font-weight:800;font-size:14px;color:${due > 0 ? '#b91c1c' : '#15803d'};">
            ${formatMoney(due)}
          </td>
        </tr>
      </tfoot>
    </table>

    <div class="amount-box">
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
        <div>
          <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;">Invoice total</div>
          <div class="amount-number">${formatMoney(total)}</div>
          <div class="amount-words">In words: <strong>${numberToWords(total)}</strong></div>
        </div>
        <div style="text-align:right;min-width:230px;">
          <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;">Payment instruction</div>
          <div style="font-size:11px;color:#334155;margin-top:2px;">${esc(COMPANY.bank)}</div>
          <div style="font-size:11px;color:#334155;">Reference: ${esc(file.fileNo)}</div>
        </div>
      </div>
    </div>

    <div style="font-size:10.5px;color:#64748b;line-height:1.6;margin-bottom:8px;">
      <strong style="color:#334155;">Terms:</strong> Service charge is non-refundable once the application is lodged with the embassy.
      Embassy fees are payable in advance and are subject to change without notice. Please quote the invoice number with every payment.
    </div>

    ${signatureBlock(['Prepared By', 'Checked By', 'Accounts In-Charge', 'Authorised Signatory'])}
    ${footerBlock(`${COMPANY.legalName} · Visa & Tours Division`)}
  `

  openPrintWindow({ title: `Invoice_${file.fileNo}`, htmlContent: html })
}

/* ── Money receipt ─────────────────────────────────────────── */

export function printMoneyReceipt({ receipt, party, file }) {
  const amount = receipt.amount
  const methodAccount = receipt.account
  const method =
    Object.values(PAYMENT_METHOD_BY_VALUE).find((entry) => entry.account === methodAccount)?.label ||
    'Bank transfer'

  const html = `
    ${headerBlock(
      'Money Receipt',
      'Official acknowledgement of payment',
      `Receipt No: <strong style="color:#0f172a;">${esc(receipt.no)}</strong><br/>
       Date: <strong style="color:#0f172a;">${formatDateShort(receipt.date)}</strong>`
    )}

    <div class="meta-grid">
      <div>
        <div class="meta-title">Received With Thanks From</div>
        <div class="meta-value">${esc(party?.name || receipt.partyName || '—')}</div>
        <div class="meta-sub">${esc(party?.code || '')} · ${esc(party?.type === 'B2B' ? 'B2B Agent' : 'B2C Client')}</div>
        <div class="meta-sub">Phone: ${esc(party?.phone || '—')}</div>
      </div>
      <div>
        <div class="meta-title">Payment Details</div>
        <div class="meta-value">${esc(method)}</div>
        <div class="meta-sub">${file ? `Service file: <strong>${esc(file.fileNo)}</strong>` : 'On account'}</div>
        ${file ? `<div class="meta-sub">${esc(file.destination || '')} ${esc(file.detail || '')}</div>` : ''}
        <div class="meta-sub">Narration: ${esc(receipt.narration || '')}</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Particulars</th>
          <th style="text-align:right;width:190px;">Amount (BDT)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${file ? `Payment against ${esc(file.type)} service — ${esc(file.applicant)}` : 'Payment on account'}</strong>
            <div style="color:#64748b;font-size:11px;margin-top:2px;">${esc(receipt.ref || '')}</div>
          </td>
          <td style="text-align:right;font-weight:700;font-size:14px;">${formatMoney(amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="amount-box">
      <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;">Amount received</div>
      <div class="amount-number">${formatMoney(amount)}</div>
      <div class="amount-words">In words: <strong>${numberToWords(amount)}</strong></div>
    </div>

    ${signatureBlock(['Received By', 'Accounts Verified', 'Authorised Signatory'])}
    ${footerBlock(`${COMPANY.legalName} · Accounts Department`)}
  `

  openPrintWindow({ title: `Receipt_${receipt.no}`, htmlContent: html })
}

/* ── Journal voucher ───────────────────────────────────────── */

export function printJournalVoucher(journal) {
  const total = journal.debit || journal.lines.reduce((sum, line) => sum + line.debit, 0)
  const html = `
    ${headerBlock(
      'Journal Voucher',
      journal.segmentName || 'General voucher',
      `Voucher No: <strong style="color:#0f172a;">${esc(journal.no)}</strong><br/>
       Date: <strong style="color:#0f172a;">${formatDateShort(journal.date)}</strong><br/>
       Status: <strong style="color:${journal.status === 'void' ? '#b91c1c' : '#15803d'};">${esc(journal.status || 'posted')}</strong>`
    )}

    <div class="meta-grid">
      <div>
        <div class="meta-title">Narration</div>
        <div class="meta-value">${esc(journal.narration)}</div>
        <div class="meta-sub">Reference: ${esc(journal.ref || '—')}</div>
      </div>
      <div>
        <div class="meta-title">Linked Records</div>
        <div class="meta-value">${esc(journal.partyName || 'No party')}</div>
        <div class="meta-sub">File: ${esc(journal.fileNo || '—')}</div>
        <div class="meta-sub">Segment: ${esc(journal.segmentName || 'General')}</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width:42px;text-align:center;">SL</th>
          <th>Account</th>
          <th>Particulars</th>
          <th style="text-align:right;">Debit (BDT)</th>
          <th style="text-align:right;">Credit (BDT)</th>
        </tr>
      </thead>
      <tbody>
        ${journal.lines
          .map(
            (line, index) => `
          <tr>
            <td style="text-align:center;">${index + 1}</td>
            <td>
              <strong>${esc(line.accountName || line.account)}</strong>
              <div style="color:#64748b;font-size:10px;">${esc(line.account)} ${line.partyName ? `· ${esc(line.partyName)}` : ''}</div>
            </td>
            <td>${esc(line.memo || journal.narration)}</td>
            <td style="text-align:right;">${line.debit ? formatMoney(line.debit) : '—'}</td>
            <td style="text-align:right;">${line.credit ? formatMoney(line.credit) : '—'}</td>
          </tr>`
          )
          .join('')}
      </tbody>
      <tfoot>
        <tr style="background:#f1f5f9;font-weight:800;">
          <td colspan="3" style="text-align:right;">Total</td>
          <td style="text-align:right;">${formatMoney(total)}</td>
          <td style="text-align:right;">${formatMoney(total)}</td>
        </tr>
      </tfoot>
    </table>

    <div class="amount-box">
      <div class="amount-words">Amount in words: <strong>${numberToWords(total)}</strong></div>
    </div>

    ${signatureBlock(['Prepared By', 'Verified By', 'Accounts Head', 'Approved By'])}
    ${footerBlock('Journal voucher · double-entry posting')}
  `
  openPrintWindow({ title: `Voucher_${journal.no}`, htmlContent: html })
}

/* ── Party statement of account ────────────────────────────── */

export function printPartyStatement(statement) {
  const { party, rows, closing, asOf } = statement
  const isVendor = party.type === 'Vendor'
  const html = `
    ${headerBlock(
      isVendor ? 'Supplier Statement' : 'Statement of Account',
      isVendor ? 'Payables ledger' : 'Receivables ledger',
      `As at: <strong style="color:#0f172a;">${formatDateShort(asOf)}</strong><br/>
       Account: <strong style="color:#0f172a;">${esc(party.code)}</strong>`
    )}

    <div class="meta-grid">
      <div>
        <div class="meta-title">${isVendor ? 'Supplier' : 'Customer / Agent'}</div>
        <div class="meta-value">${esc(party.name)}</div>
        <div class="meta-sub">${esc(party.type)} · ${esc(party.phone || '')}</div>
        <div class="meta-sub">${esc(party.email || '')}</div>
      </div>
      <div>
        <div class="meta-title">Account Summary</div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#475569;margin-top:2px;">
          <span>Total debit</span><span style="font-weight:700;">${formatMoney(statement.debit)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#475569;margin-top:2px;">
          <span>Total credit</span><span style="font-weight:700;">${formatMoney(statement.credit)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800;margin-top:6px;padding-top:6px;border-top:1px dashed #cbd5e1;">
          <span>${isVendor ? 'Balance payable' : 'Balance receivable'}</span>
          <span style="color:${closing > 0 ? '#b91c1c' : '#15803d'};">${formatMoney(Math.abs(closing))}</span>
        </div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width:36px;text-align:center;">SL</th>
          <th>Date</th>
          <th>Voucher</th>
          <th>Particulars</th>
          <th style="text-align:right;">Debit</th>
          <th style="text-align:right;">Credit</th>
          <th style="text-align:right;">Balance</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row, index) => `
          <tr>
            <td style="text-align:center;">${index + 1}</td>
            <td style="white-space:nowrap;">${formatDateShort(row.date)}</td>
            <td style="font-family:monospace;font-size:11px;">${esc(row.no)}</td>
            <td>
              <div>${esc(row.narration)}</div>
              <div style="font-size:10px;color:#64748b;">${esc(row.ref || '')}</div>
            </td>
            <td style="text-align:right;">${row.debit ? formatMoney(row.debit) : '—'}</td>
            <td style="text-align:right;">${row.credit ? formatMoney(row.credit) : '—'}</td>
            <td style="text-align:right;font-weight:600;color:${row.balance > 0 ? '#0f172a' : '#475569'};">
              ${formatMoney(row.balance)}
            </td>
          </tr>`
          )
          .join('')}
      </tbody>
      <tfoot>
        <tr style="background:#f1f5f9;font-weight:800;">
          <td colspan="4" style="text-align:right;">Closing balance</td>
          <td style="text-align:right;">${formatMoney(statement.debit)}</td>
          <td style="text-align:right;">${formatMoney(statement.credit)}</td>
          <td style="text-align:right;">${formatMoney(closing)}</td>
        </tr>
      </tfoot>
    </table>

    ${signatureBlock(['Prepared By', 'Accounts Verified', 'Authorised Signatory', 'Received By'])}
    ${footerBlock('Statement of account · please report any discrepancy within 7 days')}
  `
  openPrintWindow({ title: `Statement_${party.code}`, htmlContent: html })
}

/* ── Financial statement pages ─────────────────────────────── */

const statementRow = (label, amount, { bold = false, indent = false, color = '#0f172a', border = false } = {}) => {
  const display = amount === '' || amount === null || amount === undefined ? '' : formatMoney(amount)
  return `
  <tr style="${border ? 'border-top:1px solid #cbd5e1;' : ''}">
    <td style="padding:6px 10px;padding-left:${indent ? 24 : 10}px;${bold ? 'font-weight:800;' : ''}">${esc(label)}</td>
    <td style="padding:6px 10px;text-align:right;${bold ? 'font-weight:800;' : ''}color:${color};">${display}</td>
  </tr>
`
}

const statementShell = (title, subtitle, body, meta = {}) => `
  ${headerBlock(
    title,
    subtitle,
    `Generated: <strong style="color:#0f172a;">${new Date().toLocaleDateString('en-GB')}</strong>`
  )}
  ${Object.keys(meta).length ? `
    <div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:16px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:11px;">
      ${Object.entries(meta).map(([key, value]) => `<div><span style="color:#64748b;">${esc(key)}:</span> <strong>${esc(value)}</strong></div>`).join('')}
    </div>` : ''}
  ${body}
  ${signatureBlock()}
  ${footerBlock(`${COMPANY.legalName} · Management accounts`)}
`

export function printTrialBalance(trial, asOf) {
  const body = `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:70px;">Code</th>
          <th>Account</th>
          <th style="width:110px;">Type</th>
          <th style="text-align:right;">Debit (BDT)</th>
          <th style="text-align:right;">Credit (BDT)</th>
        </tr>
      </thead>
      <tbody>
        ${trial.groups
          .map(
            (group) => `
          <tr style="background:#f1f5f9;">
            <td colspan="5" style="font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#334155;padding:7px 10px;">${esc(group.type)}</td>
          </tr>
          ${group.rows
            .map(
              (row) => `
            <tr>
              <td style="font-family:monospace;font-size:11px;">${esc(row.code)}</td>
              <td>${esc(row.name)}</td>
              <td style="font-size:10px;color:#64748b;">${esc(row.group)}</td>
              <td style="text-align:right;">${row.debitBalance ? formatMoney(row.debitBalance) : '—'}</td>
              <td style="text-align:right;">${row.creditBalance ? formatMoney(row.creditBalance) : '—'}</td>
            </tr>`
            )
            .join('')}
          <tr>
            <td colspan="3" style="text-align:right;font-weight:700;font-size:11px;">Total ${esc(group.type)}</td>
            <td style="text-align:right;font-weight:700;">${formatMoney(group.debit)}</td>
            <td style="text-align:right;font-weight:700;">${formatMoney(group.credit)}</td>
          </tr>`
          )
          .join('')}
      </tbody>
      <tfoot>
        <tr style="background:#0f172a;color:#ffffff;font-weight:800;">
          <td colspan="3" style="text-align:right;">Grand total</td>
          <td style="text-align:right;">${formatMoney(trial.totals.debit)}</td>
          <td style="text-align:right;">${formatMoney(trial.totals.credit)}</td>
        </tr>
      </tfoot>
    </table>
    <div style="margin-top:10px;font-size:11px;font-weight:700;color:${trial.balanced ? '#15803d' : '#b91c1c'};">
      ${trial.balanced ? '✓ Debits equal credits — the ledger is in balance.' : `Out of balance by ${formatMoney(trial.totals.difference)}`}
    </div>
  `
  openPrintWindow({
    title: `Trial_Balance_${asOf}`,
    htmlContent: statementShell('Trial Balance', `As at ${formatDateShort(asOf)}`, body, {
      'As at': formatDateShort(asOf),
      Status: trial.balanced ? 'Balanced' : 'Out of balance',
      'Accounts with balances': trial.rows.length,
    }),
  })
}

export function printProfitLoss(pl) {
  const sectionHeader = (label) => `
    <tr style="background:#f1f5f9;">
      <td colspan="2" style="font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#334155;padding:8px 10px;">${esc(label)}</td>
    </tr>`

  const body = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Account</th>
          <th style="text-align:right;width:200px;">Amount (BDT)</th>
        </tr>
      </thead>
      <tbody>
        ${sectionHeader('Operating revenue')}
        ${pl.revenueRows.map((row) => statementRow(`${row.code} · ${row.name}`, row.amount, { indent: true })).join('')}
        ${statementRow('Total revenue', pl.totalRevenue, { bold: true, border: true })}

        ${sectionHeader('Direct costs')}
        ${pl.cogsRows.map((row) => statementRow(`${row.code} · ${row.name}`, row.amount, { indent: true })).join('')}
        ${statementRow('Total direct costs', pl.totalCogs, { bold: true, border: true })}

        ${statementRow('Gross profit', pl.grossProfit, { bold: true, color: pl.grossProfit >= 0 ? '#15803d' : '#b91c1c', border: true })}
        ${statementRow(`Gross margin ${formatPct(pl.grossMargin)}`, '', { indent: true, color: '#64748b' })}

        ${sectionHeader('Operating expenses')}
        ${pl.opexRows.map((row) => statementRow(`${row.code} · ${row.name}`, row.amount, { indent: true })).join('')}
        ${statementRow('Total operating expenses', pl.totalOpex, { bold: true, border: true })}

        ${statementRow('Net profit / (loss)', pl.netProfit, {
          bold: true,
          color: pl.netProfit >= 0 ? '#15803d' : '#b91c1c',
          border: true,
        })}
      </tbody>
    </table>
    <div style="margin-top:14px;font-size:11px;color:#cbd5e1;background:#0f172a;padding:10px 14px;border-radius:6px;display:flex;justify-content:space-between;">
      <span>Net margin</span>
      <strong style="color:#6ee7b7;">${formatPct(pl.netMargin)}</strong>
    </div>
  `

  openPrintWindow({
    title: 'Profit_and_Loss',
    htmlContent: statementShell(
      'Profit & Loss Statement',
      `${formatDateShort(pl.from)} — ${formatDateShort(pl.to)}`,
      body,
      {
        Period: `${formatDateShort(pl.from)} — ${formatDateShort(pl.to)}`,
        Revenue: formatMoney(pl.totalRevenue),
        'Net profit': formatMoney(pl.netProfit),
      }
    ),
  })
}

export function printBalanceSheet(sheet) {
  const assetBody = `
    <table class="data-table">
      <thead><tr><th>Assets</th><th style="text-align:right;width:170px;">Amount (BDT)</th></tr></thead>
      <tbody>
        ${sheet.assetGroups
          .map(
            (group) => `
          <tr style="background:#f1f5f9;"><td colspan="2" style="font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#334155;padding:7px 10px;">${esc(group.group)}</td></tr>
          ${group.rows.map((row) => statementRow(`${row.code} · ${row.name}`, row.amount, { indent: true })).join('')}
          <tr><td style="text-align:right;font-weight:700;font-size:11px;padding:6px 10px;">Total ${esc(group.group)}</td><td style="text-align:right;font-weight:700;padding:6px 10px;">${formatMoney(group.total)}</td></tr>`
          )
          .join('')}
      </tbody>
      <tfoot>
        <tr style="background:#0f172a;color:#fff;font-weight:800;"><td style="padding:8px 10px;">TOTAL ASSETS</td><td style="text-align:right;padding:8px 10px;">${formatMoney(sheet.totalAssets)}</td></tr>
      </tfoot>
    </table>
  `

  const equityBody = `
    <table class="data-table">
      <thead><tr><th>Liabilities & Equity</th><th style="text-align:right;width:170px;">Amount (BDT)</th></tr></thead>
      <tbody>
        ${sheet.liabilityGroups
          .map(
            (group) => `
          <tr style="background:#f1f5f9;"><td colspan="2" style="font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#334155;padding:7px 10px;">${esc(group.group)}</td></tr>
          ${group.rows.map((row) => statementRow(`${row.code} · ${row.name}`, row.amount, { indent: true })).join('')}`
          )
          .join('')}
        <tr><td style="text-align:right;font-weight:700;font-size:11px;padding:6px 10px;">Total liabilities</td><td style="text-align:right;font-weight:700;padding:6px 10px;">${formatMoney(sheet.totalLiabilities)}</td></tr>

        <tr style="background:#f1f5f9;"><td colspan="2" style="font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#334155;padding:7px 10px;">Capital & reserves</td></tr>
        ${sheet.equityRows.map((row) => statementRow(`${row.code} · ${row.name}`, row.amount, { indent: true })).join('')}
        ${statementRow('Current year earnings', sheet.netProfit, { indent: true })}
        <tr><td style="text-align:right;font-weight:700;font-size:11px;padding:6px 10px;">Total equity</td><td style="text-align:right;font-weight:700;padding:6px 10px;">${formatMoney(sheet.totalEquity)}</td></tr>
      </tbody>
      <tfoot>
        <tr style="background:#0f172a;color:#fff;font-weight:800;"><td style="padding:8px 10px;">TOTAL LIABILITIES & EQUITY</td><td style="text-align:right;padding:8px 10px;">${formatMoney(sheet.totalLiabilitiesAndEquity)}</td></tr>
      </tfoot>
    </table>
  `

  const body = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
      <div>${assetBody}</div>
      <div>${equityBody}</div>
    </div>
    <div style="margin-top:14px;font-size:11px;font-weight:700;color:${sheet.balanced ? '#15803d' : '#b91c1c'};">
      ${sheet.balanced ? '✓ Assets equal liabilities plus equity.' : `Difference: ${formatMoney(sheet.difference)}`}
    </div>
  `

  openPrintWindow({
    title: 'Balance_Sheet',
    htmlContent: statementShell('Balance Sheet', `As at ${formatDateShort(sheet.asOf)}`, body, {
      'As at': formatDateShort(sheet.asOf),
      'Total assets': formatMoney(sheet.totalAssets),
      Status: sheet.balanced ? 'Balanced' : 'Out of balance',
    }),
  })
}

export function printLedger(ledger) {
  const body = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Voucher</th>
          <th>Particulars</th>
          <th style="text-align:right;">Debit</th>
          <th style="text-align:right;">Credit</th>
          <th style="text-align:right;">Balance</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background:#f8fafc;font-weight:700;">
          <td colspan="3">Opening balance</td>
          <td style="text-align:right;">—</td>
          <td style="text-align:right;">—</td>
          <td style="text-align:right;">${formatMoney(ledger.opening)}</td>
        </tr>
        ${ledger.rows
          .map(
            (row) => `
          <tr>
            <td style="white-space:nowrap;">${formatDateShort(row.date)}</td>
            <td style="font-family:monospace;font-size:11px;">${esc(row.no)}</td>
            <td>${esc(row.narration)}<div style="font-size:10px;color:#64748b;">${esc(row.ref || '')}</div></td>
            <td style="text-align:right;">${row.debit ? formatMoney(row.debit) : '—'}</td>
            <td style="text-align:right;">${row.credit ? formatMoney(row.credit) : '—'}</td>
            <td style="text-align:right;font-weight:600;">${formatMoney(row.balance)}</td>
          </tr>`
          )
          .join('')}
      </tbody>
      <tfoot>
        <tr style="background:#0f172a;color:#fff;font-weight:800;">
          <td colspan="3" style="padding:8px 10px;">Closing balance</td>
          <td style="text-align:right;padding:8px 10px;">${formatMoney(ledger.debit)}</td>
          <td style="text-align:right;padding:8px 10px;">${formatMoney(ledger.credit)}</td>
          <td style="text-align:right;padding:8px 10px;">${formatMoney(ledger.closing)}</td>
        </tr>
      </tfoot>
    </table>
  `
  openPrintWindow({
    title: `Ledger_${ledger.account.code}`,
    htmlContent: statementShell(
      `General Ledger — ${ledger.account.name}`,
      `${formatDateShort(ledger.from)} — ${formatDateShort(ledger.to)}`,
      body,
      {
        Account: `${ledger.account.code} · ${ledger.account.name}`,
        Opening: formatMoney(ledger.opening),
        Closing: formatMoney(ledger.closing),
      }
    ),
  })
}
