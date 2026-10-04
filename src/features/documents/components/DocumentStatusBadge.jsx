import Badge from '../../../components/common/Badge'

const STATUS_TONES = { pending: 'warning', verified: 'success', rejected: 'danger' }

export default function DocumentStatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{status}</Badge>
}
