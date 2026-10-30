import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import { authApi } from '../auth.api';
import { errorMessage, fieldErrors } from '../../../utils/errors';
import { PASSWORD_HINT, validateNewPassword } from '../auth.validation';

// Where the link in a staff invitation opens. The person chooses a password and the account becomes active.
export default function SetupAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const problem = validateNewPassword(password, confirmPassword);
    if (problem) {
      setError(problem);
      return;
    }

    try {
      setLoading(true);
      await authApi.setupAccount({ token, password });
      setSuccess(true);
    } catch (err) {
      setError(fieldErrors(err).password || errorMessage(err, 'This invitation link is not valid any more. Ask an administrator to send a new one.'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invitation link missing" subtitle="Open the link from your invitation email.">
        <div className="auth-footer">
          <Link to="/dashboard/login/admin" className="auth-link">
            ← Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set up your account" subtitle="Choose a password to finish. You can sign in right after.">
      {success ? (
        <div className="auth-form">
          <div className="auth-alert auth-alert-success">Your account is ready.</div>
          <button type="button" className="auth-btn" onClick={() => navigate('/dashboard/login/admin')}>
            Go to sign in
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="auth-alert auth-alert-error">{error}</div>}

          <div className="auth-field">
            <label className="auth-label" htmlFor="setup-password">
              Password
            </label>
            <PasswordInput id="setup-password" name="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={PASSWORD_HINT} error={Boolean(error)} autoFocus />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="setup-confirm">
              Confirm password
            </label>
            <PasswordInput id="setup-confirm" name="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" error={Boolean(error)} />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Activate account'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
