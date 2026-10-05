import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { authApi } from '../auth.api';

export default function ForgotPassword() {
  const { role: routeRole } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isStaff = routeRole === 'staff' || location.pathname.includes('/staff');
  const activeRole = isStaff ? 'staff' : 'admin';
  const isAdmin = !isStaff;

  const [email, setEmail] = useState(isAdmin ? 'admin@dynamic-travel.com' : 'staff@dynamic-travel.com');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      await authApi.forgotPassword(email).catch(() => {});
      setSent(true);

      if (isAdmin) {
        // Admin goes directly to reset password
        setTimeout(() => {
          navigate(`/dashboard/reset-password/admin?email=${encodeURIComponent(email)}`);
        }, 1200);
      } else {
        // Staff goes to OTP verification
        setTimeout(() => {
          navigate(`/dashboard/verify-otp/staff?email=${encodeURIComponent(email)}`);
        }, 1200);
      }
    } catch (err) {
      setError(err?.message || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginPath = isAdmin ? '/dashboard/login/admin' : '/dashboard/login/staff';

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle={
        isAdmin
          ? 'Enter your email to receive password reset instructions'
          : 'Enter your email to receive a 6-digit verification code'
      }
    >
      {sent ? (
        <div className="auth-form">
          <div className="auth-alert auth-alert-success">
            {isAdmin
              ? 'Password reset instructions sent. Redirecting to reset password...'
              : '6-digit verification code sent. Redirecting to OTP verification...'}
          </div>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="auth-alert auth-alert-error">{error}</div>}

          <div className="auth-field">
            <label className="auth-label" htmlFor="reset-email">
              Email address
            </label>
            <input
              id="reset-email"
              type="email"
              className={`auth-input ${error ? 'has-error' : ''}`}
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Continue'}
          </button>
        </form>
      )}

      <div className="auth-footer">
        <Link to={loginPath} className="auth-link">
          ← Back to {isAdmin ? 'Admin' : 'Staff'} Login
        </Link>
      </div>
    </AuthLayout>
  );
}
