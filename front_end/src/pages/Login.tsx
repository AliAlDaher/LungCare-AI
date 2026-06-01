import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../App';
import type { Role } from '../App';
import { HeartPulse, Mail, Lock, User, ArrowRight, Eye, EyeOff, Stethoscope, UserRound } from 'lucide-react';

const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<Role>('doctor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, signup, user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const success = mode === 'login'
        ? login(email, password, role)
        : signup(name, email, password, role);

      if (success) {
        navigate('/', { replace: true });
      } else {
        setError('Authentication failed. Please try again.');
      }
      setLoading(false);
    }, 600);
  };

  const roles: { value: Role; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'doctor', label: 'Doctor', icon: <Stethoscope size={20} />, desc: 'Full clinical access with report export' },
    { value: 'patient', label: 'Patient', icon: <UserRound size={20} />, desc: 'View predictions and explanations' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(ellipse at 30% 20%, rgba(0,201,177,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(79,142,247,0.05) 0%, transparent 50%), var(--bg-primary)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        animation: 'fadeInUp 0.5s ease forwards',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64, height: 64,
            borderRadius: 18,
            background: 'linear-gradient(135deg, var(--teal), var(--blue))',
            marginBottom: 20,
            boxShadow: '0 8px 32px -8px rgba(0,201,177,0.3)',
          }}>
            <HeartPulse size={30} color="#fff" />
          </div>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 900,
            letterSpacing: -0.8,
            marginBottom: 6,
            background: 'linear-gradient(135deg, #fff 40%, var(--teal))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            LungCare AI
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 16px 64px -16px rgba(0,0,0,0.5)',
        }}>
          {/* Tab switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10,
            padding: 3,
            marginBottom: 24,
          }}>
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 8,
                  border: 'none',
                  background: mode === m ? 'rgba(0,201,177,0.12)' : 'transparent',
                  color: mode === m ? 'var(--teal)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Role selector */}
          <div style={{ marginBottom: 22 }}>
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>I am a</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {roles.map(r => {
                const selected = role === r.value;
                const accentColor = r.value === 'doctor' ? 'var(--teal)' : 'var(--blue)';
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      padding: '16px 12px',
                      borderRadius: 12,
                      border: `1.5px solid ${selected ? accentColor : 'var(--border-card)'}`,
                      background: selected ? `${accentColor}10` : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.25s',
                    }}
                  >
                    <span style={{
                      color: selected ? accentColor : 'var(--text-muted)',
                      transition: 'color 0.2s',
                    }}>
                      {r.icon}
                    </span>
                    <span style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      transition: 'color 0.2s',
                    }}>
                      {r.label}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.3,
                      textAlign: 'center',
                    }}>
                      {r.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name (signup only) */}
            {mode === 'signup' && (
              <div className="form-group" style={{ animation: 'fadeInUp 0.3s ease forwards' }}>
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    type="text"
                    placeholder={role === 'doctor' ? 'Dr. John Smith' : 'John Smith'}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  type="email"
                  placeholder={role === 'doctor' ? 'doctor@hospital.com' : 'patient@email.com'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    padding: 2,
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(255,107,107,0.1)',
                border: '1px solid rgba(255,107,107,0.2)',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: '0.8rem',
                color: 'var(--coral)',
                fontWeight: 600,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 16, height: 16,
                    border: '2.5px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }} />
                  {mode === 'login' ? 'Signing In…' : 'Creating Account…'}
                </span>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
        }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            style={{
              background: 'none', border: 'none',
              color: 'var(--teal)', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              fontSize: '0.78rem',
            }}
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default Login;
