import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Modal from '../../../components/common/Modal'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import { visaApi, VISA_PARTNERS } from '../visa.api'
import { formatDate, formatCurrency } from '../../../utils/formatters'

const QUOTATION_STATUS_TONES = { draft: 'neutral', sent: 'info', accepted: 'success', expired: 'warning' }

export default function VisaQuotations() {
  const [rows, setRows] = useState([])
  const [countries, setCountries] = useState([])
  const [visaTypes, setVisaTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [quotationResult, countryResult, typeResult] = await Promise.all([
        visaApi.listQuotations(),
        visaApi.listCountries(),
        visaApi.listVisaTypes(),
      ])
      setRows(quotationResult.items ?? [])
      setCountries(countryResult.items ?? [])
      setVisaTypes(typeResult.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(quotation, status) {
    await visaApi.updateQuotation(quotation.id, { status })
    await load()
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await visaApi.removeQuotation(pendingDelete.id)
      setPendingDelete(null)
      await load()
    } finally {
      setDeleting(false)
    }
  }

  /** Opens a print-friendly quotation document in a new tab (spec #11: Generate PDF → Share). */
  function printQuotation(quotation) {
    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (!printWindow) return
    printWindow.document.write(`<!doctype html><html><head><title>${quotation.number}</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 40px; }
        .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 16px; }
        .brand { font-size: 22px; font-weight: 700; }
        .muted { color: #555; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th, td { border: 1px solid #ccc; padding: 8px 10px; font-size: 13px; text-align: left; }
        th { background: #f3f4f6; }
        .totals td { border: none; padding: 4px 10px; }
        .totals .grand { font-size: 16px; font-weight: 700; border-top: 2px solid #111; }
        .footer { margin-top: 32px; font-size: 11px; color: #555; }
      </style></head><body>
      <div class="head">
        <div><div class="brand">Dynamic Travel</div><div class="muted">Visa Services · Dhaka, Bangladesh</div></div>
        <div style="text-align:right">
          <div class="brand" style="font-size:16px">QUOTATION</div>
          <div class="muted">${quotation.number}<br/>Date: ${formatDate(quotation.createdAt)}<br/>Valid until: ${formatDate(quotation.validUntil)}</div>
        </div>
      </div>
      <p style="margin-top:20px"><strong>B2B Partner:</strong> ${quotation.partner}<br/><strong>Client:</strong> ${quotation.clientName}</p>
      <table>
        <thead><tr><th>Service</th><th>Country</th><th>Qty</th><th>Net price</th><th>Amount</th></tr></thead>
        <tbody>
          <tr><td>${quotation.visaType}</td><td>${quotation.country}</td><td>${quotation.quantity}</td><td>${formatCurrency(quotation.netPrice, quotation.currency)}</td><td>${formatCurrency(quotation.netPrice * quotation.quantity, quotation.currency)}</td></tr>
          <tr><td>Additional service fee</td><td>—</td><td>—</td><td>—</td><td>${formatCurrency(quotation.additionalFee, quotation.currency)}</td></tr>
        </tbody>
      </table>
      <table class="totals">
        <tr><td></td><td style="text-align:right">Grand total (${quotation.currency})</td><td class="grand" style="text-align:right">${formatCurrency(quotation.total, quotation.currency)}</td></tr>
      </table>
      ${quotation.notes ? `<p class="muted" style="margin-top:16px"><strong>Notes:</strong> ${quotation.notes}</p>` : ''}
      <p class="footer">This quotation is generated from the partner net price configured in our system and is valid until ${formatDate(quotation.validUntil)}. Prices may change after this date.</p>
      <script>window.onload = function () { window.print(); }</script>
      </body></html>`)
    printWindow.document.close()
  }

  return (
    <div className="stack">
      <PageHeader
        title="B2B quotations"
        description="Partner quotations with net pricing. Totals are calculated from the configured B2B net price — never entered by hand."
        breadcrumbs={[{ label: 'Visa' }, { label: 'Quotations' }]}
        actions={<Button onClick={() => setCreateOpen(true)}>+ New quotation</Button>}
      />

      <div className="card">
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No quotations yet"
          emptyDescription="Create a quotation for a B2B partner to share with their client."
          columns={[
            { key: 'number', header: 'Quotation', render: (row) => <span className="strong">{row.number}</span> },
            {
              key: 'partner',
              header: 'Partner / client',
              render: (row) => (
                <span>
                  <span className="strong">{row.partner}</span>
                  <br />
                  {/* <span className="muted small">{row.clientName}</span> */}
                </span>
              ),
            },
            {
              key: 'visaType',
              header: 'Service',
              render: (row) => (
                <span>
                  {row.visaType}
                  <br />
                  <span className="muted small">{row.country}</span>
                </span>
              ),
            },
            { key: 'quantity', header: 'Qty' },
            { key: 'netPrice', header: 'Net', render: (row) => formatCurrency(row.netPrice, row.currency) },
            { key: 'additionalFee', header: 'Extra fees', render: (row) => formatCurrency(row.additionalFee, row.currency) },
            { key: 'total', header: 'Total', render: (row) => <span className="strong">{formatCurrency(row.total, row.currency)}</span> },
            { key: 'validUntil', header: 'Valid until', render: (row) => formatDate(row.validUntil) },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge tone={QUOTATION_STATUS_TONES[row.status] ?? 'neutral'}>{row.status}</Badge>,
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <span className="table-actions">
                  <Button size="sm" variant="ghost" onClick={() => setViewing(row)}>View</Button>
                  <Button size="sm" variant="ghost" onClick={() => printQuotation(row)}>Print / PDF</Button>
                  {row.status === 'draft' ? (
                    <Button size="sm" variant="subtle" onClick={() => setStatus(row, 'sent')}>Mark sent</Button>
                  ) : null}
                  {row.status === 'sent' ? (
                    <Button size="sm" variant="subtle" onClick={() => setStatus(row, 'accepted')}>Mark accepted</Button>
                  ) : null}
                  <Button size="sm" variant="danger" onClick={() => setPendingDelete(row)}>Delete</Button>
                </span>
              ),
            },
          ]}
        />
      </div>

      <CreateQuotationDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        countries={countries}
        visaTypes={visaTypes}
        onSaved={load}
      />

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? `Quotation ${viewing.number}` : ''}
        description={viewing ? `${viewing.partner} → ${viewing.clientName}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>
            {viewing ? <Button onClick={() => printQuotation(viewing)}>Print / PDF</Button> : null}
          </>
        }
      >
        {viewing ? (
          <dl className="detail-list">
            <div><dt>Country / visa type</dt><dd>{viewing.country} — {viewing.visaType}</dd></div>
            <div><dt>Quantity</dt><dd>{viewing.quantity}</dd></div>
            <div><dt>Net price (B2B)</dt><dd>{formatCurrency(viewing.netPrice, viewing.currency)}</dd></div>
            <div><dt>Additional service fee</dt><dd>{formatCurrency(viewing.additionalFee, viewing.currency)}</dd></div>
            <div><dt>Total</dt><dd className="strong">{formatCurrency(viewing.total, viewing.currency)}</dd></div>
            <div><dt>Created</dt><dd>{formatDate(viewing.createdAt)}</dd></div>
            <div><dt>Valid until</dt><dd>{formatDate(viewing.validUntil)}</dd></div>
            <div><dt>Notes</dt><dd>{viewing.notes || '—'}</dd></div>
          </dl>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete quotation"
        message={`Delete quotation ${pendingDelete?.number ?? ''}? This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

function CreateQuotationDialog({ open, onClose, countries, visaTypes, onSaved }) {
  const [values, setValues] = useState({ partner: '', clientName: '', countryId: '', visaTypeId: '', quantity: '1', additionalFee: '0', validUntil: '', notes: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setValues({ partner: '', clientName: '', countryId: '', visaTypeId: '', quantity: '1', additionalFee: '0', validUntil: '', notes: '' })
      setErrors({})
    }
  }, [open])

  const selectedType = useMemo(
    () => visaTypes.find((type) => type.id === values.visaTypeId),
    [visaTypes, values.visaTypeId],
  )
  const countryTypes = visaTypes.filter((type) => type.countryId === values.countryId)
  const computedTotal = selectedType
    ? (selectedType.b2bNetPrice ?? 0) * (Number(values.quantity) || 1) + (Number(values.additionalFee) || 0)
    : 0

  function setValue(name, value) {
    setValues((current) => {
      if (name === 'countryId') return { ...current, countryId: value, visaTypeId: '' }
      return { ...current, [name]: value }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const next = {}
    if (!values.partner) next.partner = 'Select the B2B partner.'
    if (!values.clientName.trim()) next.clientName = 'Client name is required.'
    if (!values.visaTypeId) next.visaTypeId = 'Select the visa service.'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    try {
      const country = countries.find((item) => item.id === values.countryId)
      await visaApi.createQuotation({
        partner: values.partner,
        clientName: values.clientName.trim(),
        countryId: values.countryId,
        visaTypeId: values.visaTypeId,
        country: country?.name ?? '',
        visaType: selectedType?.name ?? '',
        quantity: Number(values.quantity) || 1,
        additionalFee: Number(values.additionalFee) || 0,
        validUntil: values.validUntil || null,
        notes: values.notes.trim(),
      })
      onSaved?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New quotation"
      description="The net price comes from the visa type configuration; you only add quantity and any extra service fee."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving}>Create quotation</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="stack">
        <div className="grid grid--2">
          <Select
            label="B2B partner"
            value={values.partner}
            error={errors.partner}
            onChange={(event) => setValue('partner', event.target.value)}
            placeholder="Select partner"
            options={VISA_PARTNERS.map((partner) => ({ value: partner, label: partner }))}
          />
          <Input
            label="Client / applicant name"
            value={values.clientName}
            error={errors.clientName}
            onChange={(event) => setValue('clientName', event.target.value)}
            placeholder="Rahim Ahmed"
          />
        </div>
        <div className="grid grid--2">
          <Select
            label="Country"
            value={values.countryId}
            onChange={(event) => setValue('countryId', event.target.value)}
            placeholder="Select country"
            options={countries.map((country) => ({ value: country.id, label: `${country.flag} ${country.name}` }))}
          />
          <Select
            label="Visa type"
            value={values.visaTypeId}
            error={errors.visaTypeId}
            onChange={(event) => setValue('visaTypeId', event.target.value)}
            placeholder={values.countryId ? 'Select visa type' : 'Select a country first'}
            options={countryTypes.map((type) => ({
              value: type.id,
              label: `${type.name} — net ${formatCurrency(type.b2bNetPrice ?? 0, type.currency)}`,
            }))}
          />
        </div>
        <div className="grid grid--3">
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={values.quantity}
            onChange={(event) => setValue('quantity', event.target.value)}
          />
          <Input
            label="Additional service fee"
            type="number"
            min="0"
            value={values.additionalFee}
            onChange={(event) => setValue('additionalFee', event.target.value)}
          />
          <Input
            label="Valid until"
            type="date"
            value={values.validUntil}
            onChange={(event) => setValue('validUntil', event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="quotation-notes">Notes</label>
          <textarea
            id="quotation-notes"
            className="field__control"
            rows={2}
            value={values.notes}
            onChange={(event) => setValue('notes', event.target.value)}
            placeholder="Optional notes shown on the quotation."
          />
        </div>
        {selectedType ? (
          <div className="alert alert--info">
            <p className="small" style={{ margin: 0 }}>
              Net {formatCurrency(selectedType.b2bNetPrice ?? 0, selectedType.currency)} × {Number(values.quantity) || 1}{' '}
              + fees {formatCurrency(Number(values.additionalFee) || 0, selectedType.currency)} ={' '}
              <strong>{formatCurrency(computedTotal, selectedType.currency)}</strong> (calculated by the backend, not editable)
            </p>
          </div>
        ) : null}
      </form>
    </Modal>
  )
}
