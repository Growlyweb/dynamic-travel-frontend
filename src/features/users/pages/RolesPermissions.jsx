import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import ErrorState from '../../../components/common/ErrorState'
import Loader from '../../../components/common/Loader'
import RoleEditor from '../components/RoleEditor'
import { Table, TableActions } from '../../../components/re-table'
import { rolesApi } from '../users.api'
import { useToast } from '../../../context/ToastContext'
import { errorMessage } from '../../../utils/errors'

export default function RolesPermissions() {
  const toast = useToast()
  const [roles, setRoles] = useState([])
  const [catalog, setCatalog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editor, setEditor] = useState({ open: false, role: null })
  const [removing, setRemoving] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [list, rbac] = await Promise.all([rolesApi.list(), rolesApi.catalog()])
      setRoles(list)
      setCatalog(rbac)
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleRemove() {
    setBusy(true)
    try {
      await rolesApi.remove(removing.id)
      toast.success(`Role "${removing.name}" was deleted.`)
      await load()
    } catch (removeError) {
      toast.error(errorMessage(removeError))
    } finally {
      setBusy(false)
      setRemoving(null)
    }
  }

  const templateLabel = (key) => catalog?.templates.find((template) => template.key === key)?.label ?? '—'

  return (
    <div className="stack">
      <PageHeader
        title="Roles"
        description="A role is a set of things a person may do. Give staff one or more roles on the Users page."
        breadcrumbs={[{ label: 'Users', to: '/users' }, { label: 'Roles' }]}
        actions={<Button onClick={() => setEditor({ open: true, role: null })}>New role</Button>}
      />

      {loading ? <Loader label="Loading roles…" /> : null}
      {error ? <ErrorState title="Could not load roles" message={errorMessage(error)} onRetry={load} /> : null}

      {!loading && !error ? (
        <Table
          compact
          data={roles}
          emptyText="No roles yet"
          emptyDescription="Create one from a template, for example Accountant."
          columns={[
            {
              key: 'name',
              header: 'Role',
              render: (role) => (
                <div>
                  <span className="strong">{role.name}</span>
                  {role.system ? <Badge tone="neutral" className="ml-2">Built in</Badge> : null}
                  {role.description ? <div className="muted small">{role.description}</div> : null}
                </div>
              ),
            },
            { key: 'template', header: 'Started from', render: (role) => templateLabel(role.templateKey) },
            { key: 'permissions', header: 'Permissions', align: 'right', render: (role) => role.permissions.length },
            { key: 'userCount', header: 'People', align: 'right', render: (role) => role.userCount ?? 0 },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (role) =>
                role.system ? (
                  <span className="muted small">Locked</span>
                ) : (
                  <TableActions
                    row={role}
                    showView={false}
                    updateLabel="Edit"
                    onUpdate={() => setEditor({ open: true, role })}
                    onDelete={() => setRemoving(role)}
                  />
                ),
            },
          ]}
        />
      ) : null}

      <RoleEditor
        open={editor.open}
        role={editor.role}
        catalog={catalog}
        onClose={() => setEditor({ open: false, role: null })}
        onSaved={(saved) => {
          toast.success(`Role "${saved.name}" saved.`)
          setEditor({ open: false, role: null })
          load()
        }}
      />

      <ConfirmDialog
        open={Boolean(removing)}
        title="Delete role"
        message={`Delete "${removing?.name}"? This works only when nobody has the role.`}
        confirmLabel="Delete"
        loading={busy}
        onConfirm={handleRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}
