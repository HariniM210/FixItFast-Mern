import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { labourAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const safeJoinUrl = (base, path) => {
  const b = (base || '').toString();
  const p = (path || '').toString();
  const cleanedBase = b.endsWith('/') ? b.slice(0, -1) : b;
  const cleanedPath = p.startsWith('/') ? p : `/${p}`;
  return `${cleanedBase}${cleanedPath}`;
};

const LabourLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { authenticate } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const base = (API && API.defaults && API.defaults.baseURL) ? String(API.defaults.baseURL) : '';
      const url = base ? safeJoinUrl(base, '/labour/login') : '/api/labour/login';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: (email || '').trim().toLowerCase(), password: password || '' })
      });
      if (!res.ok) {
        const data = await res.json().catch(()=>({ message: 'Login failed' }));
        throw new Error(data.message || 'Login failed');
      }
      const data = await res.json();
      const token = data?.token;
      const user = data?.user || {};

      if (!token || !user?.email || !user?.name) {
        throw new Error('Invalid response from server. Please try again.');
      }

      // Ensure city is present – fallback to profile if missing
      let ensuredUser = { ...user };
      if (!ensuredUser.city) {
        try {
          const profile = await labourAPI.getProfile();
          const profileCity = profile?.data?.labour?.location?.city || '';
          if (profileCity) ensuredUser.city = profileCity;
        } catch (_) {}
      }

      // Persist in both generic and labour-specific keys for consistency
      authenticate(token, ensuredUser);
      try {
        localStorage.setItem('labourToken', token);
        localStorage.setItem('labourUser', JSON.stringify(ensuredUser));
      } catch (_) {}

      const nextPath = (typeof data?.redirect === 'string' && data.redirect.trim()) ? data.redirect : '/labour/dashboard';
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          background: 'var(--background-white, #ffffff)',
          color: 'var(--text-color, #374151)',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'var(--primary-color, #3b82f6)';
          e.target.style.color = '#ffffff';
          e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
          e.target.style.transform = 'translateX(-2px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'var(--background-white, #ffffff)';
          e.target.style.color = 'var(--text-color, #374151)';
          e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
          e.target.style.transform = 'translateX(0)';
        }}
        title="Go back to home page"
      >
        <span style={{ fontSize: '16px' }}>←</span>
        <span>Back to Home</span>
      </button>

      {/* Login Card Container */}
      <div style={{ maxWidth: 420, width: '100%', marginTop: '-40px' }}>
        <h2 style={{ marginBottom: '24px', textAlign: 'center', color: 'var(--text-color, #1f2937)' }}>Labour Login</h2>
        {error && <div style={{ color: '#b91c1c', marginBottom: 12, padding: '12px', borderRadius: '6px', background: '#fee2e2', border: '1px solid #fecaca' }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text-color, #374151)' }}>Email</label>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required style={{ width:'100%', padding:'10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', color: 'var(--text-color, #000)' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text-color, #374151)' }}>Password</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{ width:'100%', padding:'10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', color: 'var(--text-color, #000)' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding:'12px 14px', borderRadius: '6px', border: 'none', background: 'var(--primary-color, #3b82f6)', color: '#ffffff', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.3s ease' }} onMouseEnter={(e) => !loading && (e.target.style.opacity = '0.9')} onMouseLeave={(e) => !loading && (e.target.style.opacity = '1')}>{loading?'Logging in...':'Login'}</button>
        </form>
      </div>
    </div>
  );
};

export default LabourLogin;
