import { useMemo } from 'react'

// A plain list of what a set of permissions lets a person do, grouped the way the roles screen groups them.
export default function AccessSummary({ permissions, catalog }) {
  const groups = useMemo(() => {
    if (!catalog) return []
    const has = new Set(permissions)
    const text = Object.fromEntries(catalog.permissions.map((permission) => [permission.code, permission.description]))
    return catalog.groups
      .map((group) => ({ label: group.label, items: group.permissions.filter((code) => has.has(code)).map((code) => text[code]) }))
      .filter((group) => group.items.length)
  }, [permissions, catalog])

  if (!groups.length) return <p className="muted small">Nothing yet. This person can sign in but cannot open any page.</p>

  return (
    <dl className="detail-list">
      {groups.map((group) => (
        <div key={group.label}>
          <dt>{group.label}</dt>
          <dd>{group.items.join(', ')}</dd>
        </div>
      ))}
    </dl>
  )
}
