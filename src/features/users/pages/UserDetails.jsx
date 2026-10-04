import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import UserStatusBadge from '../components/UserStatusBadge'
import { usersApi } from '../users.api'
import { APP_ROUTES } from '../../../utils/constants'
import { formatDate, initials, titleCase } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function UserDetails() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    usersApi
      .get(id)
      .then((result) => active && setUser(result))
      .catch((loadError) => active && setError(loadError))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  if (loading) return <Loader fullPage label="Loading user…" />
  if (error) return <ErrorState title="Could not load this user" message={getApiErrorMessage(error)} />

  return (
    <div className="stack">
      <PageHeader
        title={user.name}
        description={user.email}
        breadcrumbs={[{ label: 'Users', to: APP_ROUTES.USERS }, { label: user.name }]}
        actions={
          <>
            <Link to={APP_ROUTES.USERS}>
              <Button variant="ghost">Back</Button>
            </Link>
            <Link to={APP_ROUTES.USER_EDIT(user.id)}>
              <Button>Edit user</Button>
            </Link>
          </>
        }
      />

      <div className="card">
        <div className="row mb-4">
          <span className="avatar avatar--lg">{initials(user.name)}</span>
          <div>
            <p className="strong">{user.name}</p>
            <UserStatusBadge status={user.status} />
          </div>
        </div>
        <dl className="detail-list">
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{titleCase(user.role)}</dd>
          </div>
          <div>
            <dt>Joined</dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd>{user.id}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
