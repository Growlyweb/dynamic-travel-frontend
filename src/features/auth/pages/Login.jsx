import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import { useAuth } from '../../../hooks/useAuth';

export default function Login() {
  const { role: routeRole } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const isStaff = routeRole === 'staff' || location.pathname.includes('/staff');
  const activeRole = isStaff ? 'staff' : 'admin';
  const isAdmin = !isStaff;

  const [email, setEmail] = useState(isStaff ? 'staff@dynamic-travel.com' : 'admin@dynamic-travel.com');
  const [password, setPassword] = useState(isStaff ? 'staff123' : 'admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state when switching routes (/dashboard/login/admin <-> /dashboard/login/staff)
  useEffect(() => {
    setEmail(isStaff ? 'staff@dynamic-travel.com' : 'admin@dynamic-travel.com');
    setPassword(isStaff ? 'staff123' : 'admin123');
    setError('');
  }, [isStaff]);

  if (isAuthenticated) {
    const from = location.state?.from || '/dashboard';
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login({ email, password, role: activeRole });
      const from = location.state?.from || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const title = isAdmin ? 'Admin Login' : 'Staff Login';
  const subtitle = isAdmin ? 'Sign in to access admin system controls' : 'Sign in to access staff operations';
  const switchPath = isAdmin ? '/dashboard/login/staff' : '/dashboard/login/admin';
  const forgotPath = isAdmin ? '/dashboard/forgot-password/admin' : '/dashboard/forgot-password/staff';

  return (
    <AuthLayout title={title} >
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
            required
          />
        </div>

        <div className="auth-field">
          <div className="auth-label">
            <label htmlFor="auth-password">Password</label>
            {/* <Link to={forgotPath} className="auth-link">
              Forgot password?
            </Link> */}
          </div>
          <PasswordInput
            id="auth-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={Boolean(error)}
          />
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <span className="spinner" /> : `Sign In as ${isAdmin ? 'Admin' : 'Staff'}`}
        </button>
      </form>

      {/* <div className="auth-footer">
        <Link to={switchPath} className="auth-link">
          {switchLabel}
        </Link>
      </div> */}
    </AuthLayout>
  );
}
