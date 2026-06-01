import React, { createContext, useContext, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { HeartPulse, LogOut, Stethoscope, UserRound } from 'lucide-react';
import Home from './pages/Home';
import PredictPatient from './pages/PredictPatient';
import Results from './pages/Results';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Login from './pages/Login';

/* ──────────── Auth Context ──────────── */
export type Role = 'doctor' | 'patient';

export interface UserData {
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: UserData | null;
  login: (email: string, password: string, role: Role) => boolean;
  signup: (name: string, email: string, password: string, role: Role) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(() => {
    const saved = localStorage.getItem('lungcare_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((email: string, _password: string, role: Role) => {
    if (!email.trim()) return false;
    const u: UserData = { name: email.split('@')[0], email, role };
    setUser(u);
    localStorage.setItem('lungcare_user', JSON.stringify(u));
    return true;
  }, []);

  const signup = useCallback((name: string, email: string, _password: string, role: Role) => {
    if (!email.trim() || !name.trim()) return false;
    const u: UserData = { name, email, role };
    setUser(u);
    localStorage.setItem('lungcare_user', JSON.stringify(u));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('lungcare_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ──────────── Protected Route ──────────── */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/* ──────────── NavLink ──────────── */
const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={isActive ? 'active' : ''}>
      {children}
    </Link>
  );
};

/* ──────────── Role Badge ──────────── */
const roleMeta: Record<Role, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  doctor: {
    label: 'Doctor',
    icon: <Stethoscope size={12} />,
    color: 'var(--teal)',
    bg: 'rgba(0,201,177,0.1)',
    border: 'rgba(0,201,177,0.25)',
  },
  patient: {
    label: 'Patient',
    icon: <UserRound size={12} />,
    color: 'var(--blue)',
    bg: 'rgba(79,142,247,0.1)',
    border: 'rgba(79,142,247,0.25)',
  },
};

/* ──────────── NavBar ──────────── */
const NavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (location.pathname === '/login') return null;
  if (!user) return null;

  const rm = roleMeta[user.role];

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon"><HeartPulse size={18} /></span>
        LungCare AI
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div className="navbar-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/predict">Predict</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginLeft: 16, paddingLeft: 16,
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Role badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 6,
            background: rm.bg, border: `1px solid ${rm.border}`,
            color: rm.color, fontSize: '0.72rem', fontWeight: 700,
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}>
            {rm.icon} {rm.label}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {user.name}
          </span>
          <button
            onClick={logout}
            style={{
              background: 'rgba(255,107,107,0.1)',
              border: '1px solid rgba(255,107,107,0.2)',
              color: 'var(--coral)',
              padding: '6px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.78rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
};

/* ──────────── App Content ──────────── */
const AppContent: React.FC = () => (
  <>
    <NavBar />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/predict" element={<ProtectedRoute><PredictPatient /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
    </Routes>
  </>
);

const App: React.FC = () => (
  <Router>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </Router>
);

export default App;