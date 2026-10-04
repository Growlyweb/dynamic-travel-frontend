import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../context/NotificationContext'
import { APP_ROUTES } from '../../utils/constants'
import { ROLE_LABELS } from '../../utils/roles'
import { formatRelativeTime, initials, titleCase } from '../../utils/formatters'

const NOTIFICATION_ICONS = {
  visa: '🛂',
  tour: '🧳',
  b2b: '🤝',
  system: '⚙️',
}

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const [openMenu, setOpenMenu] = useState(null) // 'notifications' | 'user' | null
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function onDocumentClick(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDocumentClick)
    return () => document.removeEventListener('mousedown', onDocumentClick)
  }, [])

  async function handleLogout() {
    setOpenMenu(null)
    await logout()
    navigate(APP_ROUTES.LOGIN, { replace: true })
  }

  const visibleNotifications = notifications.slice(0, 4)

  return (
    <header className="header">
      <button type="button" className="icon-btn header__menu-btn" onClick={onMenuClick} aria-label="Open menu">
        ☰
      </button>

      <div className="header__search">
        <input
          className="field__control"
          type="search"
          placeholder="Search applications, tours, partners…"
          aria-label="Search"
        />
      </div>

      <div className="header__right" ref={wrapRef}>
        <div className="header__user-wrap">
          <button
            type="button"
            className="header__user-btn"
            onClick={() => setOpenMenu((menu) => (menu === 'user' ? null : 'user'))}
          >
            <span className="avatar">{initials(user?.name ?? 'ABL Travel')}</span>
            <span>
              <p className="strong">{user?.name ?? 'Admin'}</p>
              <p className="muted small" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ABL Travel</p>
            </span>
          </button>

          {openMenu === 'user' ? (
            <div className="menu menu--sm">
              <ul className="menu__list">
                <li>
                  <NavLink className="menu__item" to={APP_ROUTES.SETTINGS_PROFILE} onClick={() => setOpenMenu(null)}>
                    Profile
                  </NavLink>
                </li>
                <li>
                  <NavLink className="menu__item" to={APP_ROUTES.SETTINGS_GENERAL} end onClick={() => setOpenMenu(null)}>
                    Settings
                  </NavLink>
                </li>
                <li>
                  <NavLink className="menu__item" to={APP_ROUTES.SETTINGS_SECURITY} onClick={() => setOpenMenu(null)}>
                    Security
                  </NavLink>
                </li>
                <li>
                  <button type="button" className="menu__item" onClick={handleLogout}>
                    Log out
                  </button>
                </li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
