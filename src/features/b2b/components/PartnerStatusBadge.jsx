import Badge from '../../../components/common/Badge'

const STATUS_TONES = {
  pending: 'warning',
  under_review: 'info',
  approved: 'success',
  suspended: 'danger',
  rejected: 'neutral',
}

export default function PartnerStatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{String(status).replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())}</Badge>
}
