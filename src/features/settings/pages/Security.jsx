import PageHeader from '../../../components/layout/PageHeader'
import Badge from '../../../components/common/Badge'
import ChangePasswordForm from '../components/ChangePasswordForm'

const SESSIONS = [
  { device: 'Chrome · Windows', location: 'Dubai, UAE', current: true },
  { device: 'Safari · iPhone 15', location: 'Dubai, UAE', current: false },
]

export default function Security() {
  return (
    <div className="stack">
      <PageHeader
        title="Security"
        description="Password, sessions and two-factor authentication."
        breadcrumbs={[{ label: 'Settings' }, { label: 'Security' }]}
      />

      <ChangePasswordForm />

      <div className="card stack" style={{ maxWidth: 560 }}>
        <p className="card__title">Active sessions</p>
        {SESSIONS.map((session) => (
          <div className="row between" key={session.device}>
            <div>
              <p className="strong">{session.device}</p>
              <p className="muted small">{session.location}</p>
            </div>
            {session.current ? <Badge tone="success">This device</Badge> : <Button size="sm" variant="ghost">Revoke</Button>}
          </div>
        ))}
      </div>
    </div>
  )
}
