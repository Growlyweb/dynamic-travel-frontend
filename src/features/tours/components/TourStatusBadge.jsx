import Badge from '../../../components/common/Badge'
import { titleCase } from '../../../utils/formatters'

const STATUS_TONES = { draft: 'warning', published: 'success', archived: 'neutral' }

export default function TourStatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{titleCase(status)}</Badge>
}
