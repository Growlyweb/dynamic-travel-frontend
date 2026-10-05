import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { OtpInput } from '../components/OtpInput';
import { authApi } from '../auth.api';

export default function VerifyOTP() {
  const { role: routeRole } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const isStaff = routeRole === 'staff' || location.pathname.includes('/staff');
  const activeRole = isStaff ? 'staff' : 'admin';

  // If Admin hits verify-otp, forward directly to reset-password
  useEffect(() => {
    if (activeRole === 'admin') {
      navigate(`/dashboard/reset-password/admin?email=${encodeURIComponent(email)}`, { replace: true });
    }
  }, [activeRole, email, navigate]);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (otp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      await authApi.verifyOtp({ email, code: otp }).catch(() => {});
      navigate(`/dashboard/reset-password/staff?email=${encodeURIComponent(email)}&code=${encodeURIComponent(otp)}`);
    } catch (err) {
      setError(err?.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setResendMessage('');

    try {
      await authApi.forgotPassword(email).catch(() => {});
      setResendTimer(60);
      setResendMessage('A new verification code has been sent to your email.');
    } catch (err) {
      setError(err?.message || 'Failed to resend verification code.');
    }
  };

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle={`Enter the 6-digit code sent to ${email || 'your email'}`}
    >
      <form className="auth-form" onSubmit={handleVerify}>
        {error && <div className="auth-alert auth-alert-error">{error}</div>}
        {resendMessage && <div className="auth-alert auth-alert-success">{resendMessage}</div>}

        <div className="auth-field">
          <label className="auth-label" style={{ justifyContent: 'center' }}>
            Verification Code
          </label>
          <OtpInput length={6} value={otp} onChange={setOtp} />
        </div>

        <button type="submit" className="auth-btn" disabled={loading || otp.length < 6}>
          {loading ? <span className="spinner" /> : 'Verify Code'}
        </button>
      </form>

      <div className="auth-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        {resendTimer > 0 ? (
          <span style={{ fontSize: '13px', color: '#64748B' }}>
            Resend code in <strong style={{ color: '#0F172A' }}>{resendTimer}s</strong>
          </span>
        ) : (
          <button
            type="button"
            className="auth-link"
            onClick={handleResend}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Resend Code
          </button>
        )}

        <Link to="/dashboard/login/staff" className="auth-link" style={{ marginTop: '4px' }}>
          ← Back to Staff Login
        </Link>
      </div>
    </AuthLayout>
  );
}
