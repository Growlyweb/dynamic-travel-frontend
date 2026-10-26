// The roles to choose from, one checkbox each, with what the role is for. Used where staff are created or given roles.
export default function RoleChecklist({ roles, selected, onChange, disabled = false }) {
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id])

  if (!roles.length) return <p className="muted small">No roles yet. Create one on the Roles page first.</p>

  return (
    <div className="stack" style={{ gap: 6 }}>
      {roles.map((role) => (
        <label key={role.id} className="checkbox" style={{ alignItems: 'flex-start' }}>
          <input type="checkbox" checked={selected.includes(role.id)} disabled={disabled} onChange={() => toggle(role.id)} />
          <span>
            <span className="strong">{role.name}</span>
            {role.description ? <span className="muted small" style={{ display: 'block' }}>{role.description}</span> : null}
          </span>
        </label>
      ))}
    </div>
  )
}
