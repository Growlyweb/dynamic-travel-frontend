import { Link, Navigate } from 'react-router-dom'
import LoginForm from '../components/LoginForm'
import { useAuth } from '../../../hooks/useAuth'
import { APP_ROUTES } from '../../../utils/constants'
import Loader from '../../../components/common/Loader'

export default function Login() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to={APP_ROUTES.DASHBOARD} replace />

  return (
    <div className="auth-screen">
      <div className="auth-screen__card card">
        <div className="auth-screen__brand">
          <span className="auth-screen__logo" aria-hidden>
            🧭
          </span>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to manage visas, tours and partners.</p>
        </div>
        <LoginForm />
        <div className="auth-screen__links">
          <Link to={APP_ROUTES.FORGOT_PASSWORD}>Forgot password?</Link>
          <span className="muted">v0.1.0</span>
        </div>
      </div>
    </div>
  )
}
