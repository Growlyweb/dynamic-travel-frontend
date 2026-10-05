import Badge from '../../../components/common/Badge'
import { titleCase } from '../../../utils/formatters'
import { VISA_STATUS_TONES } from '../../../utils/constants'

export default function VisaStatusBadge({ status }) {
  return <Badge tone={VISA_STATUS_TONES[status] ?? 'neutral'}>{titleCase(status)}</Badge>
}
