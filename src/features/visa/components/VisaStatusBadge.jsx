import Badge from '../../../components/common/Badge'
import { titleCase } from '../../../utils/formatters'

const STATUS_TONES = {
  submitted: 'info',
  in_review: 'warning',
  action_required: 'danger',
  approved: 'success',
  rejected: 'neutral',
}

export default function VisaStatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{titleCase(status)}</Badge>
}
