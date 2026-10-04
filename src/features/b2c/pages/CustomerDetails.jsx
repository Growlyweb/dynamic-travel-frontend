import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import EmptyState from '../../../components/common/EmptyState'
import { b2cApi } from '../b2c.api'
import { APP_ROUTES } from '../../../utils/constants'
import { formatDate, formatCurrency, initials } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function CustomerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    b2cApi
      .get(id)
      .then((result) => active && setCustomer(result))
      .catch((loadError) => active && setError(loadError))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  if (loading) return <Loader fullPage label="Loading customer…" />
  if (error) return <ErrorState title="Could not load this customer" message={getApiErrorMessage(error)} />
  if (!customer) return null

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
    </div>
  )
}
