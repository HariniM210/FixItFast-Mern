import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './SignIn.css';
import { GoogleLogin } from "@react-oauth/google";

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin } = useAuth(); // ✅ Get googleLogin from context

  // ✅ Handle successful Google OAuth response
  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('✅ Google credential received');
    setGoogleLoading(true);
    setError('');
    
    try {
      const result = await googleLogin(credentialResponse.credential);
      
      if (result?.success) {
        console.log('✅ Google login successful, navigating to dashboard');
        navigate('/dashboard');
      } else {
        setError(result?.error || 'Google authentication failed');
      }
    } catch (err) {
      console.error('❌ Google login error:', err);
      setError('Google authentication failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ✅ Handle Google OAuth errors
  const handleGoogleError = () => {
    console.error('❌ Google Sign In Failed');
    setError('Google authentication was cancelled or failed.');
  };



  const handleBack = () => {
    navigate('/');
  };


  // Traditional login remains identical
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login({ email, password });
      if (result?.success) {
        navigate('/dashboard');
        return;
      }
      setError(result?.error || 'Login failed.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={handleBack} style={styles.backButton}>
        ← Back to Home
      </button>

      <div style={styles.formContainer}>
        <div style={styles.brand}>
          <h1 style={styles.brandText}>FixItFast</h1>
        </div>

        <div style={styles.form}>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Sign in to your account</p>

          {error && (
            <div style={styles.errorBox}>
              <span>⚠️ {error}</span>
            </div>
          )}


          <form onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
                disabled={loading}
              />
              <div style={{ marginTop: '0.5rem' }}>
                <Link to="/forgot-password" style={styles.link}>Forgot Password?</Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              style={{
                ...styles.submitButton,
                opacity: (loading || googleLoading) ? 0.7 : 1,
                cursor: (loading || googleLoading) ? 'not-allowed' : 'pointer'
              }}>
              {loading ? 'Signing In...' : 'SIGN IN'}
            </button>
          </form>

          {/* ✅ Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <span style={styles.dividerText}>OR</span>
            <div style={styles.dividerLine}></div>
          </div>

          {/* ✅ Google OAuth Button */}
          <div style={{ marginBottom: '1.5rem' }}>
            {googleLoading ? (
              <div style={styles.googleLoadingButton}>
                Signing in with Google...
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin 
                  onSuccess={handleGoogleSuccess} 
                  onError={handleGoogleError}
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  theme="outline"
                />
              </div>
            )}
          </div>

          <div style={styles.signupLink}>
            Don't have an account? <Link to="/register" style={styles.link}>Sign up here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '1rem',
    fontFamily: 'Arial, sans-serif'
  },
  backButton: {
    position: 'absolute',
    top: '2rem',
    left: '2rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease'
  },
  formContainer: {
    width: '100%',
    maxWidth: '450px',
    margin: '0 auto'
  },
  brand: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  brandText: {
    color: 'white',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: 0,
    textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '2.5rem',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: '#718096',
    textAlign: 'center',
    marginBottom: '2rem',
    fontSize: '1.1rem'
  },
  errorBox: {
    backgroundColor: '#fed7d7',
    color: '#c53030',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    textAlign: 'center',
    border: '1px solid #feb2b2'
  },
  inputGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    color: '#4a5568',
    fontWeight: '600',
    marginBottom: '0.5rem',
    fontSize: '0.95rem'
  },
  input: {
    width: '100%',
    padding: '1rem',
    fontSize: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box'
  },
  submitButton: {
    width: '100%',
    padding: '1rem',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '2rem',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
  },
  signupLink: {
    textAlign: 'center',
    color: '#718096',
    fontSize: '0.95rem',
    marginTop: '1.5rem'
  },
  link: {
    color: '#667eea',
    fontWeight: '600',
    textDecoration: 'none'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '1.5rem 0',
    gap: '1rem'
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e2e8f0'
  },
  dividerText: {
    color: '#718096',
    fontSize: '0.9rem',
    fontWeight: '500',
    padding: '0 0.5rem'
  },
  googleLoadingButton: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    fontWeight: '500',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    textAlign: 'center',
    cursor: 'not-allowed'
  }
};

export default SignIn;
