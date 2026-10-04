import Sidebar from './Sidebar'

export default function MobileSidebar({ open, onClose }) {
  if (!open) return null

  return (
    <div
      className="mobile-sidebar"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="mobile-sidebar__panel">
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  )
}
