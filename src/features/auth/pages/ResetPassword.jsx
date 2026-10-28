import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import { authApi } from '../auth.api';
import { errorMessage, fieldErrors } from '../../../utils/errors';
import { PASSWORD_HINT, validateNewPassword } from '../auth.validation';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    const problem = validateNewPassword(password, confirmPassword);
    if (problem) {
      setError(problem);
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword({ email, otp: otp.trim(), password });
      setSuccess(true);
    } catch (err) {
      setError(fieldErrors(err).newPassword || errorMessage(err, 'Failed to reset the password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle={email ? `Enter the code sent to ${email} and choose a new password` : 'Enter the code from the email and choose a new password'}>
      {success ? (
        <div className="auth-form">
          <div className="auth-alert auth-alert-success">Your password has been reset. You can sign in now.</div>
          <button type="button" className="auth-btn" onClick={() => navigate('/dashboard/login/admin')}>
            Go to sign in
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="auth-alert auth-alert-error">{error}</div>}

          <div className="auth-field">
            <label className="auth-label" htmlFor="reset-code">
              6-digit code
            </label>
            <input
              id="reset-code"
              inputMode="numeric"
              maxLength={6}
              className={`auth-input ${error ? 'has-error' : ''}`}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="new-password">
              New password
            </label>
            <PasswordInput id="new-password" name="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={PASSWORD_HINT} error={Boolean(error)} />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm-password">
              Confirm new password
            </label>
            <PasswordInput id="confirm-password" name="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" error={Boolean(error)} />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Update password'}
          </button>
        </form>
      )}

      <div className="auth-footer">
        <Link to="/dashboard/login/admin" className="auth-link">
          ← Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
