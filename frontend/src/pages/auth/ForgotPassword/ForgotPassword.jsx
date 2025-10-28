import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      // Privacy-preserving: always show the same result
      await authAPI.requestPasswordReset(email).catch(() => {});
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h2 style={styles.title}>Forgot your password?</h2>
        <p style={styles.subtitle}>
          Enter your email address and well send you a link to reset your password.
        </p>

        {submitted ? (
          <div style={styles.infoBox}>
            If an account exists with this email, youll receive a password reset link shortly.
            <div style={{ marginTop: 16 }}>
              <Link to="/signin" style={styles.link}>Back to Sign in</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={styles.input}
                disabled={loading}
                required
              />
              {error && <div style={styles.error}>{error}</div>}
            </div>
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <Link to="/signin" style={styles.link}>Back to Sign in</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)' },
  card: { width: '100%', maxWidth: 480, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' },
  title: { margin: 0, marginBottom: 8, fontSize: 22, color: '#111827' },
  subtitle: { margin: 0, marginBottom: 20, color: '#6b7280' },
  label: { display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' },
  input: { width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 },
  button: { width: '100%', padding: '12px 14px', marginTop: 8, background: '#6366f1', color: '#fff', border: 0, borderRadius: 10, fontWeight: 600, cursor: 'pointer' },
  link: { color: '#6366f1', textDecoration: 'none', fontWeight: 600 },
  infoBox: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: 16, borderRadius: 8, textAlign: 'center' },
  error: { color: '#dc2626', fontSize: 13, marginTop: 6 }
};

export default ForgotPassword;
