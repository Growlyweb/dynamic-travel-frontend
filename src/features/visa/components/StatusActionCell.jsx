import Button from '../../../components/common/Button'
import VisaStatusBadge from './VisaStatusBadge'
import { nextStatuses } from '../statusRules'

// The status of one application and a button to change it, shown only when there is a move to offer.
export function StatusActionCell({ row, statuses, isAdmin, onChange }) {
  const label = statuses.find((status) => status.key === row.status)?.displayName
  const canMove = nextStatuses(row.status, statuses, { isAdmin }).length > 0

  return (
    <div className="inline-flex items-center gap-2 py-0.5">
      <VisaStatusBadge status={row.status} label={label} />
      {canMove ? (
        <Button size="sm" variant="ghost" onClick={() => onChange?.(row)}>
          Change
        </Button>
      ) : null}
    </div>
  )
}

export default StatusActionCell
