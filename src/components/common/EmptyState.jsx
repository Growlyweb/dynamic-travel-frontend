export default function EmptyState({ icon = '📭', title = 'Nothing here yet', description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden>
        {icon}
      </div>
      <p className="empty-state__title">{title}</p>
      {description ? <p className="empty-state__description">{description}</p> : null}
      {action ? <div className="error-state__actions">{action}</div> : null}
    </div>
  )
}
