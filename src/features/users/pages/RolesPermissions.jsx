import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import Badge from '../../../components/common/Badge'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { usersApi } from '../users.api'
import { ALL_ROLES, roleLabel } from '../../../utils/roles'
import { ROLE_PERMISSIONS } from '../../../utils/permissions'
import { USER_STATUSES } from '../../../utils/constants'
import { titleCase, formatDate } from '../../../utils/formatters'

const ROLE_DESCRIPTIONS = {
  admin: 'Full control of the platform — users, roles, configuration and every module.',
  manager: 'Team lead — oversees operations, staff, partners and reports.',
  agent: 'Visa processing staff — reviews and works the applications assigned to them.',
  partner: 'B2B partner access — partner portal features only.',
  viewer: 'Read-only access for auditors and observers.',
}

const STATUS_TONES = { active: 'success', invited: 'info', suspended: 'danger' }

export default function RolesPermissions() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await usersApi.list()
      setRows(result.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) => `${row.name} ${row.email}`.toLowerCase().includes(query))
  }, [rows, search])

  async function changeRole(user, role) {
    setSavingId(user.id)
    try {
      await usersApi.update(user.id, { role })
      await load()
    } finally {
      setSavingId(null)
    }
  }

  async function changeStatus(user, status) {
    setSavingId(user.id)
    try {
      await usersApi.update(user.id, { status })
      await load()
    } finally {
      setSavingId(null)
    }
  }

  const roleOptions = ALL_ROLES.map((role) => ({ value: role, label: roleLabel(role) }))

  return (
    <div className="stack">
      <PageHeader
        title="Roles & permissions"
        description="Control which role each person has. A role decides what appears in their sidebar and what they can change."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Roles & permissions' }]}
      />

      <div className="grid grid--2">
        {ALL_ROLES.map((role) => {
          const permissions = ROLE_PERMISSIONS[role] ?? []
          const isAll = permissions.includes('*')
          return (
            <div className="card" key={role}>
              <div className="row between">
                <p className="card__title" style={{ marginBottom: 0 }}>{roleLabel(role)}</p>
                {isAll ? <Badge tone="primary">all permissions</Badge> : <Badge tone="neutral">{permissions.length} permissions</Badge>}
              </div>
              <p className="muted small mt-2">{ROLE_DESCRIPTIONS[role]}</p>
              {isAll ? (
                <p className="small">Can view and manage every module, including this panel.</p>
              ) : (
                <div className="row row--wrap" style={{ gap: 6 }}>
                  {permissions.map((permission) => (
                    <Badge key={permission} tone="info">{titleCase(permission)}</Badge>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="card stack">
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <p className="card__title" style={{ marginBottom: 0 }}>
            {filteredRows.length} {filteredRows.length === 1 ? 'team member' : 'team members'}
          </p>
          <Input
            type="search"
            placeholder="Search name or email…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ maxWidth: 280 }}
          />
        </div>
        <DataTable
          loading={loading}
          data={filteredRows}
          emptyTitle={search ? 'No team members match your search' : 'No team members yet'}
          columns={[
            {
              key: 'name',
              header: 'Team member',
              render: (row) => (
                <span>
                  <span className="strong">{row.name}</span>
                  <br />
                  <span className="muted small">{row.email}</span>
                </span>
              ),
            },
            {
              key: 'role',
              header: 'Role',
              render: (row) => (
                <Select
                  value={row.role}
                  aria-label={`Role for ${row.name}`}
                  disabled={savingId === row.id}
                  onChange={(event) => changeRole(row, event.target.value)}
                  options={roleOptions}
                />
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <Select
                  value={row.status}
                  aria-label={`Status for ${row.name}`}
                  disabled={savingId === row.id}
                  onChange={(event) => changeStatus(row, event.target.value)}
                  options={USER_STATUSES.map((status) => ({ value: status, label: titleCase(status) }))}
                />
              ),
            },
            { key: 'createdAt', header: 'Joined', render: (row) => formatDate(row.createdAt) },
            {
              key: 'badge',
              header: 'Access',
              render: (row) =>
                row.role === 'admin' ? (
                  <Badge tone="primary">full access</Badge>
                ) : (
                  <Badge tone={STATUS_TONES[row.status] ?? 'neutral'}>{row.status}</Badge>
                ),
            },
          ]}
        />
      </div>
    </div>
  )
}
