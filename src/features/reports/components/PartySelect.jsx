const selectClass =
  'h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15'

export default function PartySelect({
  value,
  onChange,
  parties = [],
  types = ['B2C', 'B2B'],
  placeholder = 'Select client…',
  className = '',
  disabled = false,
}) {
  const groups = types
    .map((type) => ({
      type,
      rows: parties.filter((party) => party.type === type),
    }))
    .filter((group) => group.rows.length > 0)

  return (
    <select
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className={`${selectClass} ${className}`}
    >
      <option value="">{placeholder}</option>
      {groups.map((group) => (
        <optgroup
          key={group.type}
          label={
            group.type === 'B2B' ? 'B2B Agents' : group.type === 'Vendor' ? 'Suppliers' : 'B2C Customers'
          }
        >
          {group.rows.map((party) => (
            <option key={party.id} value={party.id}>
              {party.name} ({party.code})
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
