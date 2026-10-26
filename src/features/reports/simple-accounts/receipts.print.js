import { COMPANY } from '@/features/reports/accounting/coa'
import { formatMoney } from '@/features/reports/reports.api'
import { numberToWords, openPrintWindow } from '@/utils/exportEngine'

const esc = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const dateText = (value) => {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const logoUrl = () => new URL('/company_logo.png', window.location.origin).href

export function receiptHtml(receipt) {
  const balance =
    receipt.dueNow > 0
      ? `<span style="color:#c62828;font-weight:700;">Due ${esc(formatMoney(receipt.dueNow))}</span>`
      : `<span style="color:#0f8a4f;font-weight:700;">Paid</span>`
  const purpose = receipt.invoiceNo
    ? `${receipt.invoiceNo} · ${receipt.category}`
    : 'Overall / Advance'
  const note = receipt.note || 'Thank you for your payment.'

  return `
  <div style="font-family:'IBM Plex Sans',Arial,sans-serif;color:#111;background:#fff;border:1px solid #d9dde5;border-radius:4px;padding:26px 30px 22px;max-width:820px;margin:0 auto;position:relative;overflow:hidden;">
    <div style="position:absolute;inset:0 0 auto;height:5px;background:#2F80ED;"></div>
    <div style="display:flex;justify-content:space-between;gap:22px;align-items:flex-start;margin-top:8px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <img src="${logoUrl()}" alt="ABL Travels" style="width:86px;height:86px;object-fit:contain;" />
        <div>
          <div style="font-size:24px;font-weight:800;color:#2F80ED;letter-spacing:-0.4px;">${esc(COMPANY.name)}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">${esc(COMPANY.tagline)}</div>
        </div>
      </div>
      <div style="text-align:right;font-size:11.5px;line-height:1.55;color:#334155;max-width:300px;">
        <div style="font-weight:700;color:#111;font-size:13px;">${esc(COMPANY.legalName)}</div>
        <div>${esc(COMPANY.address)}</div>
        <div>Mobile: ${esc(COMPANY.phone)}</div>
        <div>Email: ${esc(COMPANY.email)}</div>
        <div>${esc(COMPANY.web)}</div>
      </div>
    </div>

    <div style="text-align:center;margin:16px 0 18px;">
      <div style="font-size:19px;font-weight:800;letter-spacing:0.8px;">MONEY RECEIPT</div>
      <div style="font-size:11.5px;color:#64748b;">(Client Copy)</div>
    </div>

    <div style="display:flex;justify-content:space-between;gap:20px;border-bottom:1px dashed #94a3b8;padding-bottom:9px;font-size:13px;">
      <div>Receipt No: <strong>${esc(receipt.no)}</strong></div>
      <div>Date: <strong>${esc(dateText(receipt.date))}</strong></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 230px;gap:20px;border-bottom:1px dashed #94a3b8;padding:11px 0;font-size:13px;">
      <div>Received with thanks from: <strong>${esc(receipt.clientName)}</strong></div>
      <div style="text-align:right;">${balance}</div>
    </div>

    <div style="border-bottom:1px dashed #94a3b8;padding:10px 0;font-size:13px;">
      Amount In Word: <strong>${esc(numberToWords(receipt.totalApplied || receipt.amount))}</strong>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;border-bottom:1px dashed #94a3b8;padding:10px 0;font-size:13px;">
      <div>Payment For: <strong>${esc(purpose)}</strong></div>
      <div>Paid Via: <strong>${esc(receipt.paymentType)}</strong></div>
      <div>Account Name: <strong>${esc(COMPANY.name)}</strong></div>
      <div>Invoice Type: <strong>${esc(receipt.invoiceType)}</strong></div>
    </div>

    <div style="border-bottom:1px dashed #94a3b8;padding:10px 0;font-size:13px;min-height:34px;">
      For the purpose of: <span style="color:#475569;">${esc(note)}</span>
    </div>

    <div style="display:flex;gap:12px;margin:16px 0 18px;flex-wrap:wrap;">
      <div style="border:1px solid #2F80ED;background:#eff6ff;border-radius:6px;padding:8px 16px;font-size:13px;">
        Amount: <strong>${esc(formatMoney(receipt.totalApplied || receipt.amount))}</strong>
      </div>
      <div style="border:1px solid #2F80ED;background:#eff6ff;border-radius:6px;padding:8px 16px;font-size:13px;">
        Rec. Amount: <strong>${esc(formatMoney(receipt.amount))}</strong>
      </div>
      ${receipt.discount > 0 ? `<div style="border:1px solid #f59e0b;background:#fffbeb;border-radius:6px;padding:8px 16px;font-size:13px;">Discount: <strong>${esc(formatMoney(receipt.discount))}</strong></div>` : ''}
    </div>

    <div style="font-size:12.5px;color:#334155;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:12px;">
      Thank you for choosing <strong>${esc(COMPANY.name)}</strong>. We are with you for every journey.
      This is a computer-generated receipt.
    </div>

    <div style="display:flex;justify-content:space-between;gap:30px;margin-top:46px;font-size:12px;">
      <div style="border-top:1px solid #475569;padding-top:7px;width:220px;text-align:center;">Customer Signature</div>
      <div style="border-top:1px solid #475569;padding-top:7px;width:220px;text-align:center;">Authority Signature</div>
    </div>
  </div>`
}

export function printSimpleReceipt(receipt) {
  openPrintWindow({
    title: `Money_Receipt_${receipt.no}`,
    htmlContent: receiptHtml(receipt),
  })
}
