import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import EmptyState from '../../../components/common/EmptyState'
import { b2cApi } from '../b2c.api'
import { membershipApi } from '../../membership/membership.api'
import { APP_ROUTES } from '../../../utils/constants'
import { formatDate, formatCurrency, initials } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function CustomerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [memberships, setMemberships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([b2cApi.get(id), membershipApi.listCustomerMemberships(id)])
      .then(([customerResult, membershipResult]) => {
        if (!active) return
        setCustomer(customerResult)
        setMemberships(membershipResult.items ?? [])
      })
      .catch((loadError) => active && setError(loadError))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  if (loading) return <Loader fullPage label="Loading customer…" />
  if (error) return <ErrorState title="Could not load this customer" message={getApiErrorMessage(error)} />
  if (!customer) return null

  const current = memberships.find((membership) => membership.status === 'active')
  const history = memberships.filter((membership) => membership !== current)

  return (
    <div className="stack">
      <PageHeader
        title={customer.name}
        description={customer.email}
        breadcrumbs={[{ label: 'Customers', to: APP_ROUTES.B2C_CUSTOMERS }, { label: customer.name }]}
        actions={
          <Button variant="ghost" onClick={() => navigate(APP_ROUTES.B2C_CUSTOMERS)}>
            Back
          </Button>
        }
      />

      <div className="card">
        <div className="row mb-4">
          <span className="avatar avatar--lg">{initials(customer.name)}</span>
          <div>
            <p className="strong">{customer.name}</p>
            <p className="muted small">{customer.phone}</p>
          </div>
        </div>
        <dl className="detail-list">
          <div>
            <dt>Country</dt>
            <dd>{customer.country}</dd>
          </div>
          <div>
            <dt>Bookings</dt>
            <dd>{customer.bookings}</dd>
          </div>
          <div>
            <dt>Total spend</dt>
            <dd>{formatCurrency(customer.totalSpend)}</dd>
          </div>
          <div>
            <dt>Joined</dt>
            <dd>{formatDate(customer.joinedAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="card">
        <p className="card__title">Bookings</p>
        <EmptyState
          icon="🧾"
          title="No bookings yet"
          description="Wire up your bookings API to list this customer's trips here."
        />
      </div>

      <div className="card">
        <div className="row between">
          <p className="card__title" style={{ marginBottom: 0 }}>
            Membership {current ? <Badge tone="primary">Member</Badge> : null}
          </p>
          <Button size="sm" variant="ghost" onClick={() => navigate(APP_ROUTES.MEMBERSHIP_MEMBERS)}>
            Manage in Membership
          </Button>
        </div>
        {current ? (
          <dl className="detail-list mt-2">
            <div>
              <dt>Current plan</dt>
              <dd className="strong">{current.planSnapshot.name}</dd>
            </div>
            <div>
              <dt>Valid until</dt>
              <dd>{formatDate(current.endDate)} <span className="muted small">({current.daysLeft} days left)</span></dd>
            </div>
            <div>
              <dt>Discounts</dt>
              <dd>
                {current.planSnapshot.tourDiscountPercent}% tours · {current.planSnapshot.visaDiscountPercent}% visa
                {current.planSnapshot.maxDiscountAmount ? ` · cap ${formatCurrency(current.planSnapshot.maxDiscountAmount, 'BDT')}` : ''}
              </dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{formatCurrency(current.payment.amount, 'BDT')} · {current.payment.status}</dd>
            </div>
          </dl>
        ) : (
          <p className="muted small mt-2">No active membership — the customer pays full price for tours and visas.</p>
        )}
        {history.length ? (
          <>
            <p className="card__title mt-4">History</p>
            <ul className="stack stack--sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {history.map((membership) => (
                <li key={membership.id} className="row between">
                  <span>
                    <span className="strong">{membership.planSnapshot.name}</span>{' '}
                    <span className="muted small">
                      {formatDate(membership.startDate)} → {formatDate(membership.endDate)}
                    </span>
                    {membership.cancelReason ? (
                      <span className="muted small" style={{ display: 'block' }}>{membership.cancelReason}</span>
                    ) : null}
                  </span>
                  <Badge tone={membership.status === 'expired' ? 'neutral' : 'danger'}>{membership.status}</Badge>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  )
}
