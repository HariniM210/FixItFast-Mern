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
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Labour Login</h2>
      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
      <form onSubmit={submit}>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required style={{ width:'100%', padding:10 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{ width:'100%', padding:10 }} />
        </div>
        <button type="submit" disabled={loading} style={{ padding:'10px 14px' }}>{loading?'Logging in...':'Login'}</button>
      </form>
    </div>
  );
};

export default LabourLogin;
