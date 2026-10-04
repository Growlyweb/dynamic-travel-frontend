import Badge from '../../../components/common/Badge'

const STATUS_TONES = {
  active: 'success',
  invited: 'info',
  suspended: 'danger',
}

export default function UserStatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{status}</Badge>
}
