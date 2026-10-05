import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import Badge from '../../../components/common/Badge'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { usersApi } from '../users.api'
import { roleLabel } from '../../../utils/roles'
import {
  MODULE_PERMISSION_GROUPS,
  getStaffPermissions,
  saveStaffPermissions,
} from '../../../utils/permissions'
import { USER_STATUSES } from '../../../utils/constants'
import { titleCase, formatDate } from '../../../utils/formatters'
import { Shield, ShieldCheck, CheckSquare, Square, Save } from 'lucide-react'

const STATUS_TONES = { active: 'success', invited: 'info', suspended: 'danger' }

export default function RolesPermissions() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState(null)

  // Active staff permissions state
  const [staffPerms, setStaffPerms] = useState(() => getStaffPermissions())
  const [savedNotice, setSavedNotice] = useState(false)

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

  const handleTogglePermission = (permKey) => {
    let updated
    if (staffPerms.includes(permKey)) {
      updated = staffPerms.filter((p) => p !== permKey)
    } else {
      updated = [...staffPerms, permKey]
    }
    setStaffPerms(updated)
    saveStaffPermissions(updated)
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2000)
  }

  const handleSelectAllStaff = () => {
    const allKeys = MODULE_PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key))
    setStaffPerms(allKeys)
    saveStaffPermissions(allKeys)
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2000)
  }

  const handleClearAllStaff = () => {
    setStaffPerms([])
    saveStaffPermissions([])
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2000)
  }

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'agent', label: 'Staff Member' },
  ]

  const totalPossiblePerms = MODULE_PERMISSION_GROUPS.reduce(
    (acc, g) => acc + g.permissions.length,
    0,
  )

  return (
    <div className="stack">
      <PageHeader
        title="Roles & Permissions"
        description="Manage system access for Admin and Staff roles. Admin configures which sidebar modules and operational features Staff members can access."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Roles & permissions' }]}
      />

      {/* Role Summary Overview */}
      <div className="grid grid--2">
        {/* Admin Card */}
        <div className="card" style={{ borderColor: 'var(--color-primary-soft, #e6f2fd)' }}>
          <div className="row between">
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <Shield size={22} color="#0879E8" />
              <p className="card__title" style={{ marginBottom: 0 }}>
                Administrator (Admin)
              </p>
            </div>
            <Badge tone="primary">Full Access (*)</Badge>
          </div>
          <p className="muted small mt-2">
            Has full control over the platform — users, role permissions, settings, and every sidebar module. Cannot be restricted.
          </p>
        </div>

        {/* Staff Card */}
        <div className="card" style={{ borderColor: 'var(--color-warning-soft, #fff7e6)' }}>
          <div className="row between">
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <ShieldCheck size={22} color="#FFB000" />
              <p className="card__title" style={{ marginBottom: 0 }}>
                Staff Member (Staff)
              </p>
            </div>
            <Badge tone="warning">
              {staffPerms.length} / {totalPossiblePerms} Modules Enabled
            </Badge>
          </div>
          <p className="muted small mt-2">
            Operational team members. Access to sidebar modules and feature views is controlled below by the Admin.
          </p>
        </div>
      </div>

      {/* Interactive Staff Permission Control Panel */}
      <div className="card stack">
        <div className="row between" style={{ alignItems: 'center' }}>
          <div>
            <h3 className="card__title" style={{ marginBottom: 4 }}>
              Staff Permission Controls
            </h3>
            <p className="muted small">
              Toggle specific module permissions for Staff users. Changes take effect immediately across their sidebar and dashboard.
            </p>
          </div>
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            {savedNotice && (
              <Badge tone="success" style={{ padding: '6px 12px' }}>
                ✓ Permissions Saved & Live
              </Badge>
            )}
            <button
              type="button"
              className="btn btn--secondary small"
              onClick={handleSelectAllStaff}
            >
              Grant All
            </button>
            <button
              type="button"
              className="btn btn--secondary small"
              onClick={handleClearAllStaff}
            >
              Revoke All
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
            marginTop: 8,
          }}
        >
          {MODULE_PERMISSION_GROUPS.map((group) => (
            <div
              key={group.module}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: 16,
              }}
            >
              <h4 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', margin: '0 0 4px 0' }}>
                {group.module}
              </h4>
              <p className="muted small" style={{ margin: '0 0 12px 0', fontSize: 12 }}>
                {group.description}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {group.permissions.map((perm) => {
                  const isChecked = staffPerms.includes(perm.key)
                  return (
                    <label
                      key={perm.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        padding: '6px 10px',
                        background: isChecked ? '#FFFFFF' : 'transparent',
                        border: isChecked ? '1px solid #CBD5E1' : '1px solid transparent',
                        borderRadius: 6,
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => handleTogglePermission(perm.key)}
                    >
                      {isChecked ? (
                        <CheckSquare size={18} color="#0879E8" />
                      ) : (
                        <Square size={18} color="#94A3B8" />
                      )}
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isChecked ? 600 : 400,
                          color: isChecked ? '#0F172A' : '#64748B',
                        }}
                      >
                        {perm.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Member Role Assignment */}
      <div className="card stack">
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div>
            <h3 className="card__title" style={{ marginBottom: 4 }}>
              Team Member Role Assignments
            </h3>
            <p className="muted small">
              Assign team members to either Admin or Staff roles.
            </p>
          </div>
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
              header: 'Assigned Role',
              render: (row) => (
                <Select
                  value={row.role === 'admin' ? 'admin' : 'agent'}
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
                  options={USER_STATUSES.map((status) => ({
                    value: status,
                    label: titleCase(status),
                  }))}
                />
              ),
            },
            { key: 'createdAt', header: 'Joined', render: (row) => formatDate(row.createdAt) },
            {
              key: 'badge',
              header: 'Effective Access',
              render: (row) =>
                row.role === 'admin' ? (
                  <Badge tone="primary">Full Access (*)</Badge>
                ) : (
                  <Badge tone="warning">Custom Staff Access</Badge>
                ),
            },
          ]}
        />
      </div>
    </div>
  )
}
