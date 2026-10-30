import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { USER_STATUSES } from '../../../utils/constants'
import { titleCase } from '../../../utils/formatters'
import { ACCOUNT_TYPES } from '../users.api'

export default function UserFilters({ value, onChange }) {
  function update(name, next) {
    onChange?.({ ...value, [name]: next })
  }

  return (
    <div className="filters">
      <Input
        label="Search"
        type="search"
        placeholder="Name, email or phone…"
        value={value.search}
        onChange={(event) => update('search', event.target.value)}
      />
      <Select
        label="Status"
        placeholder="All statuses"
        value={value.status}
        onChange={(event) => update('status', event.target.value)}
        options={USER_STATUSES.map((status) => ({ value: status, label: status === 'invited' ? 'Invited' : titleCase(status) }))}
      />
      <Select
        label="Account type"
        placeholder="All types"
        value={value.role}
        onChange={(event) => update('role', event.target.value)}
        options={ACCOUNT_TYPES}
      />
    </div>
  )
}
