import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { authApi } from '../auth.api';
import { errorMessage } from '../../../utils/errors';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      await authApi.forgotPassword(email.trim());
      // The server answers the same whether or not the address has an account.
      navigate(`/dashboard/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(errorMessage(err, 'Failed to request a password reset. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we will send you a 6-digit code">
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
          {loading ? <span className="spinner" /> : 'Send code'}
        </button>
      </form>

      <div className="auth-footer">
        <Link to="/dashboard/login/admin" className="auth-link">
          ← Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
