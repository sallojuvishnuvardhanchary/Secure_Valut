import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, ArrowRight, RefreshCw, ArrowLeft, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ThemeToggle from '../components/ThemeToggle';

export default function VerifyOtp() {
  const { verifyLoginOtp, verifyRegisterOtp, resendOtp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // Retrieve state passed from Login or Register page
  const initialEmail = location.state?.email || '';
  const purpose = location.state?.purpose || 'login'; // 'login' or 'register'

  const [email] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef([]);

  // Redirect to login if user arrived with no email state
  useEffect(() => {
    if (!initialEmail) {
      navigate('/login', { replace: true });
    }
  }, [initialEmail, navigate]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // 60-second cooldown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle single digit input and auto-advance
  const handleDigitChange = (index, value) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/[^0-9]/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal.slice(-1); // Take last entered digit
    setOtpDigits(newDigits);
    if (error) setError('');

    // Auto-advance to next input
    if (cleanVal && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle full 6-digit paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (pastedData.length >= 6) {
      const digits = pastedData.slice(0, 6).split('');
      setOtpDigits(digits);
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
      if (error) setError('');
    }
  };

  const currentOtp = otpDigits.join('');

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (currentOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (purpose === 'register') {
        await verifyRegisterOtp(email, currentOtp);
        toast.success('Account successfully verified! Welcome to SecureVault.');
        navigate('/', { replace: true });
      } else {
        await verifyLoginOtp(email, currentOtp);
        toast.success('Identity verified. Welcome back to SecureVault!');
        navigate('/', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'OTP verification failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setError('');
    try {
      const res = await resendOtp(email, purpose);
      setCountdown(res.cooldownSeconds || 60);
      setSuccessMsg('A fresh verification code has been dispatched to your Gmail address.');
      toast.success('New OTP sent to your Gmail inbox.');
      setOtpDigits(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend OTP.';
      setError(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  const isRegister = purpose === 'register';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-page)',
        padding: '1.5rem',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
        <ThemeToggle />
      </div>

      <div
        className="vault-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: '16px',
        }}
      >
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-text)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(79, 70, 229, 0.3)',
              marginBottom: '1rem',
            }}
          >
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {isRegister ? 'Verify Registration' : 'Email OTP Verification'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Enter the 6-digit verification code sent to your email
          </p>

          {/* Email badge */}
          <div
            style={{
              marginTop: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            <Mail size={14} color="var(--accent)" />
            <span>{email}</span>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              border: '1px solid var(--success)',
              borderRadius: '8px',
              fontSize: '0.825rem',
              marginBottom: '1.25rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              border: '1px solid var(--danger)',
              borderRadius: '8px',
              fontSize: '0.825rem',
              marginBottom: '1.25rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.75rem',
                textAlign: 'center',
              }}
            >
              Enter 6-Digit Verification Code
            </label>

            {/* 6 Digit Input Boxes */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className="form-input mono-font"
                  style={{
                    width: '48px',
                    height: '56px',
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    padding: 0,
                    borderRadius: '10px',
                    backgroundColor: 'var(--input-bg)',
                    borderColor: digit ? 'var(--accent)' : 'var(--input-border)',
                  }}
                  autoComplete="one-time-code"
                />
              ))}
            </div>
          </div>

          {/* Expiration Note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: '0.775rem',
              color: 'var(--text-muted)',
              marginBottom: '1.5rem',
            }}
          >
            <Clock size={13} />
            <span>Code expires in 5 minutes (max 5 attempts)</span>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            disabled={loading || currentOtp.length !== 6}
          >
            {loading ? 'Verifying OTP...' : isRegister ? 'Verify & Activate Account' : 'Verify & Unlock Vault'}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        {/* Resend OTP Section */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>Didn't receive code?</span>

          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            className="btn btn-ghost"
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: countdown > 0 ? 'var(--text-muted)' : 'var(--accent)',
            }}
          >
            <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
          </button>
        </div>

        {/* Return to Login link */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
