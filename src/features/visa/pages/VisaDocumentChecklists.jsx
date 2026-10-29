import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/common/Button'
import Select from '../../../components/common/Select'
import Input from '../../../components/common/Input'
import Loader from '../../../components/common/Loader'
import { visaApi, APPLICANT_TYPES, CHECKLIST_REQUIREMENTS, DOCUMENT_SUBMISSION_MODES } from '../visa.api'
import { useAction } from '../../../hooks/useAction'
import { usePermission } from '../../../hooks/usePermission'
import { PERMISSIONS } from '../../../utils/permissions'
import { APP_ROUTES } from '../../../utils/constants'
import { titleCase } from '../../../utils/formatters'

const blankItem = () => ({ label: '', requirement: 'required', submissionMode: 'digital', fileFormats: 'PDF/JPG/PNG', maxSizeMb: 10, active: true })

// The documents an application of one country, visa type and applicant type must bring. Saved as one list. An application's
// uploads are checked against this list. The "Visa Check List" pages that staff read are on the Checklists page.
export default function VisaDocumentChecklists() {
  const run = useAction()
  const { can } = usePermission()
  const canEdit = can(PERMISSIONS.VISA_EDIT)

  const [countries, setCountries] = useState([])
  const [types, setTypes] = useState([])
  const [countryId, setCountryId] = useState('')
  const [visaTypeId, setVisaTypeId] = useState('')
  const [applicantType, setApplicantType] = useState('individual')
  const [items, setItems] = useState([])
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingList, setLoadingList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    run(() => Promise.all([visaApi.listCountries(), visaApi.listVisaTypes()])).then(({ ok, value }) => {
      if (ok) {
        setCountries(value[0].items)
        setTypes(value[1].items)
        const first = value[0].items[0]
        if (first) setCountryId(first.id)
      }
      setLoading(false)
    })
  }, [run])

  const countryTypes = useMemo(() => types.filter((type) => type.countryId === countryId), [types, countryId])

  // Choosing a country picks its first visa type.
  useEffect(() => {
    setVisaTypeId((current) => (countryTypes.some((type) => type.id === current) ? current : (countryTypes[0]?.id ?? '')))
  }, [countryTypes])

  const loadChecklist = useCallback(async () => {
    if (!countryId || !visaTypeId) {
      setItems([])
      return
    }
    setLoadingList(true)
    const { ok, value } = await run(() => visaApi.getChecklist({ countryId, visaTypeId, applicantType }))
    if (ok) {
      setItems(value.items)
      setIsDefault(Boolean(value.isDefault))
      setDirty(false)
    }
    setLoadingList(false)
  }, [countryId, visaTypeId, applicantType, run])

  useEffect(() => {
    loadChecklist()
  }, [loadChecklist])

  function change(index, patch) {
    setItems((list) => list.map((item, position) => (position === index ? { ...item, ...patch } : item)))
    setDirty(true)
  }

  function remove(index) {
    setItems((list) => list.filter((_, position) => position !== index))
    setDirty(true)
  }

  function move(index, step) {
    setItems((list) => {
      const next = [...list]
      const target = index + step
      if (target < 0 || target >= next.length) return list
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setDirty(true)
  }

  async function save() {
    if (items.some((item) => !item.label.trim())) {
      await run(() => Promise.reject(new Error('Every item needs a name.')))
      return
    }
    setSaving(true)
    const { ok, value } = await run(() => visaApi.saveChecklist({ countryId, visaTypeId, applicantType, items }), { success: 'Checklist saved.' })
    if (ok) {
      setItems(value.items)
      setIsDefault(false)
      setDirty(false)
    }
    setSaving(false)
  }

  if (loading) return <Loader label="Loading…" />

  return (
    <div className="stack">
      <PageHeader title="Document checklists" breadcrumbs={[{ label: 'Visa' }, { label: 'Checklists', to: APP_ROUTES.VISA_CHECKLIST }, { label: 'Document checklists' }]} />

      <div className="card stack">
        <div className="filters">
          <Select label="Country" value={countryId} onChange={(event) => setCountryId(event.target.value)} options={countries.map((country) => ({ value: country.id, label: country.name }))} />
          <Select label="Visa type" value={visaTypeId} onChange={(event) => setVisaTypeId(event.target.value)} options={countryTypes.map((type) => ({ value: type.id, label: type.name }))} />
          <Select label="Applicant type" value={applicantType} onChange={(event) => setApplicantType(event.target.value)} options={APPLICANT_TYPES.map((type) => ({ value: type, label: titleCase(type) }))} />
        </div>

        {!visaTypeId ? <p className="muted">This country has no visa type yet. Add one on the Visa types page.</p> : null}

        {visaTypeId && isDefault ? <div className="alert alert--info">Nothing is saved for this combination yet. This is a starting list. Change it and save.</div> : null}

        {visaTypeId ? (
          <div className="stack">
            {loadingList ? <Loader label="Loading checklist…" /> : null}
            {!loadingList && items.length === 0 ? <p className="muted">No documents listed.</p> : null}
            {!loadingList
              ? items.map((item, index) => (
                  <div key={item.id ?? `new-${index}`} className="card" style={{ padding: 12 }}>
                    <div className="grid grid--3">
                      <Input label="Document" value={item.label} disabled={!canEdit} onChange={(event) => change(index, { label: event.target.value })} />
                      <Select label="Requirement" value={item.requirement} disabled={!canEdit} onChange={(event) => change(index, { requirement: event.target.value })} options={CHECKLIST_REQUIREMENTS.map((value) => ({ value, label: titleCase(value) }))} />
                      <Select label="How it is given" value={item.submissionMode} disabled={!canEdit} onChange={(event) => change(index, { submissionMode: event.target.value })} options={DOCUMENT_SUBMISSION_MODES.map((value) => ({ value, label: titleCase(value) }))} />
                    </div>
                    <div className="grid grid--3" style={{ marginTop: 8 }}>
                      <Input label="File formats" value={item.fileFormats} disabled={!canEdit} onChange={(event) => change(index, { fileFormats: event.target.value })} />
                      <Input label="Largest file (MB)" type="number" min={1} max={25} value={item.maxSizeMb} disabled={!canEdit} onChange={(event) => change(index, { maxSizeMb: Number(event.target.value) || 1 })} />
                      <div className="field">
                        <span className="field__label">In use</span>
                        <label className="checkbox">
                          <input type="checkbox" checked={item.active} disabled={!canEdit} onChange={(event) => change(index, { active: event.target.checked })} />
                          {item.active ? 'Active' : 'Not asked for'}
                        </label>
                      </div>
                    </div>
                    {canEdit ? (
                      <div className="row" style={{ gap: 8, marginTop: 8 }}>
                        <Button size="sm" variant="ghost" onClick={() => move(index, -1)} disabled={index === 0}>Up</Button>
                        <Button size="sm" variant="ghost" onClick={() => move(index, 1)} disabled={index === items.length - 1}>Down</Button>
                        <Button size="sm" variant="danger" onClick={() => remove(index)}>Remove</Button>
                      </div>
                    ) : null}
                  </div>
                ))
              : null}

            {canEdit ? (
              <div className="row" style={{ gap: 8 }}>
                <Button variant="ghost" onClick={() => { setItems((list) => [...list, blankItem()]); setDirty(true) }}>Add a document</Button>
                <Button onClick={save} loading={saving} disabled={!dirty}>Save checklist</Button>
                {dirty ? <Button variant="ghost" onClick={loadChecklist}>Discard changes</Button> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
