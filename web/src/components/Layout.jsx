import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { ROLE_LABELS } from '../format.js';

const NAV = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/demand', label: 'Buyer demand' },
];

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="AgriConnect home">
      <span className="brand-mark" aria-hidden="true">🌾</span>
      <span>AgriConnect</span>
    </Link>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.full_name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <header className="site-header">
      <div className="container inner">
        <Brand />
        <nav className="nav-links" aria-label="Main">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
          ))}
          {user && <NavLink to="/dashboard">Dashboard</NavLink>}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <Link to="/dashboard" className="row" style={{ gap: '0.5rem' }}>
                <span className="avatar" aria-hidden="true">{initials || '🌱'}</span>
                <span className="small hidden-sm" style={{ lineHeight: 1.15 }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem' }}>{user.full_name}</strong>
                  <span className="tiny muted">{ROLE_LABELS[user.role]}</span>
                </span>
              </Link>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => { logout(); navigate('/'); }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn ghost sm">Sign in</Link>
              <Link to="/register" className="btn sm">Join AgriConnect</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <span>© {new Date().getFullYear()} AgriConnect · Built for Ghanaian agribusiness</span>
        <span className="row" style={{ gap: '1rem' }}>
          <Link to="/marketplace">Marketplace</Link>
          <Link to="/demand">Buyer demand</Link>
          <Link to="/register">Create account</Link>
        </span>
      </div>
    </footer>
  );
}

export default function Layout() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
