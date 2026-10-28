import Badge from '../../../components/common/Badge'

const STATUS_TONES = {
  active: 'success',
  invited: 'info',
  suspended: 'danger',
  blocked: 'danger',
  inactive: 'neutral',
}

const LABELS = { invited: 'Invited' }

export default function UserStatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{LABELS[status] ?? String(status).replace(/^./, (c) => c.toUpperCase())}</Badge>
}
