import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_ROUTES = {
  ADMIN: '/admin/dashboard',
  COUNSELLOR: '/counsellor/dashboard',
  TRAINER: '/trainer/dashboard',
  STUDENT: '/student/dashboard',
};

const DEMO_ACCOUNTS = [
  { role: 'ADMIN', label: 'Admin', email: 'admin@admitpro.com', password: 'Admin@123' },
  { role: 'COUNSELLOR', label: 'Counsellor', email: 'priya@admitpro.com', password: 'Admin@123' },
  { role: 'TRAINER', label: 'Trainer', email: 'karan@admitpro.com', password: 'Admin@123' },
  { role: 'STUDENT', label: 'Student', email: 'sneha@admitpro.com', password: 'Admin@123' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      const route = ROLE_ROUTES[user.role];
      if (route) {
        navigate(route, { replace: true });
      } else {
        setError('Unknown role: ' + user.role);
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.response?.status === 0 || !err.response) {
        setError('Cannot connect to server. Make sure the backend is running on port 8080.');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7f6f3',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: '#2563eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 24, fontWeight: 700,
            margin: '0 auto 12px',
          }}>
            <i className="bi bi-mortarboard-fill" style={{ fontSize: 28 }}></i>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1918', margin: 0 }}>EduAdmit</h1>
          <p style={{ color: '#6b6a66', fontSize: 13, marginTop: 4 }}>
            Student Admission Management System
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: '#fff',
          border: '1px solid #e3e1da',
          borderRadius: 12,
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
          marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#1a1918' }}>
            Sign in to your account
          </h2>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px',
              color: '#dc2626', fontSize: 13, marginBottom: 16,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span style={{ flexShrink: 0 }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 5, color: '#1a1918' }}>
                Email <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%', padding: '8px 12px',
                  border: '1px solid #e3e1da', borderRadius: 8,
                  fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box',
                  color: '#1a1918', background: '#fff',
                }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e3e1da'}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 5, color: '#1a1918' }}>
                Password <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%', padding: '8px 12px',
                  border: '1px solid #e3e1da', borderRadius: 8,
                  fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box',
                  color: '#1a1918', background: '#fff',
                }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e3e1da'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '10px',
                background: loading ? '#93c5fd' : '#2563eb',
                color: '#fff', border: 'none',
                borderRadius: 8, fontSize: 14,
                fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'background .15s',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div style={{
          background: '#fff',
          border: '1px solid #e3e1da',
          borderRadius: 12,
          padding: '16px 20px',
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#6b6a66', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>
            Demo Accounts — click to fill
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.role}
                onClick={() => fillDemo(acc)}
                style={{
                  padding: '8px 12px',
                  background: '#f1f0ec',
                  border: '1px solid #e3e1da',
                  borderRadius: 7, fontSize: 12,
                  fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: '#1a1918',
                  transition: 'background .12s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.target.style.background = '#e3e1da'}
                onMouseLeave={e => e.target.style.background = '#f1f0ec'}
              >
                <div style={{ fontWeight: 600 }}>{acc.label}</div>
                <div style={{ fontSize: 10, color: '#6b6a66', marginTop: 2 }}>{acc.email}</div>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#9c9a94', marginTop: 10, textAlign: 'center' }}>
            Password for all: <code style={{ fontFamily: 'monospace', background: '#f1f0ec', padding: '1px 5px', borderRadius: 4 }}>Admin@123</code>
          </p>
        </div>

      </div>
    </div>
  );
}
