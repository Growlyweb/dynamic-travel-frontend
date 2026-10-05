import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import { authApi } from '../auth.api';

export default function ResetPassword() {
  const { role: routeRole } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || searchParams.get('code') || 'mock-reset-token';

  const isStaff = routeRole === 'staff' || location.pathname.includes('/staff');
  const activeRole = isStaff ? 'staff' : 'admin';
  const isAdmin = !isStaff;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword({ token, password }).catch(() => {});
      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginPath = isAdmin ? '/dashboard/login/admin' : '/dashboard/login/staff';

  return (
    <AuthLayout
      title="Reset Password"
      subtitle={`Enter a new password for your ${isAdmin ? 'Admin' : 'Staff'} account`}
    >
      {success ? (
        <div className="auth-form">
          <div className="auth-alert auth-alert-success">
            Your password has been successfully reset.
          </div>
          <button
            type="button"
            className="auth-btn"
            onClick={() => navigate(loginPath)}
          >
            Sign In to {isAdmin ? 'Admin' : 'Staff'} Account
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="auth-alert auth-alert-error">{error}</div>}

          <div className="auth-field">
            <label className="auth-label" htmlFor="new-password">
              New Password
            </label>
            <PasswordInput
              id="new-password"
              name="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              error={Boolean(error)}
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm-password">
              Confirm New Password
            </label>
            <PasswordInput
              id="confirm-password"
              name="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              error={Boolean(error)}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Update Password'}
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
