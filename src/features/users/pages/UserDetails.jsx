import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import UserStatusBadge from '../components/UserStatusBadge'
import RoleChecklist from '../components/RoleChecklist'
import AccessSummary from '../components/AccessSummary'
import { usersApi, rolesApi, ACCOUNT_TYPES } from '../users.api'
import { useToast } from '../../../context/ToastContext'
import { useAuth } from '../../../hooks/useAuth'
import { APP_ROUTES } from '../../../utils/constants'
import { formatDate, initials } from '../../../utils/formatters'
import { errorMessage } from '../../../utils/errors'

export default function UserDetails() {
  const { id } = useParams()
  const toast = useToast()
  const { user: me, reload } = useAuth()
  const [user, setUser] = useState(null)
  const [roles, setRoles] = useState([])
  const [catalog, setCatalog] = useState(null)
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [account, roleList, rbac] = await Promise.all([usersApi.get(id), rolesApi.list(), rolesApi.catalog()])
      setUser(account)
      setRoles(roleList)
      setCatalog(rbac)
      setSelected(account.roles.map((role) => role.id ?? role._id))
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const isStaff = user?.role === 'STAFF'
  const isMe = Boolean(user) && String(user.id) === String(me?.id)

  // What the person can do after the roles ticked now are saved, together with any old individual permissions.
  const resulting = useMemo(() => {
    const fromRoles = roles.filter((role) => selected.includes(role.id)).flatMap((role) => role.permissions)
    return [...new Set([...(user?.permissions ?? []), ...fromRoles])]
  }, [roles, selected, user])

  const unchanged = useMemo(() => {
    const current = (user?.roles ?? []).map((role) => role.id ?? role._id).sort().join(',')
    return current === [...selected].sort().join(',')
  }, [user, selected])

  async function run(action, success) {
    setSaving(true)
    try {
      const result = await action()
      toast.success(success)
      await load()
      if (isMe) await reload()
      return result
    } catch (actionError) {
      toast.error(errorMessage(actionError))
      return null
    } finally {
      setSaving(false)
      setConfirm(null)
    }
  }

  if (loading) return <Loader fullPage label="Loading user…" />
  if (error) return <ErrorState title="Could not load this user" message={errorMessage(error)} onRetry={load} />

  const typeLabel = ACCOUNT_TYPES.find((type) => type.value === user.role)?.label ?? user.role
  const canChangeStatus = (user.role === 'ADMIN' || user.role === 'STAFF') && !isMe

  return (
    <div className="stack">
      <PageHeader
        title={user.name}
        description={user.email ?? user.phone}
        breadcrumbs={[{ label: 'Users', to: APP_ROUTES.USERS }, { label: user.name }]}
        actions={
          <>
            <Link to={APP_ROUTES.USERS}>
              <Button variant="ghost">Back</Button>
            </Link>
            <Link to={APP_ROUTES.USER_EDIT(user.id)}>
              <Button>Edit details</Button>
            </Link>
          </>
        }
      />

      <div className="card">
        <div className="row mb-4">
          <span className="avatar avatar--lg">{initials(user.name)}</span>
          <div>
            <p className="strong">{user.name}</p>
            <UserStatusBadge status={user.status} />
          </div>
        </div>
        <dl className="detail-list">
          <div>
            <dt>Email</dt>
            <dd>{user.email ?? '—'}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{user.phone ?? '—'}</dd>
          </div>
          <div>
            <dt>Account type</dt>
            <dd>{typeLabel}</dd>
          </div>
          <div>
            <dt>Joined</dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt>Last sign-in</dt>
            <dd>{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</dd>
          </div>
        </dl>

        {canChangeStatus ? (
          <div className="row mt-4" style={{ gap: 8, flexWrap: 'wrap' }}>
            {user.status === 'invited' ? (
              <Button variant="ghost" loading={saving} onClick={() => run(() => usersApi.resendInvite(user.id), 'Invitation sent again.')}>
                Resend invitation
              </Button>
            ) : null}
            {user.status === 'active' ? (
              <Button variant="ghost" onClick={() => setConfirm({ status: 'suspended', title: 'Suspend account', message: `${user.name} will be signed out and cannot sign in until you activate the account again.`, done: 'Account suspended.' })}>
                Suspend
              </Button>
            ) : null}
            {user.status === 'suspended' || user.status === 'blocked' || user.status === 'inactive' ? (
              <Button variant="ghost" loading={saving} onClick={() => run(() => usersApi.setStatus(user.id, { status: 'active' }), 'Account activated.')}>
                Activate
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {isStaff ? (
        <div className="card stack">
          <p className="card__title">Roles</p>
          <p className="muted small">
            A person can do everything their roles allow together. Changing a role changes everyone who has it, and works on their next click.
            {isMe ? ' You cannot change your own roles.' : ''}
          </p>
          <RoleChecklist roles={roles} selected={selected} onChange={setSelected} disabled={isMe || saving} />

          {user.permissions?.length ? (
            <div className="alert alert--info">
              This account still has {user.permissions.length} individual permissions from before roles existed.
              <div style={{ marginTop: 8 }}>
                <Button variant="ghost" size="sm" onClick={() => setConfirm({ convert: true })}>
                  Turn them into a role
                </Button>
              </div>
            </div>
          ) : null}

          <div>
            <p className="field__label">What this person can do</p>
            <AccessSummary permissions={resulting} catalog={catalog} />
          </div>

          {!isMe ? (
            <div>
              <Button
                loading={saving}
                disabled={unchanged || selected.length === 0}
                onClick={() => run(() => usersApi.setRoles(user.id, selected), 'Roles saved.')}
              >
                Save roles
              </Button>
              {selected.length === 0 ? <span className="muted small" style={{ marginLeft: 10 }}>Choose at least one role. "No access yet" removes all access.</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {user.role === 'ADMIN' ? (
        <div className="card">
          <p className="card__title">Access</p>
          <p className="muted">Administrators can do everything. They have no roles to choose.</p>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? 'Turn permissions into a role'}
        message={confirm?.message ?? 'The permissions on this account become a role named after the person, and the old list is emptied. What they can do stays the same.'}
        confirmLabel={confirm?.convert ? 'Make role' : 'Confirm'}
        tone={confirm?.convert ? 'primary' : 'danger'}
        loading={saving}
        onConfirm={() =>
          confirm?.convert
            ? run(() => usersApi.convertPermissions(user.id, { name: `${user.name} (access)` }), 'The permissions are now a role.')
            : run(() => usersApi.setStatus(user.id, { status: confirm.status }), confirm.done)
        }
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
