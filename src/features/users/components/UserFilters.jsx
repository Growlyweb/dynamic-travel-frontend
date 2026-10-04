import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { USER_STATUSES } from '../../../utils/constants'
import { titleCase } from '../../../utils/formatters'
import { ALL_ROLES } from '../../../utils/roles'
import { ROLE_LABELS } from '../../../utils/roles'

export default function UserFilters({ value, onChange }) {
  function update(name, next) {
    onChange?.({ ...value, [name]: next })
  }

  return (
    <div className="filters">
      <Input
        label="Search"
        type="search"
        placeholder="Name or email…"
        value={value.search}
        onChange={(event) => update('search', event.target.value)}
      />
      <Select
        label="Status"
        placeholder="All statuses"
        value={value.status}
        onChange={(event) => update('status', event.target.value)}
        options={USER_STATUSES.map((status) => ({ value: status, label: titleCase(status) }))}
      />
      <Select
        label="Role"
        placeholder="All roles"
        value={value.role}
        onChange={(event) => update('role', event.target.value)}
        options={ALL_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
      />
    </div>
  )
}
