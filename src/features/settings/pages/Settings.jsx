import { useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/common/Button'
import Select from '../../../components/common/Select'
import { CURRENCIES } from '../../../utils/constants'

const TOGGLES = [
  { id: 'emailVisa', label: 'Email me when a visa status changes', defaultChecked: true },
  { id: 'emailWithdrawals', label: 'Email me about new withdrawal requests', defaultChecked: true },
  { id: 'emailWeekly', label: 'Send me the weekly operations report', defaultChecked: false },
  { id: 'pushApplications', label: 'In-app alerts for new applications', defaultChecked: true },
]

export default function Settings() {
  const [toggles, setToggles] = useState(() =>
    Object.fromEntries(TOGGLES.map((toggle) => [toggle.id, toggle.defaultChecked])),
  )
  const [currency, setCurrency] = useState('USD')
  const [saved, setSaved] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    // Replace with your settings API.
    setSaved(true)
  }

  return (
    <div className="stack">
      <PageHeader
        title="Settings"
        description="Workspace preferences for your account."
        breadcrumbs={[{ label: 'Settings' }, { label: 'General' }]}
      />

      <form className="card stack" onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
        {saved ? <div className="alert alert--success">Settings saved.</div> : null}
        <div className="stack stack--sm">
          {TOGGLES.map((toggle) => (
            <label className="checkbox" key={toggle.id}>
              <input
                type="checkbox"
                checked={toggles[toggle.id]}
                onChange={(event) => {
                  setSaved(false)
                  setToggles((current) => ({ ...current, [toggle.id]: event.target.checked }))
                }}
              />
              {toggle.label}
            </label>
          ))}
        </div>
        <Select
          label="Default currency"
          value={currency}
          onChange={(event) => {
            setSaved(false)
            setCurrency(event.target.value)
          }}
          options={CURRENCIES.map((code) => ({ value: code, label: code }))}
        />
        <div>
          <Button type="submit">Save settings</Button>
        </div>
      </form>
    </div>
  )
}
