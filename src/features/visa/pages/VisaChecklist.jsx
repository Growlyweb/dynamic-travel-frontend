import { useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Select from '../../../components/common/Select'
import Input from '../../../components/common/Input'
import { visaApi, APPLICANT_TYPES, CHECKLIST_REQUIREMENTS, DOCUMENT_SUBMISSION_MODES } from '../visa.api'

const APPLICANT_TYPE_LABELS = {
  individual: 'Individual',
  business: 'Business applicant',
  student: 'Student',
  employee: 'Employee',
  sponsored: 'Sponsored',
}

const REQUIREMENT_TONES = { required: 'danger', optional: 'info', conditional: 'warning' }

const EMPTY_SELECTION = { countryId: '', visaTypeId: '', applicantType: 'individual' }

export default function VisaChecklist() {
  const [countries, setCountries] = useState([])
  const [visaTypes, setVisaTypes] = useState([])
  const [selection, setSelection] = useState(EMPTY_SELECTION)
  const [checklist, setChecklist] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [newItem, setNewItem] = useState({ label: '', requirement: 'required' })

  useEffect(() => {
    visaApi.listCountries().then((result) => setCountries(result.items ?? []))
  }, [])

  useEffect(() => {
    if (!selection.countryId) {
      setVisaTypes([])
      return
    }
    visaApi.listVisaTypes({ countryId: selection.countryId }).then((result) => {
      const items = result.items ?? []
      setVisaTypes(items)
      setSelection((current) => ({
        ...current,
        visaTypeId: items.some((type) => type.id === current.visaTypeId) ? current.visaTypeId : items[0]?.id ?? '',
      }))
    })
  }, [selection.countryId])

  const { countryId, visaTypeId, applicantType } = selection

  useEffect(() => {
    if (!visaTypeId) {
      setChecklist(null)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    visaApi
      .getChecklist({ countryId, visaTypeId, applicantType })
      .then((result) => {
        if (!cancelled) {
          setChecklist(result)
          setDirty(false)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [countryId, visaTypeId, applicantType])

  function updateItem(itemId, patch) {
    setChecklist((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    }))
    setDirty(true)
  }

  function moveItem(index, direction) {
    setChecklist((current) => {
      const items = [...current.items]
      const target = items[index + direction]
      if (!target) return current
      ;[items[index], items[index + direction]] = [target, items[index]]
      return { ...current, items }
    })
    setDirty(true)
  }

  function removeItem(itemId) {
    setChecklist((current) => ({ ...current, items: current.items.filter((item) => item.id !== itemId) }))
    setDirty(true)
  }

  function addItem(event) {
    event.preventDefault()
    const label = newItem.label.trim()
    if (!label) return
    setChecklist((current) => ({
      ...current,
      items: [...current.items, { id: `new_${Date.now().toString(36)}`, label, requirement: newItem.requirement, active: true, submissionMode: 'digital', fileFormats: 'PDF/JPG/PNG', maxSizeMb: 10 }],
    }))
    setNewItem({ label: '', requirement: 'required' })
    setDirty(true)
  }

  async function handleSave() {
    if (!checklist) return
    setSaving(true)
    try {
      const saved = await visaApi.saveChecklist({ ...selection, items: checklist.items })
      setChecklist(saved)
      setDirty(false)
      setSavedAt(new Date())
    } finally {
      setSaving(false)
    }
  }

  const selectedCountry = countries.find((country) => country.id === selection.countryId)
  const selectedType = visaTypes.find((type) => type.id === selection.visaTypeId)
  const requiredCount = checklist?.items.filter((item) => item.active && item.requirement === 'required').length ?? 0

  return (
    <div className="stack">
      <PageHeader
        title="Visa checklists"
        // description="Country-wise document requirements. Pick a country, visa type and applicant type, then manage the checklist — no code changes needed."
        breadcrumbs={[{ label: 'Visa' }, { label: 'Checklists' }]}
        actions={
          checklist ? (
            <Button onClick={handleSave} loading={saving} disabled={!dirty}>
              {dirty ? 'Save changes' : savedAt ? 'Saved' : 'No changes'}
            </Button>
          ) : null
        }
      />

      <div className="card stack">
        <div className="filters">
          <Select
            label="Country"
            placeholder="Select country"
            value={selection.countryId}
            onChange={(event) => setSelection((current) => ({ ...current, countryId: event.target.value, visaTypeId: '' }))}
            options={countries.map((country) => ({ value: country.id, label: ` ${country.name}` }))}
          />
          <Select
            label="Visa type"
            placeholder={selection.countryId ? 'Select visa type' : 'Select a country first'}
            value={selection.visaTypeId}
            onChange={(event) => setSelection((current) => ({ ...current, visaTypeId: event.target.value }))}
            options={visaTypes.map((type) => ({ value: type.id, label: type.name }))}
          />
          <Select
            label="Applicant type"
            value={selection.applicantType}
            onChange={(event) => setSelection((current) => ({ ...current, applicantType: event.target.value }))}
            options={APPLICANT_TYPES.map((type) => ({ value: type, label: APPLICANT_TYPE_LABELS[type] }))}
          />
        </div>

        {checklist ? (
          <div className="stack stack--sm">
            <div className="row between row--wrap">
              <p className="muted small" style={{ margin: 0 }}>
                Checklist for <span className="strong">{selectedCountry?.name} · {selectedType?.name} · {APPLICANT_TYPE_LABELS[selection.applicantType]}</span>
                {checklist.isDefault ? ' — not configured yet, showing a default template.' : ''}
              </p>
              <p className="muted small" style={{ margin: 0 }}>
                {checklist.items.length} items · {requiredCount} required
              </p>
            </div>

            {loading ? (
              <p className="muted">Loading checklist…</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>Order</th>
                      <th>Document</th>
                      <th style={{ width: 170 }}>Requirement</th>
                      <th style={{ width: 130 }}>Submission</th>
                      <th style={{ width: 220 }}>File rule</th>
                      <th style={{ width: 90 }}>Included</th>
                      <th style={{ width: 80 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {checklist.items.map((item, index) => (
                      <tr key={item.id}>
                        <td>
                          <span className="row" style={{ gap: 4 }}>
                            <span className="muted small">{index + 1}</span>
                            <button type="button" className="icon-btn" aria-label="Move up" disabled={index === 0} onClick={() => moveItem(index, -1)}>▲</button>
                            <button type="button" className="icon-btn" aria-label="Move down" disabled={index === checklist.items.length - 1} onClick={() => moveItem(index, 1)}>▼</button>
                          </span>
                        </td>
                        <td>
                          <input
                            className="field__control"
                            value={item.label}
                            aria-label="Document label"
                            onChange={(event) => updateItem(item.id, { label: event.target.value })}
                          />
                        </td>
                        <td>
                          <div className="row" style={{ gap: 8 }}>
                            <select
                              className="field__control"
                              value={item.requirement}
                              aria-label="Requirement"
                              onChange={(event) => updateItem(item.id, { requirement: event.target.value })}
                            >
                              {CHECKLIST_REQUIREMENTS.map((requirement) => (
                                <option key={requirement} value={requirement}>
                                  {requirement[0].toUpperCase() + requirement.slice(1)}
                                </option>
                              ))}
                            </select>
                            <Badge tone={REQUIREMENT_TONES[item.requirement] ?? 'neutral'}>{item.requirement}</Badge>
                          </div>
                        </td>
                        <td>
                          <select
                            className="field__control"
                            value={item.submissionMode ?? 'digital'}
                            aria-label="Submission mode"
                            onChange={(event) => updateItem(item.id, { submissionMode: event.target.value })}
                          >
                            {DOCUMENT_SUBMISSION_MODES.map((mode) => (
                              <option key={mode} value={mode}>
                                {mode === 'both' ? 'Digital + Physical' : mode[0].toUpperCase() + mode.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="row" style={{ gap: 6 }}>
                            <input
                              className="field__control"
                              value={item.fileFormats ?? 'PDF/JPG/PNG'}
                              aria-label="File formats"
                              placeholder="PDF/JPG"
                              onChange={(event) => updateItem(item.id, { fileFormats: event.target.value })}
                            />
                            <input
                              className="field__control"
                              type="number"
                              min="1"
                              style={{ width: 76 }}
                              value={item.maxSizeMb ?? 10}
                              aria-label="Max size (MB)"
                              title="Maximum file size (MB)"
                              onChange={(event) => updateItem(item.id, { maxSizeMb: Number(event.target.value) || 10 })}
                            />
                          </div>
                        </td>
                        <td>
                          <label className="checkbox">
                            <input
                              type="checkbox"
                              checked={item.active}
                              onChange={(event) => updateItem(item.id, { active: event.target.checked })}
                            />
                            {item.active ? 'Active' : 'Off'}
                          </label>
                        </td>
                        <td className="table-actions">
                          <Button size="sm" variant="danger" onClick={() => removeItem(item.id)}>
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!checklist.items.length ? (
                      <tr>
                        <td colSpan={7} className="muted" style={{ textAlign: 'center' }}>
                          No documents yet — add the first requirement below.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <form className="row row--wrap" style={{ gap: 8, alignItems: 'flex-end' }} onSubmit={addItem}>
              <Input
                label="Add document"
                value={newItem.label}
                onChange={(event) => setNewItem((current) => ({ ...current, label: event.target.value }))}
                placeholder="e.g. Travel Insurance"
                style={{ minWidth: 260 }}
              />
              <Select
                label="Requirement"
                value={newItem.requirement}
                onChange={(event) => setNewItem((current) => ({ ...current, requirement: event.target.value }))}
                options={CHECKLIST_REQUIREMENTS.map((requirement) => ({ value: requirement, label: requirement[0].toUpperCase() + requirement.slice(1) }))}
              />
              <Button type="submit" variant="subtle">+ Add item</Button>
            </form>
          </div>
        ) : (
          <p className="muted">
            {selection.countryId && selection.visaTypeId
              ? 'Loading checklist…'
              : 'Select a country and visa type to manage its checklist.'}
          </p>
        )}
      </div>
    </div>
  )
}
