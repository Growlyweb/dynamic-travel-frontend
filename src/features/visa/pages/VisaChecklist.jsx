import { useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import { cn } from '../../../utils/helpers'

const CHECKLIST_GROUPS = [
  { id: 'identity', title: 'Identity', items: ['Passport bio page', 'Recent photograph', 'National ID'] },
  { id: 'financials', title: 'Financials', items: ['Bank statements (3 months)', 'Sponsor letter'] },
  { id: 'travel', title: 'Travel', items: ['Flight reservation', 'Hotel booking', 'Travel insurance'] },
]

const INITIAL_CHECKED = ['Passport bio page', 'Recent photograph', 'Flight reservation']

export default function VisaChecklist() {
  const [checked, setChecked] = useState(() => new Set(INITIAL_CHECKED))

  function toggle(item) {
    setChecked((current) => {
      const next = new Set(current)
      if (next.has(item)) next.delete(item)
      else next.add(item)
      return next
    })
  }

  const totalItems = CHECKLIST_GROUPS.reduce((sum, group) => sum + group.items.length, 0)

  return (
    <div className="stack">
      <PageHeader
        title="Visa checklist"
        description="Standard document checklist template used across applications."
        breadcrumbs={[{ label: 'Visa' }, { label: 'Checklists' }]}
      />
      <p className="muted">
        {checked.size} of {totalItems} items collected
      </p>
      <div className="grid grid--3">
        {CHECKLIST_GROUPS.map((group) => {
          const collected = group.items.filter((item) => checked.has(item)).length
          return (
            <div className="card" key={group.id}>
              <div className="row between mb-3">
                <p className="card__title" style={{ marginBottom: 0 }}>
                  {group.title}
                </p>
                <span className="muted small">
                  {collected}/{group.items.length}
                </span>
              </div>
              <ul className="stack stack--sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {group.items.map((item) => (
                  <li key={item}>
                    <label className={cn('checkbox', checked.has(item) && 'muted')}>
                      <input type="checkbox" checked={checked.has(item)} onChange={() => toggle(item)} />
                      {item}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
