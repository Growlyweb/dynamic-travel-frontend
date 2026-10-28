import { useEffect, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import RoleChecklist from './RoleChecklist'
import { usersApi, rolesApi } from '../users.api'
import { errorMessage, fieldErrors } from '../../../utils/errors'

const EMPTY = { name: '', email: '', phone: '' }

// A new staff account always gets a role. Leave them all unticked and the person gets "No access yet",
// so they can sign in once they set a password but cannot open anything until an admin decides.
export default function CreateStaffModal({ open, onClose, onCreated }) {
  const [values, setValues] = useState(EMPTY)
  const [roles, setRoles] = useState([])
  const [roleIds, setRoleIds] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(EMPTY)
    setRoleIds([])
    setErrors({})
    setFormError(null)
    rolesApi.list().then((list) => setRoles(list.filter((role) => !role.system))).catch(() => setRoles([]))
  }, [open])

  async function handleSubmit(event) {
    event.preventDefault()
    const found = {}
    if (values.name.trim().length < 2) found.name = 'Enter the name.'
    if (!values.email.trim()) found.email = 'Enter the email address. The invitation is sent there.'
    setErrors(found)
    if (Object.keys(found).length) return

    setSaving(true)
    setFormError(null)
    try {
      const result = await usersApi.createStaff({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        roleIds: roleIds.length ? roleIds : undefined,
      })
      onCreated?.(result)
    } catch (error) {
      setErrors(fieldErrors(error))
      setFormError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="New staff member"
      description="They get an email with a link to choose their password."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Create and send invitation
          </Button>
        </>
      }
    >
      <form className="stack" onSubmit={handleSubmit} noValidate>
        {formError ? <div className="alert alert--danger">{formError}</div> : null}
        <Input label="Name" value={values.name} error={errors.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
        <Input label="Email" type="email" value={values.email} error={errors.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
        <Input label="Phone (optional)" value={values.phone} error={errors.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} />
        <div>
          <p className="field__label">Roles</p>
          <RoleChecklist roles={roles} selected={roleIds} onChange={setRoleIds} />
          <p className="field__hint">Leave empty to start with "No access yet".</p>
        </div>
      </form>
    </Modal>
  )
}
