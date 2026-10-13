import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import Badge from '../../../components/common/Badge'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import RoleMultiSelectDropdown from '../components/RoleMultiSelectDropdown'
import { usersApi } from '../users.api'
import {
  ALL_ROLES,
  ROLE_CONFIG,
  ROLE_LABELS,
  getUserRoles,
  roleLabel,
} from '../../../utils/roles'
import {
  MODULE_PERMISSION_GROUPS,
  getStaffPermissions,
  saveStaffPermissions,
} from '../../../utils/permissions'
import { USER_STATUSES } from '../../../utils/constants'
import { titleCase, formatDate } from '../../../utils/formatters'
import {
  Shield,
  ShieldCheck,
  Users,
  Layers,
  Check,
  CheckCircle2,
  X,
  RotateCcw,
  Search,
  Filter,
  CheckSquare,
  Square,
  Save,
  AlertCircle,
  UserCheck,
  SlidersHorizontal,
} from 'lucide-react'

function arraysEqual(a = [], b = []) {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((val, idx) => val === sortedB[idx])
}

const STATUS_TONES = { active: 'success', invited: 'info', suspended: 'danger' }

export default function RolesPermissions() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('members') // 'members' | 'matrix'

  // Per-row unsaved roles drafts: { [userId]: string[] }
  const [pendingRowRoles, setPendingRowRoles] = useState({})
  const [savingRowId, setSavingRowId] = useState(null)
  const [rowSuccessId, setRowSuccessId] = useState(null)

  // Table row selection for bulk role assignment
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [bulkMode, setBulkMode] = useState('grant') // 'grant' | 'replace' | 'revoke'
  const [bulkRoles, setBulkRoles] = useState([])
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkNotice, setBulkNotice] = useState(null)

  // Staff module permissions state
  const [liveStaffPerms, setLiveStaffPerms] = useState(() => getStaffPermissions())
  const [draftStaffPerms, setDraftStaffPerms] = useState(() => getStaffPermissions())
  const [permsSaving, setPermsSaving] = useState(false)
  const [permsNotice, setPermsNotice] = useState(null)

  const headerCheckboxRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await usersApi.list()
      setRows(result.items ?? [])
      // Clear drafts for rows that reloaded
      setPendingRowRoles({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Filtered rows for the table
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const q = search.trim().toLowerCase()
      if (q && !`${row.name} ${row.email}`.toLowerCase().includes(q)) {
        return false
      }
      const userRoles = getUserRoles(row)
      if (roleFilter !== 'all' && !userRoles.includes(roleFilter)) {
        return false
      }
      if (statusFilter !== 'all' && row.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [rows, search, roleFilter, statusFilter])

  // Header checkbox indeterminate calculation
  const allFilteredSelected =
    filteredRows.length > 0 &&
    filteredRows.every((r) => selectedUserIds.includes(r.id))
  const someFilteredSelected =
    filteredRows.some((r) => selectedUserIds.includes(r.id)) && !allFilteredSelected

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someFilteredSelected
    }
  }, [someFilteredSelected])

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedUserIds((prev) =>
        prev.filter((id) => !filteredRows.some((r) => r.id === id)),
      )
    } else {
      const visibleIds = filteredRows.map((r) => r.id)
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const handleToggleSelectRow = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  // --- Row-level Role Management ---
  const handleRowRolesChange = (userId, newRoles) => {
    setPendingRowRoles((prev) => ({
      ...prev,
      [userId]: newRoles,
    }))
  }

  const handleApplyRowRoles = async (user) => {
    const nextRoles = pendingRowRoles[user.id] ?? getUserRoles(user)
    if (nextRoles.length === 0) {
      alert('Please assign at least one role to the user.')
      return
    }

    setSavingRowId(user.id)
    try {
      await usersApi.update(user.id, {
        roles: nextRoles,
        role: nextRoles[0] || 'viewer',
      })
      // Clear pending draft
      setPendingRowRoles((prev) => {
        const copy = { ...prev }
        delete copy[user.id]
        return copy
      })
      await load()
      setRowSuccessId(user.id)
      setTimeout(() => setRowSuccessId(null), 2500)
    } finally {
      setSavingRowId(null)
    }
  }

  const handleResetRowRoles = (userId) => {
    setPendingRowRoles((prev) => {
      const copy = { ...prev }
      delete copy[userId]
      return copy
    })
  }

  // --- Row-level Status Management ---
  const handleStatusChange = async (user, newStatus) => {
    setSavingRowId(user.id)
    try {
      await usersApi.update(user.id, { status: newStatus })
      await load()
    } finally {
      setSavingRowId(null)
    }
  }

  // --- Bulk Role Assignment ---
  const handleApplyBulkRoles = async () => {
    if (selectedUserIds.length === 0) return
    if (bulkRoles.length === 0) {
      alert('Please select at least one role to apply.')
      return
    }

    setBulkSaving(true)
    try {
      const updates = selectedUserIds.map((userId) => {
        const user = rows.find((r) => r.id === userId)
        const currentRoles = getUserRoles(user)
        let finalRoles = []

        if (bulkMode === 'grant') {
          // Add roles to existing ones
          finalRoles = Array.from(new Set([...currentRoles, ...bulkRoles]))
        } else if (bulkMode === 'replace') {
          // Overwrite with selected roles
          finalRoles = [...bulkRoles]
        } else if (bulkMode === 'revoke') {
          // Remove selected roles
          finalRoles = currentRoles.filter((r) => !bulkRoles.includes(r))
          if (finalRoles.length === 0) {
            finalRoles = ['viewer'] // Fallback to safe read-only viewer
          }
        }

        return usersApi.update(userId, {
          roles: finalRoles,
          role: finalRoles[0] || 'viewer',
        })
      })

      await Promise.all(updates)
      await load()
      const count = selectedUserIds.length
      setSelectedUserIds([])
      setBulkRoles([])
      setBulkNotice(
        `Successfully ${bulkMode === 'grant' ? 'granted access to' : bulkMode === 'replace' ? 'updated roles for' : 'revoked access from'} ${count} team member${count > 1 ? 's' : ''}!`,
      )
      setTimeout(() => setBulkNotice(null), 4000)
    } finally {
      setBulkSaving(false)
    }
  }

  // --- Module Permissions Tab Handlers ---
  const isPermsDirty = !arraysEqual(draftStaffPerms, liveStaffPerms)

  const handleToggleDraftPermission = (permKey) => {
    setDraftStaffPerms((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey],
    )
  }

  const handleDraftSelectAll = () => {
    const allKeys = MODULE_PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key))
    setDraftStaffPerms(allKeys)
  }

  const handleDraftClearAll = () => {
    setDraftStaffPerms([])
  }

  const handleResetDraftPerms = () => {
    setDraftStaffPerms([...liveStaffPerms])
  }

  const handleApplyPermissions = () => {
    setPermsSaving(true)
    saveStaffPermissions(draftStaffPerms)
    setLiveStaffPerms([...draftStaffPerms])
    setPermsSaving(false)
    setPermsNotice('Staff module permissions successfully saved and applied live!')
    setTimeout(() => setPermsNotice(null), 3000)
  }

  // KPI Metrics
  const totalUsers = rows.length
  const totalAdmins = rows.filter((r) => getUserRoles(r).includes('admin')).length
  const totalStaff = rows.filter(
    (r) => getUserRoles(r).includes('agent') || getUserRoles(r).includes('manager'),
  ).length
  const totalModules = MODULE_PERMISSION_GROUPS.reduce(
    (acc, g) => acc + g.permissions.length,
    0,
  )

  return (
    <div className="stack" style={{ gap: 20 }}>
      {/* Page Header */}
      <PageHeader
        title="Roles & Permissions"
        description="Assign system roles to team members with multi-select access controls, grant or revoke operational privileges, and configure module permissions."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Roles & permissions' }]}
      />

      {/* KPI Overview Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 14,
        }}
      >
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#EBF5FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0879E8',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>Team Members</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{totalUsers}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#E6F2FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0879E8',
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>Administrators</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{totalAdmins}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#FFFBEB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>Staff & Managers</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{totalStaff}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#F0FDF4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16A34A',
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>Staff Modules Active</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>
              {liveStaffPerms.length} / {totalModules}
            </div>
          </div>
        </div>
      </div>

      {/* Global Alerts / Toasts */}
      {bulkNotice && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#166534',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} color="#16A34A" />
            <span style={{ fontWeight: 600 }}>{bulkNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBulkNotice(null)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#166534' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #E2E8F0',
          gap: 20,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 6px',
            fontSize: 14,
            fontWeight: 600,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'members' ? '2.5px solid #0879E8' : '2.5px solid transparent',
            color: activeTab === 'members' ? '#0879E8' : '#64748B',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Users size={17} />
          <span>Team Member Roles & Access</span>
          <span
            style={{
              padding: '2px 7px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 700,
              background: activeTab === 'members' ? '#EBF5FF' : '#F1F5F9',
              color: activeTab === 'members' ? '#0879E8' : '#64748B',
            }}
          >
            {rows.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 6px',
            fontSize: 14,
            fontWeight: 600,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'matrix' ? '2.5px solid #0879E8' : '2.5px solid transparent',
            color: activeTab === 'matrix' ? '#0879E8' : '#64748B',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Layers size={17} />
          <span>Module Permissions Matrix</span>
          {isPermsDirty && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#F59E0B',
              }}
              title="Unsaved changes"
            />
          )}
        </button>
      </div>

      {/* ======================================================================= */}
      {/* TAB 1: TEAM MEMBER ROLES TABLE (MAIN VIEW)                              */}
      {/* ======================================================================= */}
      {activeTab === 'members' && (
        <div className="card stack" style={{ padding: 20 }}>
          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', flex: 1 }}>
              <div style={{ position: 'relative', minWidth: 260, maxWidth: 320, flex: 1 }}>
                <Search
                  size={15}
                  color="#94A3B8"
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Search name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 32px',
                    fontSize: 13,
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    outline: 'none',
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Role Filter */}
              <div style={{ minWidth: 160 }}>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: 13,
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    outline: 'none',
                    color: '#334155',
                  }}
                >
                  <option value="all">All Roles</option>
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_CONFIG[r]?.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ minWidth: 140 }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: 13,
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    outline: 'none',
                    color: '#334155',
                  }}
                >
                  <option value="all">All Statuses</option>
                  {USER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {titleCase(st)}
                    </option>
                  ))}
                </select>
              </div>

              {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setRoleFilter('all')
                    setStatusFilter('all')
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 10px',
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div style={{ fontSize: 12.5, color: '#64748B' }}>
              Showing <strong>{filteredRows.length}</strong> of {rows.length} members
            </div>
          </div>

          {/* =================================================================== */}
          {/* BULK ACTION BAR (ACTIVE WHEN 1 OR MORE ROWS ARE CHECKED)           */}
          {/* =================================================================== */}
          {selectedUserIds.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 16px',
                background: '#F8FAFC',
                border: '1.5px solid #0879E8',
                borderRadius: 10,
                boxShadow: '0 4px 12px rgba(8, 121, 232, 0.08)',
                animation: 'fadeIn 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: '#0879E8',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 12.5,
                  }}
                >
                  {selectedUserIds.length} Selected
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>Action:</span>
                  <select
                    value={bulkMode}
                    onChange={(e) => setBulkMode(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#0F172A',
                      outline: 'none',
                    }}
                  >
                    <option value="grant">Give Access (Add Roles)</option>
                    <option value="replace">Set Roles (Replace All)</option>
                    <option value="revoke">Take Out Access (Revoke Roles)</option>
                  </select>
                </div>

                <div style={{ minWidth: 260 }}>
                  <RoleMultiSelectDropdown
                    selectedRoles={bulkRoles}
                    onChange={setBulkRoles}
                    placeholder="Choose roles to apply…"
                    compact={true}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  disabled={bulkSaving || bulkRoles.length === 0}
                  onClick={handleApplyBulkRoles}
                  style={{
                    padding: '7px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Save size={15} />
                  <span>
                    {bulkSaving
                      ? 'Applying…'
                      : `Apply to ${selectedUserIds.length} Member${selectedUserIds.length > 1 ? 's' : ''}`}
                  </span>
                </button>

                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setSelectedUserIds([])}
                  style={{
                    padding: '7px 12px',
                    fontSize: 12.5,
                  }}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* USER ROLES DATA TABLE                                               */}
          {/* =================================================================== */}
          <div className="table-wrap" style={{ overflowX: 'auto', position: 'relative' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                  <th style={{ width: 44, textAlign: 'center', padding: '12px 8px' }}>
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={handleToggleSelectAll}
                      style={{ cursor: 'pointer', width: 16, height: 16 }}
                      title="Select all filtered team members"
                    />
                  </th>
                  <th style={{ padding: '12px 14px' }}>Team Member</th>
                  <th style={{ padding: '12px 14px', minWidth: 280 }}>
                    Assigned Roles (Multi-Select)
                  </th>
                  <th style={{ padding: '12px 14px', minWidth: 160 }}>Effective Access</th>
                  <th style={{ padding: '12px 14px', minWidth: 130 }}>Status</th>
                  <th style={{ padding: '12px 14px', minWidth: 110 }}>Joined</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', minWidth: 150 }}>
                    Apply / Save
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                      Loading team members…
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                      No team members found matching your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((user) => {
                    const currentServerRoles = getUserRoles(user)
                    const rowRoles = pendingRowRoles[user.id] ?? currentServerRoles
                    const isDirty = !arraysEqual(rowRoles, currentServerRoles)
                    const isSaving = savingRowId === user.id
                    const isSuccess = rowSuccessId === user.id
                    const isSelected = selectedUserIds.includes(user.id)
                    const hasAdmin = rowRoles.includes('admin')
                    const hasManager = rowRoles.includes('manager')
                    const hasStaff = rowRoles.includes('agent')

                    return (
                      <tr
                        key={user.id}
                        style={{
                          background: isSelected
                            ? '#F0F7FF'
                            : isDirty
                              ? '#FFFDF5'
                              : 'transparent',
                          borderBottom: '1px solid #E2E8F0',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* Row Selection Checkbox */}
                        <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(user.id)}
                            style={{ cursor: 'pointer', width: 16, height: 16 }}
                          />
                        </td>

                        {/* Team Member Info */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: hasAdmin ? '#EBF5FF' : '#F1F5F9',
                                color: hasAdmin ? '#0879E8' : '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 13,
                              }}
                            >
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13.5 }}>
                                {user.name}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748B' }}>{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Multi-Select Role Assignment Field */}
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <RoleMultiSelectDropdown
                              selectedRoles={rowRoles}
                              onChange={(newRoles) => handleRowRolesChange(user.id, newRoles)}
                              disabled={isSaving}
                              placeholder="Assign roles…"
                              compact={true}
                              id={`role-select-${user.id}`}
                            />
                            {isDirty && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: '#D97706',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <span
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: '#D97706',
                                  }}
                                />
                                Unsaved role changes
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Effective Access Badge */}
                        <td style={{ padding: '12px 14px' }}>
                          {hasAdmin ? (
                            <Badge tone="primary">Full Access (*)</Badge>
                          ) : hasManager ? (
                            <Badge tone="purple" style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
                              Manager Access
                            </Badge>
                          ) : hasStaff ? (
                            <Badge tone="warning">
                              Staff ({liveStaffPerms.length} modules)
                            </Badge>
                          ) : (
                            <Badge tone="neutral">Read-Only Viewer</Badge>
                          )}
                        </td>

                        {/* Account Status */}
                        <td style={{ padding: '12px 14px' }}>
                          <select
                            value={user.status}
                            disabled={isSaving}
                            onChange={(e) => handleStatusChange(user, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              border: '1px solid #CBD5E1',
                              background: '#FFFFFF',
                              color:
                                user.status === 'active'
                                  ? '#16A34A'
                                  : user.status === 'suspended'
                                    ? '#DC2626'
                                    : '#2563EB',
                            }}
                          >
                            {USER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {titleCase(st)}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Joined Date */}
                        <td style={{ padding: '12px 14px', fontSize: 12.5, color: '#64748B' }}>
                          {formatDate(user.createdAt)}
                        </td>

                        {/* Actions / Apply Button */}
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: 6,
                            }}
                          >
                            {isSuccess ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: '#16A34A',
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  background: '#F0FDF4',
                                }}
                              >
                                <Check size={14} strokeWidth={2.5} />
                                Applied!
                              </span>
                            ) : (
                              <>
                                {isDirty && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetRowRoles(user.id)}
                                    title="Undo pending changes"
                                    style={{
                                      padding: '5px 8px',
                                      background: '#F1F5F9',
                                      border: '1px solid #CBD5E1',
                                      borderRadius: 6,
                                      cursor: 'pointer',
                                      color: '#64748B',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <RotateCcw size={13} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleApplyRowRoles(user)}
                                  disabled={!isDirty || isSaving}
                                  className={
                                    isDirty
                                      ? 'btn btn--primary btn--sm'
                                      : 'btn btn--ghost btn--sm'
                                  }
                                  style={{
                                    padding: '5px 12px',
                                    fontSize: 12.5,
                                    fontWeight: 600,
                                    cursor: isDirty && !isSaving ? 'pointer' : 'default',
                                    opacity: isDirty ? 1 : 0.6,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                  }}
                                >
                                  <Check size={13} strokeWidth={2.5} />
                                  <span>{isSaving ? 'Saving…' : 'Apply'}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 2: MODULE PERMISSIONS MATRIX (CONTROL PANEL)                        */}
      {/* ======================================================================= */}
      {activeTab === 'matrix' && (
        <div className="card stack" style={{ padding: 20 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              paddingBottom: 14,
              borderBottom: '1px solid #E2E8F0',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                Module Access Privileges by Role
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
                Configure which sidebar modules and operational functions Staff members can access. Admin role retains full access by design.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {permsNotice && (
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    color: '#16A34A',
                    fontSize: 12.5,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={16} />
                  {permsNotice}
                </span>
              )}

              {isPermsDirty && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={handleResetDraftPerms}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <RotateCcw size={14} />
                  <span>Discard Changes</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={handleDraftSelectAll}
              >
                Grant All
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={handleDraftClearAll}
              >
                Revoke All
              </button>

              <button
                type="button"
                className="btn btn--primary btn--sm"
                disabled={!isPermsDirty || permsSaving}
                onClick={handleApplyPermissions}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                }}
              >
                <Save size={15} />
                <span>{permsSaving ? 'Saving…' : 'Apply Changes'}</span>
              </button>
            </div>
          </div>

          {/* Structured Permissions Table */}
          <div className="table-wrap">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', width: '32%' }}>Module & Feature</th>
                  <th style={{ padding: '12px 16px', width: '36%' }}>Description & Capability</th>
                  <th style={{ padding: '12px 16px', width: '16%', textAlign: 'center' }}>
                    Administrator
                  </th>
                  <th style={{ padding: '12px 16px', width: '16%', textAlign: 'center' }}>
                    Staff Member
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODULE_PERMISSION_GROUPS.map((group) => {
                  return (
                    <React.Fragment key={group.module}>
                      {/* Module Group Header Row */}
                      <tr style={{ background: '#F8FAFC' }}>
                        <td
                          colSpan={4}
                          style={{
                            padding: '10px 16px',
                            fontWeight: 700,
                            fontSize: 13,
                            color: '#1E293B',
                            borderTop: '1px solid #E2E8F0',
                            borderBottom: '1px solid #E2E8F0',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Layers size={16} color="#0879E8" />
                            <span>{group.module}</span>
                            <span style={{ fontSize: 11, fontWeight: 400, color: '#64748B' }}>
                              ({group.description})
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Sub-permissions inside this module */}
                      {group.permissions.map((perm) => {
                        const isGranted = draftStaffPerms.includes(perm.key)
                        return (
                          <tr
                            key={perm.key}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              transition: 'background 0.12s ease',
                            }}
                          >
                            <td style={{ padding: '12px 16px 12px 32px' }}>
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>
                                {perm.label}
                              </div>
                              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
                                {perm.key}
                              </div>
                            </td>

                            <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#64748B' }}>
                              Grants access to {perm.label.toLowerCase()} views, forms and processing tools.
                            </td>

                            {/* Administrator Access (Locked Full) */}
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <Badge tone="primary">Full Access (*)</Badge>
                            </td>

                            {/* Staff Member Toggle */}
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleDraftPermission(perm.key)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '5px 12px',
                                  borderRadius: 20,
                                  border: isGranted ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                                  background: isGranted ? '#F0FDF4' : '#F8FAFC',
                                  color: isGranted ? '#166534' : '#64748B',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {isGranted ? (
                                  <>
                                    <Check size={13} color="#16A34A" strokeWidth={3} />
                                    <span>Granted</span>
                                  </>
                                ) : (
                                  <>
                                    <X size={13} color="#94A3B8" strokeWidth={2.5} />
                                    <span>Restricted</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
