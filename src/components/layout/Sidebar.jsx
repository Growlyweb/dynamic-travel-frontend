import { NavLink } from 'react-router-dom'
import { usePermission } from '../../hooks/usePermission'
import { useAuth } from '../../hooks/useAuth'
import { APP_ROUTES } from '../../utils/constants'
import { ROLE_LABELS } from '../../utils/roles'
import { cn } from '../../utils/helpers'
import { initials } from '../../utils/formatters'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: APP_ROUTES.DASHBOARD, label: 'Dashboard', icon: '📊', end: true }],
  },
  {
    label: 'Visa',
    items: [
      { to: APP_ROUTES.VISA_APPLICATIONS, label: 'Applications', icon: '🛂', permission: 'visa.view' },
      { to: APP_ROUTES.VISA_CHECKLIST, label: 'Checklists', icon: '✅', permission: 'visa.view' },
      { to: APP_ROUTES.VISA_COUNTRIES, label: 'Countries', icon: '🌍', permission: 'visa.view' },
      { to: APP_ROUTES.VISA_STATUS, label: 'Status board', icon: '🗂️', permission: 'visa.view' },
    ],
  },
  {
    label: 'Tours',
    items: [
      { to: APP_ROUTES.TOURS, label: 'Packages', icon: '🧳', permission: 'tours.view' },
      { to: APP_ROUTES.TOUR_CUSTOM, label: 'Custom tours', icon: '📝', permission: 'tours.view' },
    ],
  },
  {
    label: 'Partners · B2B',
    items: [
      { to: APP_ROUTES.B2B_PARTNERS, label: 'Partners', icon: '🤝', permission: 'b2b.view' },
      { to: APP_ROUTES.B2B_APPLICATIONS, label: 'Applications', icon: '📩', permission: 'b2b.view' },
      { to: APP_ROUTES.B2B_PICKUPS, label: 'Pickup requests', icon: '🚐', permission: 'b2b.view' },
      { to: APP_ROUTES.B2B_COMMISSIONS, label: 'Commissions', icon: '💸', permission: 'b2b.view' },
      { to: APP_ROUTES.B2B_WITHDRAWALS, label: 'Withdrawals', icon: '🏦', permission: 'b2b.view' },
      { to: APP_ROUTES.B2B_DOCUMENTS, label: 'Documents', icon: '📄', permission: 'b2b.view' },
    ],
  },
  {
    label: 'Customers · B2C',
    items: [{ to: APP_ROUTES.B2C_CUSTOMERS, label: 'Customers', icon: '🧍', permission: 'b2c.view' }],
  },
  {
    label: 'Administration',
    items: [
      { to: APP_ROUTES.USERS, label: 'Users', icon: '👥', permission: 'users.view' },
      { to: APP_ROUTES.DOCUMENTS, label: 'All documents', icon: '🗄️', permission: 'documents.view' },
      { to: APP_ROUTES.NOTIFICATIONS, label: 'Notifications', icon: '🔔' },
      { to: APP_ROUTES.REPORTS, label: 'Reports', icon: '📈', permission: 'reports.view' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: APP_ROUTES.SETTINGS_PROFILE, label: 'Profile', icon: '👤', end: true },
      { to: APP_ROUTES.SETTINGS_GENERAL, label: 'Settings', icon: '⚙️', end: true },
      { to: APP_ROUTES.SETTINGS_SECURITY, label: 'Security', icon: '🔒', end: true },
    ],
  },
]

export default function Sidebar({ onNavigate }) {
  const { can } = usePermission()
  const { user } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden>
          🧭
        </span>
        <div>
          <p className="sidebar__title">Travel Dashboard</p>
          <p className="sidebar__subtitle">Operations console</p>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) => !item.permission || can(item.permission))
          if (!items.length) return null
          return (
            <div className="sidebar__section" key={section.label}>
              <p className="sidebar__section-label">{section.label}</p>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) => cn('sidebar__link', isActive && 'is-active')}
                >
                  <span className="sidebar__icon" aria-hidden>
                    {item.icon}
                  </span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <span className="avatar avatar--sm">{initials(user?.name)}</span>
          <div>
            <p>{user?.name ?? 'Signed out'}</p>
            <p className="muted">{ROLE_LABELS[user?.role] ?? user?.role ?? '—'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
