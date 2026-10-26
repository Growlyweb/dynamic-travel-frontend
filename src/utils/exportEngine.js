/**
 * Unified Export Engine for Dynamic Travel & Tours
 *
 * Supports:
 * - Professional PDF generation (Print-ready A4 Invoices, Payment Vouchers, Statements, Reports)
 * - Styled Microsoft Excel Spreadsheets (.xls XML/HTML format with cell styles & summary totals)
 * - Standard RFC-4180 CSV export with UTF-8 BOM
 * - English Currency Number-to-Words converter for official money vouchers
 */

import { formatDate, formatNumber } from './formatters'

export const COMPANY_INFO = {
  name: 'ABL TRAVEL & TOURS',
  tagline: 'Visa · Tour Packages · Air Ticketing',
  address: 'House 12, Road 7, Banani, Dhaka 1213, Bangladesh',
  phone: '+880 1711-000000, +880 2-9888888',
  email: 'accounts@abltravel.com.bd',
  web: 'www.abltravel.com.bd',
  currency: 'BDT (৳)',
}

/**
 * Convert numeric amount into English words (Taka)
 * e.g. 75000 -> "Taka Seventy-Five Thousand Only"
 */
export function numberToWords(amount) {
  const num = Math.floor(Math.abs(Number(amount) || 0))
  if (num === 0) return 'Zero Taka Only'

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ]
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ]

  function convert(n) {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '')
    // South Asian numbering system: Thousand, Lakh, Crore
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '')
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '')
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '')
  }

  return 'Taka ' + convert(num).trim() + ' Only'
}

/**
 * Download a Blob as a file
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export data to standard CSV with UTF-8 BOM
 */
export function exportToCsv(filename, headers, rows) {
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""'
    const stringVal = String(val).replace(/"/g, '""')
    return `"${stringVal}"`
  }

  const headerRow = headers.map((h) => escapeCsv(h.label)).join(',')
  const dataRows = rows.map((row, index) =>
    headers
      .map((h) => {
        const val = typeof h.key === 'function' ? h.key(row, index) : row[h.key]
        return escapeCsv(val)
      })
      .join(',')
  )

  const csvContent = [headerRow, ...dataRows].join('\r\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`)
}

/**
 * Export data to styled Microsoft Excel Spreadsheet (.xls XML/HTML format)
 */
export function exportToExcel(filename, { title, subtitle, headers, rows, summaryTotals, metadata = {} }) {
  const safeFilename = filename.endsWith('.xls') ? filename : `${filename}.xls`

  const metaHtml = Object.entries(metadata)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `<tr><td style="font-weight:bold;color:#475569;font-size:11px;">${k}:</td><td style="font-size:11px;color:#0f172a;">${v}</td></tr>`)
    .join('')

  const headerCells = headers
    .map((h) => `<th style="background-color:#1e3a8a;color:#ffffff;font-weight:bold;font-size:12px;padding:8px 10px;border:1px solid #94a3b8;text-align:${h.align || 'left'};">${h.label}</th>`)
    .join('')

  const dataRowsHtml = rows
    .map((row, rIdx) => {
      const bg = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'
      const cells = headers
        .map((h) => {
          const val = typeof h.key === 'function' ? h.key(row, rIdx) : row[h.key]
          const displayVal = val === null || val === undefined ? '—' : val
          const align = h.align || (typeof val === 'number' || h.isCurrency ? 'right' : 'left')
          return `<td style="background-color:${bg};padding:6px 10px;font-size:11px;border:1px solid #cbd5e1;text-align:${align};">${displayVal}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  let summaryRowHtml = ''
  if (summaryTotals && summaryTotals.length > 0) {
    summaryRowHtml = `
      <tr style="background-color:#e2e8f0;font-weight:bold;border-top:2px solid #0f172a;">
        ${summaryTotals
          .map((item) => `<td colspan="${item.colspan || 1}" style="padding:8px 10px;font-size:12px;font-weight:bold;text-align:${item.align || 'left'};border:1px solid #94a3b8;">${item.value}</td>`)
          .join('')}
      </tr>
    `
  }

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${(title || 'Report').slice(0, 31).replace(/[\\/?*:[\]]/g, '')}</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        body { font-family: Calibri, Arial, sans-serif; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="${headers.length}" style="font-size:16pt;font-weight:bold;color:#1e3a8a;">${COMPANY_INFO.name}</td>
        </tr>
        <tr>
          <td colspan="${headers.length}" style="font-size:12pt;font-weight:bold;color:#334155;">${title || 'Financial Report'}</td>
        </tr>
        ${subtitle ? `<tr><td colspan="${headers.length}" style="font-size:10pt;color:#64748b;">${subtitle}</td></tr>` : ''}
        <tr><td colspan="${headers.length}" style="font-size:9pt;color:#94a3b8;">Generated: ${new Date().toLocaleString()}</td></tr>
        <tr><td colspan="${headers.length}"></td></tr>
        ${metaHtml}
        <tr><td colspan="${headers.length}"></td></tr>
      </table>
      <table border="1" style="border-collapse:collapse;">
        <thead>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>
          ${dataRowsHtml}
          ${summaryRowHtml}
        </tbody>
      </table>
    </body>
    </html>
  `

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  downloadBlob(blob, safeFilename)
}

/**
 * Open a beautifully styled, print-ready document window and trigger window.print()
 */
export function openPrintWindow({ title, htmlContent }) {
  const printWindow = window.open('', '_blank', 'width=950,height=950')
  if (!printWindow) {
    alert('Please allow popups to view and print documents/invoices.')
    return
  }

  const baseStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      padding: 30px 20px;
      font-size: 13px;
      line-height: 1.5;
    }
    .print-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .action-bar {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-primary { background: #1e40af; color: #fff; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary { background: #e2e8f0; color: #334155; }
    .btn-secondary:hover { background: #cbd5e1; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 16px; }
    .company-name { font-size: 22px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.02em; }
    .company-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .doc-title-box { text-align: right; }
    .doc-title { font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: 0.05em; text-transform: uppercase; }
    .doc-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }
    .badge-advance { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-paid { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-due { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
    .meta-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .meta-value { font-size: 13px; font-weight: 600; color: #0f172a; }
    .meta-sub { font-size: 11px; color: #475569; margin-top: 1px; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .data-table th { background: #f1f5f9; color: #334155; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; padding: 10px; border-bottom: 2px solid #cbd5e1; border-top: 1px solid #cbd5e1; }
    .data-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    .amount-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px; }
    .amount-number { font-size: 20px; font-weight: 800; color: #0f172a; }
    .amount-words { font-size: 12px; font-style: italic; color: #475569; margin-top: 2px; }
    .sign-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 48px; padding-top: 16px; }
    .sign-box { text-align: center; }
    .sign-line { border-top: 1px dashed #94a3b8; margin-bottom: 6px; }
    .sign-label { font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .footer-note { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
    @media print {
      body { background: #ffffff; padding: 0; font-size: 11pt; }
      .action-bar { display: none !important; }
      .print-container { box-shadow: none; border: none; padding: 0; max-width: 100%; }
      @page { size: A4; margin: 15mm; }
    }
  `

  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${title || 'Document'}</title>
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="action-bar">
          <div>
            <span style="font-weight:700;color:#0f172a;">${title || 'Document Preview'}</span>
            <span style="font-size:11px;color:#64748b;margin-left:8px;">Ready for Print / PDF export</span>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary" onclick="window.close()">Close</button>
            <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save as PDF</button>
          </div>
        </div>
        <div class="print-container">
          ${htmlContent}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

/**
 * Print / PDF Payment Voucher (Official Money Receipt)
 */
export function printPaymentVoucher({ payment, vendor, service }) {
  const isAdvance = Boolean(payment.isAdvance)
  const amountWords = numberToWords(payment.amount)

  const htmlContent = `
    <table class="header-table">
      <tr>
        <td>
          <div class="company-name">${COMPANY_INFO.name}</div>
          <div class="company-sub">${COMPANY_INFO.address}</div>
          <div class="company-sub">Tel: ${COMPANY_INFO.phone} · Email: ${COMPANY_INFO.email}</div>
        </td>
        <td class="doc-title-box">
          <div class="doc-title">${isAdvance ? 'Advance Payment Voucher' : 'Vendor Payment Voucher'}</div>
          <div>
            <span class="doc-badge ${isAdvance ? 'badge-advance' : 'badge-paid'}">
              ${isAdvance ? '★ Advance Deposit' : 'Bill Settlement'}
            </span>
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:4px;">
            Voucher No: <strong style="color:#0f172a;">${payment.voucherNo}</strong>
          </div>
          <div style="font-size:11px;color:#64748b;">
            Date: <strong style="color:#0f172a;">${formatDate(payment.date)}</strong>
          </div>
        </td>
      </tr>
    </table>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Paid To (Vendor / Supplier)</div>
        <div class="meta-value">${vendor?.name || payment.vendorName || 'Vendor'}</div>
        <div class="meta-sub">Vendor Code: ${vendor?.vendorCode || '—'}</div>
        <div class="meta-sub">Contact: ${vendor?.mobile ? `${vendor.mobile.countryCode} ${vendor.mobile.number}` : '—'}</div>
        <div class="meta-sub">Address: ${vendor?.address || '—'}</div>
      </div>
      <div>
        <div class="meta-title">Payment Account & Details</div>
        <div class="meta-value" style="text-transform:uppercase;">${payment.method || 'Bank Transfer'}</div>
        <div class="meta-sub">Account / Ref: ${payment.account || 'Direct Account Transfer'}</div>
        <div class="meta-sub">Service Segment: <strong>${service?.name || payment.serviceName || 'General'}</strong></div>
        ${payment.billId ? `<div class="meta-sub">Settled Bill: ${payment.billId}</div>` : ''}
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width:50px;text-align:center;">SL</th>
          <th>Description / Particulars</th>
          <th>Service Segment</th>
          <th style="text-align:right;">Amount (BDT)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align:center;">1</td>
          <td>
            <strong>${isAdvance ? 'Advance Payment / Deposit to Vendor' : 'Vendor Bill Payment Clearance'}</strong>
            <div style="color:#64748b;font-size:11px;margin-top:2px;">
              ${payment.note || (isAdvance ? 'Advance payment credited to supplier ledger.' : 'Bill payment against verified accounts.')}
            </div>
            ${payment.advancePurpose ? `<div style="color:#1e40af;font-size:11px;margin-top:2px;"><strong>Purpose:</strong> ${payment.advancePurpose}</div>` : ''}
          </td>
          <td>${service?.name || payment.serviceName || '—'}</td>
          <td style="text-align:right;font-weight:700;font-size:13px;">৳${formatNumber(payment.amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="amount-box">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;">Total Amount Paid</div>
          <div class="amount-number">৳${formatNumber(payment.amount)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;">Payment Status</div>
          <div style="font-size:14px;font-weight:700;color:#15803d;">COMPLETED</div>
        </div>
      </div>
      <div class="amount-words">In Words: <strong>${amountWords}</strong></div>
    </div>

    ${payment.note ? `
      <div style="margin-bottom:24px;font-size:11px;color:#475569;background:#fff;border:1px dashed #cbd5e1;padding:10px;border-radius:4px;">
        <strong>Remarks / Note:</strong> ${payment.note}
      </div>
    ` : ''}

    <div class="sign-grid">
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Prepared By</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Verified By</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Authorized Signatory</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Receiver's Signature</div>
      </div>
    </div>

    <div class="footer-note">
      This is a computer-generated voucher issued by Dynamic Travel & Tours. Printed on ${new Date().toLocaleString()}.
    </div>
  `

  openPrintWindow({
    title: `Payment_Voucher_${payment.voucherNo}`,
    htmlContent,
  })
}

/**
 * Print / PDF Vendor Bill (Invoice Record)
 */
export function printInvoice({ bill, vendor, service }) {
  const isPaid = bill.due <= 0
  const isPartial = bill.paid > 0 && bill.due > 0

  const htmlContent = `
    <table class="header-table">
      <tr>
        <td>
          <div class="company-name">${COMPANY_INFO.name}</div>
          <div class="company-sub">${COMPANY_INFO.address}</div>
          <div class="company-sub">Tel: ${COMPANY_INFO.phone} · Email: ${COMPANY_INFO.email}</div>
        </td>
        <td class="doc-title-box">
          <div class="doc-title">Vendor Bill / Invoice</div>
          <div>
            <span class="doc-badge ${isPaid ? 'badge-paid' : isPartial ? 'badge-advance' : 'badge-due'}">
              ${isPaid ? 'Fully Paid' : isPartial ? 'Partially Paid' : 'Due / Unpaid'}
            </span>
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:4px;">
            Bill No: <strong style="color:#0f172a;">${bill.billNo}</strong>
          </div>
          <div style="font-size:11px;color:#64748b;">
            Date: <strong style="color:#0f172a;">${formatDate(bill.date)}</strong>
          </div>
          ${bill.dueDate ? `<div style="font-size:11px;color:#b91c1c;">Due Date: <strong>${formatDate(bill.dueDate)}</strong></div>` : ''}
        </td>
      </tr>
    </table>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Supplier / Vendor Details</div>
        <div class="meta-value">${vendor?.name || bill.vendorName || 'Vendor'}</div>
        <div class="meta-sub">Code: ${vendor?.vendorCode || '—'}</div>
        <div class="meta-sub">Contact: ${vendor?.mobile ? `${vendor.mobile.countryCode} ${vendor.mobile.number}` : '—'}</div>
        <div class="meta-sub">Address: ${vendor?.address || '—'}</div>
      </div>
      <div>
        <div class="meta-title">Invoice References</div>
        <div class="meta-value">Ref: ${bill.invoiceRef || 'No Vendor Ref'}</div>
        <div class="meta-sub">Service Segment: <strong>${service?.name || bill.serviceName || 'General'}</strong></div>
        <div class="meta-sub">Recorded Date: ${formatDate(bill.date)}</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width:50px;text-align:center;">SL</th>
          <th>Service / Description</th>
          <th>Segment</th>
          <th style="text-align:right;">Amount (BDT)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align:center;">1</td>
          <td>
            <strong>${service?.name || bill.serviceName || 'Vendor Service'}</strong>
            <div style="color:#64748b;font-size:11px;margin-top:2px;">
              ${bill.note || 'Vendor service bill as per supplier invoice.'}
            </div>
          </td>
          <td>${service?.name || bill.serviceName || '—'}</td>
          <td style="text-align:right;font-weight:700;">৳${formatNumber(bill.amount)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr style="border-top:2px solid #cbd5e1;font-weight:bold;">
          <td colspan="3" style="text-align:right;padding-top:12px;">Total Billed Amount:</td>
          <td style="text-align:right;padding-top:12px;font-size:14px;">৳${formatNumber(bill.amount)}</td>
        </tr>
        <tr>
          <td colspan="3" style="text-align:right;color:#15803d;">Paid to Date:</td>
          <td style="text-align:right;color:#15803d;">৳${formatNumber(bill.paid || 0)}</td>
        </tr>
        <tr style="font-size:14px;color:#b91c1c;border-top:1px dashed #cbd5e1;">
          <td colspan="3" style="text-align:right;font-weight:800;">Net Balance Due:</td>
          <td style="text-align:right;font-weight:800;">৳${formatNumber(bill.due || bill.amount)}</td>
        </tr>
      </tfoot>
    </table>

    <div class="amount-box">
      <div class="amount-words">Amount in Words: <strong>${numberToWords(bill.amount)}</strong></div>
    </div>

    <div class="sign-grid">
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Prepared By</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Checked & Audited</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Accounts In-Charge</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Managing Director</div>
      </div>
    </div>

    <div class="footer-note">
      Dynamic Travel & Tours Supplier Accounts System · Generated on ${new Date().toLocaleString()}
    </div>
  `

  openPrintWindow({
    title: `Vendor_Bill_${bill.billNo}`,
    htmlContent,
  })
}

/**
 * Print / PDF Vendor Running Ledger & Account Statement
 */
export function printVendorStatement({ vendor, ledger = [] }) {
  const totalBilled = vendor?.totalBilled || ledger.reduce((sum, r) => sum + (Number(r.billed) || 0), 0)
  const totalPaid = vendor?.totalPaid || ledger.reduce((sum, r) => sum + (Number(r.paid) || 0), 0)
  const netDue = vendor?.totalDue ?? (totalBilled - totalPaid)

  const ledgerRowsHtml = ledger.map((row, idx) => `
    <tr>
      <td style="text-align:center;">${idx + 1}</td>
      <td style="white-space:nowrap;">${formatDate(row.date)}</td>
      <td style="text-transform:uppercase;font-weight:700;font-size:10px;">${row.type}</td>
      <td style="font-family:monospace;font-weight:600;">${row.ref}</td>
      <td>
        <div><strong>${row.serviceName}</strong></div>
        <div style="font-size:10px;color:#64748b;">${row.description || ''}</div>
      </td>
      <td style="text-align:right;color:#0f172a;">${row.billed > 0 ? '৳' + formatNumber(row.billed) : '—'}</td>
      <td style="text-align:right;color:#15803d;">${row.paid > 0 ? '৳' + formatNumber(row.paid) : '—'}</td>
      <td style="text-align:right;font-weight:700;color:${row.balance > 0 ? '#b91c1c' : row.balance < 0 ? '#1d4ed8' : '#15803d'};">
        ৳${formatNumber(Math.abs(row.balance))} ${row.balance < 0 ? 'Adv' : 'Due'}
      </td>
    </tr>
  `).join('')

  const htmlContent = `
    <table class="header-table">
      <tr>
        <td>
          <div class="company-name">${COMPANY_INFO.name}</div>
          <div class="company-sub">${COMPANY_INFO.address}</div>
          <div class="company-sub">Tel: ${COMPANY_INFO.phone} · Email: ${COMPANY_INFO.email}</div>
        </td>
        <td class="doc-title-box">
          <div class="doc-title">Vendor Statement of Account</div>
          <div style="font-size:11px;color:#64748b;margin-top:4px;">
            Statement Date: <strong style="color:#0f172a;">${formatDate(new Date())}</strong>
          </div>
          <div style="font-size:11px;color:#64748b;">
            Supplier: <strong style="color:#0f172a;">${vendor?.name}</strong> (${vendor?.vendorCode})
          </div>
        </td>
      </tr>
    </table>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Vendor Information</div>
        <div class="meta-value">${vendor?.name}</div>
        <div class="meta-sub">Code: ${vendor?.vendorCode} · Status: ${vendor?.isActive ? 'Active' : 'Inactive'}</div>
        <div class="meta-sub">Phone: ${vendor?.mobile ? `${vendor.mobile.countryCode} ${vendor.mobile.number}` : '—'}</div>
        <div class="meta-sub">Email: ${vendor?.email || '—'}</div>
      </div>
      <div>
        <div class="meta-title">Account Balance Summary</div>
        <div style="display:flex;justify-content:space-between;margin-top:2px;">
          <span style="font-size:11px;color:#64748b;">Total Billed:</span>
          <span style="font-size:11px;font-weight:700;">৳${formatNumber(totalBilled)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:2px;">
          <span style="font-size:11px;color:#64748b;">Total Paid:</span>
          <span style="font-size:11px;font-weight:700;color:#15803d;">৳${formatNumber(totalPaid)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;padding-top:4px;border-top:1px dashed #cbd5e1;">
          <span style="font-size:12px;font-weight:800;color:#0f172a;">Net Balance:</span>
          <span style="font-size:13px;font-weight:800;color:${netDue > 0 ? '#b91c1c' : netDue < 0 ? '#1d4ed8' : '#15803d'};">
            ৳${formatNumber(Math.abs(netDue))} ${netDue > 0 ? 'Payable Due' : netDue < 0 ? 'Advance Credit' : 'Settled'}
          </span>
        </div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width:36px;text-align:center;">SL</th>
          <th>Date</th>
          <th>Type</th>
          <th>Reference</th>
          <th>Service / Description</th>
          <th style="text-align:right;">Billed (Debit)</th>
          <th style="text-align:right;">Paid (Credit)</th>
          <th style="text-align:right;">Balance</th>
        </tr>
      </thead>
      <tbody>
        ${ledgerRowsHtml || '<tr><td colspan="8" style="text-align:center;padding:20px;color:#64748b;">No ledger records found.</td></tr>'}
      </tbody>
    </table>

    <div class="sign-grid">
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Prepared By (Accounts)</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Verified By</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Authorized Signatory</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Supplier Acceptance</div>
      </div>
    </div>

    <div class="footer-note">
      Dynamic Travel & Tours Accounts Department · Official Supplier Ledger Statement · Generated ${new Date().toLocaleString()}
    </div>
  `

  openPrintWindow({
    title: `Vendor_Statement_${vendor?.vendorCode || 'Ledger'}`,
    htmlContent,
  })
}

/**
 * Print / PDF General Financial Report (Dues, Payments, Bills, Matrix)
 */
export function printReportDocument({ title, subtitle, dateRange, headers, rows, summaryTotals, metadata = {} }) {
  const metaHtml = Object.entries(metadata)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `<div><span style="color:#64748b;">${k}:</span> <strong>${v}</strong></div>`)
    .join('')

  const headerCells = headers
    .map((h) => `<th style="text-align:${h.align || 'left'};">${h.label}</th>`)
    .join('')

  const dataRowsHtml = rows
    .map((row, idx) => {
      const cells = headers
        .map((h) => {
          const val = typeof h.key === 'function' ? h.key(row, idx) : row[h.key]
          const displayVal = val === null || val === undefined ? '—' : val
          const align = h.align || (typeof val === 'number' || h.isCurrency ? 'right' : 'left')
          return `<td style="text-align:${align};">${displayVal}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  let summaryRowHtml = ''
  if (summaryTotals && summaryTotals.length > 0) {
    summaryRowHtml = `
      <tr style="background:#f1f5f9;font-weight:bold;border-top:2px solid #0f172a;">
        ${summaryTotals
          .map((item) => `<td colspan="${item.colspan || 1}" style="text-align:${item.align || 'left'};font-weight:bold;padding:10px;">${item.value}</td>`)
          .join('')}
      </tr>
    `
  }

  const htmlContent = `
    <table class="header-table">
      <tr>
        <td>
          <div class="company-name">${COMPANY_INFO.name}</div>
          <div class="company-sub">${COMPANY_INFO.address}</div>
          <div class="company-sub">Tel: ${COMPANY_INFO.phone} · Email: ${COMPANY_INFO.email}</div>
        </td>
        <td class="doc-title-box">
          <div class="doc-title">${title || 'Operational Report'}</div>
          ${subtitle ? `<div style="font-size:12px;color:#475569;margin-top:2px;">${subtitle}</div>` : ''}
          <div style="font-size:11px;color:#64748b;margin-top:4px;">
            Generated: <strong style="color:#0f172a;">${new Date().toLocaleString()}</strong>
          </div>
          ${dateRange ? `<div style="font-size:11px;color:#64748b;">Period: <strong>${dateRange}</strong></div>` : ''}
        </td>
      </tr>
    </table>

    ${metaHtml ? `<div style="display:flex;gap:16px;margin-bottom:16px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:11px;">${metaHtml}</div>` : ''}

    <table class="data-table">
      <thead>
        <tr>${headerCells}</tr>
      </thead>
      <tbody>
        ${dataRowsHtml}
      </tbody>
      ${summaryRowHtml ? `<tfoot>${summaryRowHtml}</tfoot>` : ''}
    </table>

    <div class="sign-grid">
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Prepared By</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Verified By</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Accounts Head</div>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Management Approval</div>
      </div>
    </div>

    <div class="footer-note">
      Dynamic Travel & Tours Management Reporting System · Printed on ${new Date().toLocaleString()}
    </div>
  `

  openPrintWindow({
    title: title.replace(/\s+/g, '_'),
    htmlContent,
  })
}
