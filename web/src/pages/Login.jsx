import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Field } from '../components/ui.jsx';

const DEMO_ACCOUNTS = [
  { label: 'Farmer', email: 'ama.mensah@agriconnect.gh' },
  { label: 'Processor', email: 'purchasing@goldenharvest.gh' },
  { label: 'Exporter', email: 'sourcing@atlanticcocoa.gh' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const useDemo = (email) => setForm({ email, password: 'AgriConnect123' });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    try {
      await login(form);
      const next = location.state?.from ?? '/dashboard';
      navigate(next, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrors(err.fieldErrors());
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <span className="hero-eyebrow">Welcome back</span>
        <h2>Pick up where the harvest left off.</h2>
        <ul>
          <li>See buyer demand matched to your crops</li>
          <li>Respond to sourcing requests in seconds</li>
          <li>Track every inquiry from pending to completed</li>
        </ul>
        <div className="demo-creds" style={{ background: 'rgba(255,255,255,0.1)', color: '#d1fae5' }}>
          <strong style={{ display: 'block', marginBottom: '0.35rem' }}>Demo accounts</strong>
          Password for all: <code style={{ background: 'rgba(255,255,255,0.16)' }}>AgriConnect123</code>
        </div>
      </aside>

      <div className="auth-main">
        <div className="auth-card">
          <h1 style={{ fontSize: '1.75rem' }}>Sign in to AgriConnect</h1>
          <p className="muted small mt-1">Use your email and password, or try a demo account.</p>

          <form className="stack mt-3" onSubmit={submit} noValidate>
            <Alert tone="error">{error}</Alert>

            <Field label="Email address" htmlFor="email" error={errors.email}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                aria-invalid={Boolean(errors.email)}
                required
              />
            </Field>

            <Field label="Password" htmlFor="password" error={errors.password}>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={update('password')}
                aria-invalid={Boolean(errors.password)}
                required
              />
            </Field>

            <button type="submit" className="btn lg block" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="demo-creds mt-3">
            <strong style={{ display: 'block', marginBottom: '0.4rem' }}>Try a demo account</strong>
            <div className="row wrap">
              {DEMO_ACCOUNTS.map((account) => (
                <button key={account.email} type="button" onClick={() => useDemo(account.email)}>
                  {account.label}
                </button>
              ))}
            </div>
            <p className="tiny muted mt-1" style={{ marginTop: '0.45rem' }}>
              Fills the form with that account — no signup needed.
            </p>
          </div>

          <p className="small muted mt-3">
            New here? <Link to="/register" style={{ color: 'var(--green-800)', fontWeight: 600 }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
