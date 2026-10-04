import { NavLink } from 'react-router-dom'
import { usePermission } from '../../hooks/usePermission'
import { useAuth } from '../../hooks/useAuth'
import { NAV_SECTIONS } from '../../utils/constants'
import { ROLE_LABELS } from '../../utils/roles'
import { cn } from '../../utils/helpers'
import { initials } from '../../utils/formatters'


export default function Sidebar({ onNavigate }) {
  const { can } = usePermission()
  const { user } = useAuth()

  return (
    <aside className="sidebar">
      {/* Sidebar Top Brand */}
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden>
          🧭
        </span>
        <div>
          <p className="sidebar__title">Travel Dashboard</p>
          <p className="sidebar__subtitle">Operations console</p>
        </div>
      </div>

      {/* Sidebar Nav Items */}
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

      {/* Sidebar Bottom Avatar */}
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
