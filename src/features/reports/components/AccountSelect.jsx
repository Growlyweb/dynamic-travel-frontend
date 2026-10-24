import { ACCOUNT_TYPES } from '../accounting/coa'

const selectClass =
  'h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15'

export default function AccountSelect({
  value,
  onChange,
  accounts = [],
  placeholder = 'Select account…',
  className = '',
  allowedTypes,
  exclude,
  disabled = false,
}) {
  const types = allowedTypes?.length ? allowedTypes : ACCOUNT_TYPES
  const groups = types
    .map((type) => ({
      type,
      rows: accounts.filter(
        (account) => account.type === type && !(exclude || []).includes(account.code)
      ),
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
        <optgroup key={group.type} label={group.type}>
          {group.rows.map((account) => (
            <option key={account.code} value={account.code}>
              {account.code} — {account.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
