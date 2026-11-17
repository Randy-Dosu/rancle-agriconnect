import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Field } from '../components/ui.jsx';

const ROLES = [
  { value: 'farmer', emoji: '🌱', label: 'Farmer' },
  { value: 'processor', emoji: '🏭', label: 'Processor' },
  { value: 'exporter', emoji: '🚢', label: 'Exporter' },
];

export default function Register() {
  const { register, meta } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'farmer',
    region: 'Ashanti',
    organisation: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));
  const regions = meta?.region_names ?? ['Ashanti', 'Greater Accra', 'Northern', 'Western North'];

  const organisationLabel = form.role === 'farmer'
    ? 'Farm or cooperative name'
    : form.role === 'processor' ? 'Company name' : 'Export company name';

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    try {
      await register({
        ...form,
        organisation: form.organisation || null,
        phone: form.phone || null,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.details ? 'Please check the highlighted fields.' : err.message);
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
        <span className="hero-eyebrow">Join the network</span>
        <h2>One account, both sides of the trade.</h2>
        <ul>
          <li><strong>Farmers</strong> — list harvests and answer live demand</li>
          <li><strong>Processors</strong> — source raw material at a known price</li>
          <li><strong>Exporters</strong> — line up volumes before the season</li>
        </ul>
        <p className="small" style={{ color: '#a7f3d0' }}>
          Free to join. Prices always in Ghana cedis (GHS), volumes always in kilograms.
        </p>
      </aside>

      <div className="auth-main">
        <div className="auth-card">
          <h1 style={{ fontSize: '1.75rem' }}>Create your account</h1>
          <p className="muted small mt-1">You can switch role later by contacting support.</p>

          <form className="stack mt-3" onSubmit={submit} noValidate>
            <Alert tone="error">{error}</Alert>

            <div className="field">
              <label id="role-label">I am a…</label>
              <div className="role-picker" role="group" aria-labelledby="role-label">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    className="role-option"
                    aria-pressed={form.role === role.value}
                    onClick={() => setForm((f) => ({ ...f, role: role.value }))}
                  >
                    <span className="emoji" aria-hidden="true">{role.emoji}</span>
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Full name" htmlFor="full_name" error={errors.full_name}>
              <input
                id="full_name"
                value={form.full_name}
                onChange={update('full_name')}
                autoComplete="name"
                aria-invalid={Boolean(errors.full_name)}
                required
              />
            </Field>

            <Field label="Email address" htmlFor="email" error={errors.email}>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={update('email')}
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                required
              />
            </Field>

            <Field
              label="Password"
              htmlFor="password"
              error={errors.password}
              hint="At least 8 characters."
            >
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={update('password')}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                required
              />
            </Field>

            <div className="grid two" style={{ gap: '0.75rem' }}>
              <Field label="Region" htmlFor="region">
                <select id="region" value={form.region} onChange={update('region')}>
                  {regions.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </Field>
              <Field label="Phone (optional)" htmlFor="phone" error={errors.phone}>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="+233 …"
                  autoComplete="tel"
                />
              </Field>
            </div>

            <Field label={organisationLabel} htmlFor="organisation" error={errors.organisation}>
              <input
                id="organisation"
                value={form.organisation}
                onChange={update('organisation')}
                placeholder="e.g. Ejisu Farmers Cooperative"
              />
            </Field>

            <button type="submit" className="btn lg block" disabled={busy}>
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="small muted mt-3">
            Already registered? <Link to="/login" style={{ color: 'var(--green-800)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
