import { Link, useSearchParams } from 'react-router-dom'
import ResetPasswordForm from '../components/ResetPasswordForm'
import { APP_ROUTES } from '../../../utils/constants'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  return (
    <div className="auth-screen">
      <div className="auth-screen__card card">
        <div className="auth-screen__brand">
          <h1>Reset password</h1>
          <p className="muted">Choose a new password for your account.</p>
        </div>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="alert alert--danger">
            This reset link is missing its token. Request a new link from the forgot password page.
          </div>
        )}
        <div className="auth-screen__links">
          <Link to={APP_ROUTES.LOGIN}>Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
