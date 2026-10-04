import { Link } from 'react-router-dom'
import ForgotPasswordForm from '../components/ForgotPasswordForm'
import { APP_ROUTES } from '../../../utils/constants'

export default function ForgotPassword() {
  return (
    <div className="auth-screen">
      <div className="auth-screen__card card">
        <div className="auth-screen__brand">
          <h1>Forgot password</h1>
          <p className="muted">Enter your email and we will send you a reset link.</p>
        </div>
        <ForgotPasswordForm />
        <div className="auth-screen__links">
          <Link to={APP_ROUTES.LOGIN}>Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
