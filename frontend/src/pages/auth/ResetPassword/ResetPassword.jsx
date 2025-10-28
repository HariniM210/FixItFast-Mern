import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../../../services/api';

const useQuery = () => new URLSearchParams(useLocation().search);

const strongPwd = (v) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(v);

const ResetPassword = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const token = useMemo(() => query.get('token') || '', [query]);
  const [status, setStatus] = useState('verifying'); // verifying | ready | invalid
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('invalid');
        return;
      }
      try {
        await authAPI.verifyResetToken(token);
        setStatus('ready');
      } catch (_) {
        // Even if backend doesn't provide verification endpoint, allow proceeding to submission
        setStatus('ready');
      }
    };
    verify();
  }, [token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!strongPwd(password)) {
      setError('Password must be 8+ chars with upper, lower, number and special character.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password });
      setDone(true);
      setTimeout(() => navigate('/signin'), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Reset failed. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        {status === 'verifying' && (
          <div style={{ textAlign: 'center', color: '#64748b' }}>Verifying reset link...</div>
        )}

        {status !== 'verifying' && (
          <>
            <h2 style={styles.title}>Reset your password</h2>
            <p style={styles.subtitle}>Choose a strong password you don’t use elsewhere.</p>

            {done ? (
              <div style={styles.success}>Your password has been reset successfully. You can now log in.</div>
            ) : (
              <form onSubmit={onSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={styles.label}>New password</label>
                  <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" style={styles.input} disabled={loading || status==='invalid'} required />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={styles.label}>Confirm new password</label>
                  <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} placeholder="••••••••" style={styles.input} disabled={loading || status==='invalid'} required />
                </div>
                <ul style={styles.hints}>
                  <li>Minimum 8 characters</li>
                  <li>At least one uppercase, one lowercase, one number, and one special character</li>
                </ul>
                {error && <div style={styles.error}>{error}</div>}
                <button type="submit" disabled={loading || status==='invalid'} style={styles.button}>
                  {loading ? 'Updating...' : 'Update password'}
                </button>
                <div style={{ textAlign: 'center' }}>
                  <Link to="/signin" style={styles.link}>Back to Sign in</Link>
                </div>
              </form>
            )}

            {status === 'invalid' && (
              <div style={styles.infoBox}>
                This reset link is invalid or expired. Please request a new one from the Forgot Password page.
                <div style={{ marginTop: 12 }}>
                  <Link to="/forgot-password" style={styles.link}>Request new reset link</Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)' },
  card: { width: '100%', maxWidth: 480, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' },
  title: { margin: 0, marginBottom: 8, fontSize: 22, color: '#111827' },
  subtitle: { margin: 0, marginBottom: 16, color: '#6b7280' },
  label: { display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' },
  input: { width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 },
  button: { width: '100%', padding: '12px 14px', marginTop: 8, background: '#6366f1', color: '#fff', border: 0, borderRadius: 10, fontWeight: 600, cursor: 'pointer' },
  link: { color: '#6366f1', textDecoration: 'none', fontWeight: 600 },
  infoBox: { background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', padding: 16, borderRadius: 8, textAlign: 'center', marginTop: 12 },
  success: { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: 12, borderRadius: 8, textAlign: 'center', marginBottom: 12 },
  error: { color: '#dc2626', fontSize: 13, marginTop: 6 },
  hints: { color: '#6b7280', fontSize: 13, margin: '8px 0 12px 18px' }
};

export default ResetPassword;
