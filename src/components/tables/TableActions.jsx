import Button from '../common/Button'

export default function TableActions({ actions = [] }) {
  return (
    <div className="table-actions">
      {actions.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant={action.tone ?? 'ghost'}
          onClick={(event) => {
            event.stopPropagation()
            action.onClick?.()
          }}
        >
          {action.label}
        </Button>
      ))}
    </div>
  )
}
