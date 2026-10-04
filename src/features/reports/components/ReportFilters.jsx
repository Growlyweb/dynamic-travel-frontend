import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'

const REPORT_TYPES = [
  { value: 'bookings', label: 'Bookings' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'visas', label: 'Visa applications' },
  { value: 'partners', label: 'Partner activity' },
]

export default function ReportFilters({ value, onChange }) {
  function update(name, next) {
    onChange?.({ ...value, [name]: next })
  }

  return (
    <div className="filters">
      <Input
        label="From"
        type="date"
        value={value.from}
        onChange={(event) => update('from', event.target.value)}
      />
      <Input
        label="To"
        type="date"
        value={value.to}
        onChange={(event) => update('to', event.target.value)}
      />
      <Select
        label="Report type"
        value={value.type}
        onChange={(event) => update('type', event.target.value)}
        options={REPORT_TYPES}
      />
    </div>
  )
}
