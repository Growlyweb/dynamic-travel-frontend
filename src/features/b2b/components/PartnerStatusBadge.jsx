import Badge from '../../../components/common/Badge'
import { titleCase } from '../../../utils/formatters'

const STATUS_TONES = { pending: 'warning', approved: 'success', suspended: 'danger', rejected: 'neutral' }

export default function PartnerStatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{titleCase(status)}</Badge>
}
