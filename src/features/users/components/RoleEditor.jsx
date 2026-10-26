import { useEffect, useMemo, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import Badge from '../../../components/common/Badge'
import AccessSummary from './AccessSummary'
import { rolesApi } from '../users.api'
import { errorMessage, fieldErrors } from '../../../utils/errors'

// Ticking a permission also ticks the ones it needs (edit needs view). Unticking one unticks what needs it.
const withNeeds = (list, code, dependencies) => {
  const result = new Set(list)
  const queue = [code]
  while (queue.length) {
    const current = queue.pop()
    result.add(current)
    ;(dependencies[current] ?? []).forEach((needed) => !result.has(needed) && queue.push(needed))
  }
  return [...result]
}

const withoutDependents = (list, code, dependencies) => {
  const result = new Set(list)
  const queue = [code]
  while (queue.length) {
    const current = queue.pop()
    result.delete(current)
    Object.entries(dependencies).forEach(([key, needs]) => needs.includes(current) && result.has(key) && queue.push(key))
  }
  return [...result]
}

function PermissionBox({ code, label, checked, onToggle, isDefault, sensitive, disabled }) {
  return (
    <label className="checkbox" style={{ alignItems: 'flex-start' }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={() => onToggle(code)} />
      <span>
        <span>{label}</span>
        {isDefault ? <Badge tone="info" className="ml-2">Default</Badge> : null}
        {sensitive ? <span className="small" style={{ display: 'block', color: '#b54708' }}>Be careful: {sensitive}</span> : null}
      </span>
    </label>
  )
}

export default function RoleEditor({ open, role, catalog, onClose, onSaved }) {
  const editing = Boolean(role)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [templateKey, setTemplateKey] = useState('')
  const [permissions, setPermissions] = useState([])
  const [showMore, setShowMore] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const template = catalog?.templates.find((item) => item.key === templateKey) ?? null
  const dependencies = catalog?.dependencies ?? {}
  const text = useMemo(() => Object.fromEntries((catalog?.permissions ?? []).map((item) => [item.code, item.description])), [catalog])

  useEffect(() => {
    if (!open) return
    setName(role?.name ?? '')
    setDescription(role?.description ?? '')
    setTemplateKey(role?.templateKey ?? '')
    setPermissions(role?.permissions ?? [])
    setShowMore(false)
    setErrors({})
    setFormError(null)
  }, [open, role])

  function chooseTemplate(key) {
    setTemplateKey(key)
    const chosen = catalog.templates.find((item) => item.key === key)
    if (chosen) {
      // Start from what the template ticks, keeping the dependencies the server would add anyway.
      setPermissions(chosen.defaults.reduce((list, code) => withNeeds(list, code, dependencies), []))
      if (!name.trim()) setName(chosen.label)
      if (!description.trim()) setDescription(chosen.description)
    }
  }

  function toggle(code) {
    setPermissions((list) => (list.includes(code) ? withoutDependents(list, code, dependencies) : withNeeds(list, code, dependencies)))
  }

  // What the template offers, then everything else. Without a template every permission is in its group.
  const listed = template ? new Set([...template.defaults, ...template.optional]) : new Set()
  const rest = (catalog?.groups ?? [])
    .map((group) => ({ ...group, permissions: group.permissions.filter((code) => !listed.has(code)) }))
    .filter((group) => group.permissions.length)

  async function handleSave() {
    if (name.trim().length < 2) {
      setErrors({ name: 'Give the role a name.' })
      return
    }
    setSaving(true)
    setFormError(null)
    setErrors({})
    const payload = { name: name.trim(), description: description.trim(), templateKey: templateKey || undefined, permissions }
    try {
      const saved = editing ? await rolesApi.update(role.id, { ...payload, templateKey: templateKey || null }) : await rolesApi.create(payload)
      onSaved?.(saved)
    } catch (error) {
      setErrors(fieldErrors(error))
      setFormError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (!catalog) return null

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={editing ? `Edit role: ${role.name}` : 'New role'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {editing ? 'Save role' : 'Create role'}
          </Button>
        </>
      }
    >
      <div className="stack">
        {formError ? <div className="alert alert--danger">{formError}</div> : null}
        {editing && role.userCount > 0 ? (
          <div className="alert alert--info">{role.userCount} {role.userCount === 1 ? 'person has' : 'people have'} this role. A change works for them on their next click.</div>
        ) : null}

        <div className="row" style={{ gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Input className="grow" label="Name" value={name} error={errors.name} onChange={(event) => setName(event.target.value)} />
          <Select
            className="grow"
            label="Start from a template"
            placeholder="Blank role"
            value={templateKey}
            onChange={(event) => chooseTemplate(event.target.value)}
            options={catalog.templates.filter((item) => item.key !== 'no_access').map((item) => ({ value: item.key, label: item.label }))}
          />
        </div>
        <Input label="Description" value={description} error={errors.description} onChange={(event) => setDescription(event.target.value)} />

        {template ? (
          <>
            <div>
              <p className="field__label">
                Included in {template.label}
                {editing ? (
                  <Button variant="ghost" size="sm" className="ml-2" onClick={() => chooseTemplate(templateKey)}>
                    Reset to template
                  </Button>
                ) : null}
              </p>
              <div className="stack" style={{ gap: 6 }}>
                {template.defaults.map((code) => (
                  <PermissionBox key={code} code={code} label={text[code]} checked={permissions.includes(code)} onToggle={toggle} isDefault sensitive={catalog.sensitive[code]} />
                ))}
              </div>
            </div>
            {template.optional.length ? (
              <div>
                <p className="field__label">Suggested extras</p>
                <div className="stack" style={{ gap: 6 }}>
                  {template.optional.map((code) => (
                    <PermissionBox key={code} code={code} label={text[code]} checked={permissions.includes(code)} onToggle={toggle} sensitive={catalog.sensitive[code]} />
                  ))}
                </div>
              </div>
            ) : null}
            <div>
              <Button variant="ghost" size="sm" onClick={() => setShowMore((value) => !value)}>
                {showMore ? 'Hide more permissions' : 'More permissions'}
              </Button>
            </div>
          </>
        ) : null}

        {!template || showMore
          ? rest.map((group) => (
              <div key={group.key}>
                <p className="field__label">{group.label}</p>
                <div className="stack" style={{ gap: 6 }}>
                  {group.permissions.map((code) => (
                    <PermissionBox key={code} code={code} label={text[code]} checked={permissions.includes(code)} onToggle={toggle} sensitive={catalog.sensitive[code]} />
                  ))}
                </div>
              </div>
            ))
          : null}

        <div>
          <p className="field__label">What this role can do</p>
          <AccessSummary permissions={permissions} catalog={catalog} />
        </div>
      </div>
    </Modal>
  )
}
