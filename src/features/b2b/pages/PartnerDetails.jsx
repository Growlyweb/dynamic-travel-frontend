import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import PartnerStatusBadge from '../components/PartnerStatusBadge'
import CommissionSummary from '../components/CommissionSummary'
import { b2bApi } from '../b2b.api'
import { APP_ROUTES } from '../../../utils/constants'
import { formatDate, titleCase } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function PartnerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    b2bApi
      .getPartner(id)
      .then((result) => active && setPartner(result))
      .catch((loadError) => active && setError(loadError))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  if (loading) return <Loader fullPage label="Loading partner…" />
  if (error) return <ErrorState title="Could not load this partner" message={getApiErrorMessage(error)} />
  if (!partner) return null

  return (
    <div className="stack">
      <PageHeader
        title={partner.name}
        description={partner.company}
        breadcrumbs={[{ label: 'Partners', to: APP_ROUTES.B2B_PARTNERS }, { label: partner.name }]}
        actions={
          <Button variant="ghost" onClick={() => navigate(APP_ROUTES.B2B_PARTNERS)}>
            Back
          </Button>
        }
      />

      <div className="card">
        <div className="row between row--wrap">
          <PartnerStatusBadge status={partner.status} />
          <span className="muted small">Tier: {titleCase(partner.tier)}</span>
        </div>
        <dl className="detail-list mt-4">
          <div>
            <dt>Company</dt>
            <dd>{partner.company}</dd>
          </div>
          <div>
            <dt>Country</dt>
            <dd>{partner.country}</dd>
          </div>
          <div>
            <dt>Commission due</dt>
            <dd>{partner.commissionDue}</dd>
          </div>
          <div>
            <dt>Joined</dt>
            <dd>{formatDate(partner.joinedAt)}</dd>
          </div>
        </dl>
      </div>

      <CommissionSummary
        summary={{
          totalEarned: partner.commissionDue,
          outstanding: partner.commissionDue,
          paidOut: 0,
          averageRate: '—',
        }}
      />
    </div>
  )
}
