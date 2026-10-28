import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import PartnerStatusBadge from '../components/PartnerStatusBadge'
import PartnerDecisionDialog from '../components/PartnerDecisionDialog'
import PartnerDocumentList from '../components/PartnerDocumentList'
import { b2bApi } from '../b2b.api'
import { useToast } from '../../../context/ToastContext'
import { APP_ROUTES } from '../../../utils/constants'
import { formatDate } from '../../../utils/formatters'
import { errorMessage } from '../../../utils/errors'

// What an administrator may decide from each state. A partner is approved only when its documents have been looked at.
const ACTIONS = {
  pending: [['UNDER_REVIEW', 'Put under review'], ['APPROVED', 'Approve'], ['REJECTED', 'Reject']],
  under_review: [['APPROVED', 'Approve'], ['REJECTED', 'Reject']],
  approved: [['SUSPENDED', 'Suspend']],
  suspended: [['APPROVED', 'Reactivate']],
  rejected: [['UNDER_REVIEW', 'Review again']],
}

export default function PartnerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [decision, setDecision] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setPartner(await b2bApi.getPartner(id))
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Loader fullPage label="Loading partner…" />
  if (error) return <ErrorState title="Could not load this partner" message={errorMessage(error)} onRetry={load} />

  return (
    <div className="stack">
      <PageHeader
        title={partner.company}
        description={partner.name}
        breadcrumbs={[{ label: 'Partners', to: APP_ROUTES.B2B_PARTNERS }, { label: partner.company }]}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate(APP_ROUTES.B2B_PARTNERS)}>Back</Button>
            {(ACTIONS[partner.status] ?? []).map(([key, label]) => (
              <Button key={key} variant={key === 'REJECTED' || key === 'SUSPENDED' ? 'ghost' : 'primary'} onClick={() => setDecision(key)}>{label}</Button>
            ))}
          </>
        }
      />

      <div className="card">
        <div className="row between row--wrap">
          <PartnerStatusBadge status={partner.status} />
          {partner.reviewedAt ? <span className="muted small">Decided on {formatDate(partner.reviewedAt)}</span> : null}
        </div>
        {partner.reviewNote ? <p className="muted small mt-2">Note: {partner.reviewNote}</p> : null}
        <dl className="detail-list mt-4">
          <div><dt>Company</dt><dd>{partner.company}</dd></div>
          <div><dt>License number</dt><dd>{partner.licenseNo}</dd></div>
          <div><dt>Business type</dt><dd>{partner.businessType || '—'}</dd></div>
          <div><dt>Contact person</dt><dd>{partner.name}</dd></div>
          <div><dt>Email</dt><dd>{partner.email || '—'}</dd></div>
          <div><dt>Phone</dt><dd>{partner.phone || '—'}</dd></div>
          <div><dt>Address</dt><dd>{partner.address || '—'}</dd></div>
          <div><dt>Account</dt><dd>{partner.isActive ? 'Active' : partner.accountStatus || 'Not active'}</dd></div>
          <div><dt>Joined</dt><dd>{formatDate(partner.joinedAt)}</dd></div>
        </dl>
      </div>

      <div className="card">
        <p className="card__title" style={{ marginBottom: 0 }}>Verification documents</p>
        <p className="muted small">{partner.verifiedDocumentCount} of {partner.documentCount} verified</p>
        <div className="mt-3">
          <PartnerDocumentList partner={partner} onChanged={load} />
        </div>
      </div>

      <PartnerDecisionDialog
        decision={decision}
        partner={partner}
        onClose={() => setDecision(null)}
        onDecide={async (value, note) => {
          await b2bApi.decide(partner.id, value, note)
          setDecision(null)
          toast.success('Decision saved.')
          await load()
        }}
      />
    </div>
  )
}
