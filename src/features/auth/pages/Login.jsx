import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import { useAuth } from '../../../hooks/useAuth';
import { errorMessage, fieldErrors } from '../../../utils/errors';

// One sign-in for everyone who works here. The account decides what a person sees, so there is no role to pick.
export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, ready } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(false);

  const destination = location.state?.from || '/dashboard';

  if (ready && isAuthenticated) {
    navigate(destination, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFields({});

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login({ email: email.trim(), password });
      navigate(destination, { replace: true });
    } catch (err) {
      setFields(fieldErrors(err));
      setError(errorMessage(err, 'Invalid credentials. Please check your email and password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Use the account you were given for the dashboard">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error && <div className="auth-alert auth-alert-error">{error}</div>}

        <div className="auth-field">
          <label className="auth-label" htmlFor="auth-email">
            Email address
          </label>
          <input
            id="auth-email"
            type="email"
            className={`auth-input ${error ? 'has-error' : ''}`}
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            required
          />
          {fields.email && <span className="auth-field-error">{fields.email}</span>}
        </div>

        <div className="auth-field">
          <div className="auth-label">
            <label htmlFor="auth-password">Password</label>
            <Link to="/dashboard/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="auth-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={Boolean(error)}
          />
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
