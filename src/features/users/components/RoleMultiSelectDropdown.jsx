import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X, Shield, Search } from 'lucide-react'
import { ALL_ROLES, ROLE_CONFIG } from '../../../utils/roles'

/**
 * Highly polished multi-select dropdown component for role assignment.
 * Supports individual row editing or bulk toolbar selection.
 */
export default function RoleMultiSelectDropdown({
  selectedRoles = [],
  onChange,
  disabled = false,
  placeholder = 'Select roles…',
  compact = false,
  align = 'left',
  id,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)

  // Close dropdown on click outside or Escape
  useEffect(() => {
    if (!isOpen) return

    function handleOutsideClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const toggleRole = (roleKey, event) => {
    event?.stopPropagation()
    if (disabled) return
    const isSelected = selectedRoles.includes(roleKey)
    let nextRoles
    if (isSelected) {
      nextRoles = selectedRoles.filter((k) => k !== roleKey)
    } else {
      nextRoles = [...selectedRoles, roleKey]
    }
    onChange?.(nextRoles)
  }

  const handleSelectAll = (event) => {
    event?.stopPropagation()
    onChange?.([...ALL_ROLES])
  }

  const handleClearAll = (event) => {
    event?.stopPropagation()
    onChange?.([])
  }

  const removeSingleRole = (roleKey, event) => {
    event?.stopPropagation()
    if (disabled) return
    onChange?.(selectedRoles.filter((k) => k !== roleKey))
  }

  const filteredRoles = ALL_ROLES.filter((roleKey) => {
    const config = ROLE_CONFIG[roleKey]
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      config.label.toLowerCase().includes(q) ||
      config.description.toLowerCase().includes(q) ||
      roleKey.toLowerCase().includes(q)
    )
  })

  return (
    <div
      ref={containerRef}
      id={id}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        minWidth: compact ? 220 : 260,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setIsOpen((prev) => !prev)
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          minHeight: compact ? 34 : 38,
          padding: compact ? '4px 8px' : '5px 12px',
          background: disabled ? '#F8FAFC' : '#FFFFFF',
          border: isOpen ? '1.5px solid #0879E8' : '1px solid #CBD5E1',
          borderRadius: 8,
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(8, 121, 232, 0.12)' : '0 1px 2px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease',
          opacity: disabled ? 0.65 : 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            alignItems: 'center',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {selectedRoles.length === 0 ? (
            <span style={{ color: '#94A3B8', fontSize: 13, userSelect: 'none' }}>
              {placeholder}
            </span>
          ) : (
            selectedRoles.map((roleKey) => {
              const config = ROLE_CONFIG[roleKey] ?? {
                label: roleKey,
                color: '#64748B',
                bg: '#F1F5F9',
                border: '#E2E8F0',
              }
              return (
                <span
                  key={roleKey}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 7px',
                    borderRadius: 5,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: config.color,
                    background: config.bg,
                    border: `1px solid ${config.border}`,
                    lineHeight: 1.2,
                  }}
                >
                  <span>{config.shortLabel || config.label}</span>
                  {!disabled && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => removeSingleRole(roleKey, e)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          removeSingleRole(roleKey, e)
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        color: config.color,
                        opacity: 0.75,
                      }}
                      title={`Remove ${config.label}`}
                    >
                      <X size={10} strokeWidth={2.5} />
                    </span>
                  )}
                </span>
              )
            })
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B' }}>
          {selectedRoles.length > 0 && !disabled && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#0879E8',
                background: '#E6F2FD',
                padding: '1px 5px',
                borderRadius: 4,
              }}
            >
              {selectedRoles.length}
            </span>
          )}
          <ChevronDown
            size={15}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.18s ease',
              color: isOpen ? '#0879E8' : '#64748B',
            }}
          />
        </div>
      </div>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          role="listbox"
          aria-multiselectable="true"
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            [align === 'right' ? 'right' : 'left']: 0,
            zIndex: 9999,
            width: 320,
            maxWidth: '90vw',
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: 10,
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Search Header */}
          <div
            style={{
              padding: '8px 10px',
              borderBottom: '1px solid #F1F5F9',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Search size={14} color="#94A3B8" />
            <input
              type="text"
              placeholder="Filter roles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 12.5,
                color: '#0F172A',
              }}
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: 2,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick Select / Deselect Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 12px',
              borderBottom: '1px solid #F1F5F9',
              background: '#FAFAFA',
              fontSize: 11.5,
            }}
          >
            <span style={{ color: '#64748B' }}>
              {selectedRoles.length} of {ALL_ROLES.length} selected
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0879E8',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 11.5,
                  padding: 0,
                }}
              >
                Select all
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  fontSize: 11.5,
                  padding: 0,
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Options List */}
          <div
            style={{
              maxHeight: 240,
              overflowY: 'auto',
              padding: '4px',
            }}
          >
            {filteredRoles.length === 0 ? (
              <div style={{ padding: '16px 12px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
                No matching roles found
              </div>
            ) : (
              filteredRoles.map((roleKey) => {
                const config = ROLE_CONFIG[roleKey]
                const isSelected = selectedRoles.includes(roleKey)

                return (
                  <div
                    key={roleKey}
                    role="option"
                    aria-selected={isSelected}
                    onClick={(e) => toggleRole(roleKey, e)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: isSelected ? '#F0F7FF' : 'transparent',
                      transition: 'background 0.12s ease',
                      marginBottom: 2,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#F8FAFC'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {/* Checkbox box */}
                    <div
                      style={{
                        width: 17,
                        height: 17,
                        borderRadius: 4,
                        border: isSelected ? '1.5px solid #0879E8' : '1.5px solid #CBD5E1',
                        background: isSelected ? '#0879E8' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 2,
                        flexShrink: 0,
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </div>

                    {/* Role Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? '#0879E8' : '#0F172A',
                          }}
                        >
                          {config.label}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: config.bg,
                            color: config.color,
                            border: `1px solid ${config.border}`,
                          }}
                        >
                          {config.badgeText}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: '2px 0 0 0',
                          fontSize: 11,
                          color: '#64748B',
                          lineHeight: 1.35,
                        }}
                      >
                        {config.description}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Info */}
          <div
            style={{
              padding: '6px 10px',
              borderTop: '1px solid #F1F5F9',
              background: '#F8FAFC',
              fontSize: 11,
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Click to toggle role</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: '#E2E8F0',
                border: 'none',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
