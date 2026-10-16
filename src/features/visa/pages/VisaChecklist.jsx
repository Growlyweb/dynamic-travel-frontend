import { useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Select from '../../../components/common/Select'
import Input from '../../../components/common/Input'
import { ReTablePreview } from '../../../components/re-table'
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
  const [viewMode, setViewMode] = useState('table') // 'table' | 'editor'

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
        title="Checklists"
        breadcrumbs={[{ label: 'Visa' }, { label: 'Checklists' }]}
        actions={
          viewMode === 'editor' && checklist ? (
            <Button onClick={handleSave} loading={saving} disabled={!dirty}>
              {dirty ? 'Save changes' : savedAt ? 'Saved' : 'No changes'}
            </Button>
          ) : null
        }
      />

      <ReTablePreview />

    </div>
  )
}
