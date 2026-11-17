import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ApiError, api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Badge, Empty, Field, Modal, RoleBadge, Spinner, StatusBadge } from '../components/ui.jsx';
import { cropLabel, date, kg, money, timeAgo } from '../format.js';

function RequestCard({ request }) {
  const perKgGap = request.max_price_per_kg;
  return (
    <article className="card hoverable listing-card">
      <div className="listing-head">
        <div>
          <div className="row" style={{ gap: '0.45rem' }}>
            <h3 className="listing-title">{cropLabel(request.crop)}</h3>
            <Badge tone="amber">Grade {request.grade}</Badge>
            <StatusBadge status={request.status} />
          </div>
          <p className="tiny muted mt-1">
            {request.buyer_organisation || request.buyer_name} · {request.region || 'Any region'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="listing-price">≤ {money(perKgGap)}</div>
          <span className="tiny muted">per kg</span>
        </div>
      </div>

      <div className="meta-list">
        <span>📦 Needs {kg(request.quantity_kg, { tonnes: true })}</span>
        <span>🗓️ By {date(request.needed_by)}</span>
        <span>🧾 {money(request.quantity_kg * request.max_price_per_kg, { compact: true })} budget</span>
      </div>

      {request.notes && (
        <p className="small muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {request.notes}
        </p>
      )}

      <div className="card-foot">
        <RoleBadge role={request.buyer_role} />
        <Link to={`/demand/${request.id}`} className="btn soft sm">View & respond</Link>
      </div>
    </article>
  );
}

export default function Demand() {
  const { meta, user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState({ loading: true, data: [], meta: null, error: '' });

  const filters = useMemo(() => ({
    crop: params.get('crop') ?? '',
    region: params.get('region') ?? '',
    search: params.get('search') ?? '',
    page: params.get('page') ?? '1',
  }), [params]);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    api
      .requests(filters)
      .then((res) => { if (!cancelled) setState({ loading: false, data: res.data, meta: res.meta, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ loading: false, data: [], meta: null, error: err.message }); });
    return () => { cancelled = true; };
  }, [filters]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">Buyer demand</span>
            <h1 style={{ fontSize: '2rem' }} className="mt-1">What processors and exporters want</h1>
            <p>Open sourcing requests with target prices in cedis per kilogram.</p>
          </div>
          {user?.role === 'farmer' ? (
            <Link to="/marketplace" className="btn ghost">Browse supply instead</Link>
          ) : (
            <Link to="/dashboard?tab=requests" className="btn">+ Post a sourcing request</Link>
          )}
        </div>

        <div className="card tight" style={{ marginBottom: '1.5rem' }}>
          <div className="filters" style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}>
            <div className="field search-field">
              <label htmlFor="search">Search</label>
              <input
                id="search"
                type="search"
                placeholder="Buyer, notes…"
                defaultValue={filters.search}
                onKeyDown={(e) => { if (e.key === 'Enter') setFilter('search', e.currentTarget.value); }}
                onBlur={(e) => setFilter('search', e.currentTarget.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="crop">Crop</label>
              <select id="crop" value={filters.crop} onChange={(e) => setFilter('crop', e.target.value)}>
                <option value="">All crops</option>
                {(meta?.crops ?? []).map((crop) => (
                  <option key={crop.slug} value={crop.slug}>{crop.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="region">Region</label>
              <select id="region" value={filters.region} onChange={(e) => setFilter('region', e.target.value)}>
                <option value="">All regions</option>
                {(meta?.region_names ?? []).map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <button type="button" className="btn ghost" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
              Reset
            </button>
          </div>
        </div>

        <Alert tone="error">{state.error}</Alert>

        {state.loading ? (
          <Spinner label="Loading demand…" />
        ) : state.data.length === 0 ? (
          <Empty icon="📋" title="No open requests right now">
            Check back soon — buyers post new sourcing needs as seasons approach.
          </Empty>
        ) : (
          <>
            <div className="between" style={{ marginBottom: '0.85rem' }}>
              <span className="small muted">{state.meta?.total} open request{state.meta?.total === 1 ? '' : 's'}</span>
              <span className="small muted">Page {state.meta?.page} of {state.meta?.pages}</span>
            </div>
            <div className="grid three">
              {state.data.map((request) => <RequestCard key={request.id} request={request} />)}
            </div>
            {state.meta && state.meta.pages > 1 && (
              <div className="pagination">
                <button className="btn ghost sm" disabled={state.meta.page <= 1} onClick={() => setFilter('page', String(state.meta.page - 1))}>← Previous</button>
                <span>{state.meta.page} / {state.meta.pages}</span>
                <button className="btn ghost sm" disabled={state.meta.page >= state.meta.pages} onClick={() => setFilter('page', String(state.meta.page + 1))}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function DemandDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [state, setState] = useState({ loading: true, request: null, matches: [], error: '' });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ quantity_kg: '', offer_price_per_kg: '', message: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .demandRequest(id)
      .then((res) => {
        if (cancelled) return;
        setState({ loading: false, request: res.data, matches: res.matches ?? [], error: '' });
        setForm((f) => ({
          ...f,
          quantity_kg: String(Math.min(res.data.quantity_kg, 100000)),
          offer_price_per_kg: String(res.data.max_price_per_kg),
        }));
      })
      .catch((err) => { if (!cancelled) setState({ loading: false, request: null, matches: [], error: err.message }); });
    return () => { cancelled = true; };
  }, [id]);

  const { request, matches } = state;
  const isOwner = request && user?.id === request.buyer_id;
  const canRespond = user?.role === 'farmer' && request && !isOwner && ['open', 'in_progress'].includes(request.status);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFormError('');
    setErrors({});
    try {
      await api.createInquiry({
        request_id: Number(id),
        quantity_kg: Number(form.quantity_kg),
        offer_price_per_kg: Number(form.offer_price_per_kg),
        message: form.message || null,
      });
      setSent(true);
      setOpen(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.details ? 'Please check the highlighted fields.' : err.message);
        setErrors(err.fieldErrors());
      } else {
        setFormError('Could not respond to this request.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (state.loading) return <div className="page"><div className="container"><Spinner label="Loading request…" /></div></div>;
  if (state.error || !request) {
    return (
      <div className="page"><div className="container">
        <Alert tone="error">{state.error || 'Request not found'}</Alert>
        <Link to="/demand" className="btn ghost mt-2">← Back to buyer demand</Link>
      </div></div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <Link to="/demand" className="small muted">← Back to buyer demand</Link>

        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '1.5rem', marginTop: '1rem' }}>
          <div className="stack">
            <div className="card">
              <div className="between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className="row" style={{ gap: '0.5rem' }}>
                    <h1 style={{ fontSize: '1.85rem' }}>{cropLabel(request.crop)}</h1>
                    <Badge tone="amber">Grade {request.grade}</Badge>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="muted small mt-1">
                    {request.buyer_organisation || request.buyer_name} · {request.region || 'Any region'} · posted {timeAgo(request.created_at)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="listing-price" style={{ fontSize: '1.4rem' }}>≤ {money(request.max_price_per_kg)}</div>
                  <span className="tiny muted">per kg</span>
                </div>
              </div>

              <div className="grid four mt-3">
                <div><span className="stat-label">Volume needed</span><div className="stat-value" style={{ fontSize: '1.15rem' }}>{kg(request.quantity_kg, { tonnes: true })}</div></div>
                <div><span className="stat-label">Budget cap</span><div className="stat-value" style={{ fontSize: '1.15rem' }}>{money(request.quantity_kg * request.max_price_per_kg, { compact: true })}</div></div>
                <div><span className="stat-label">Needed by</span><div className="stat-value" style={{ fontSize: '1.15rem' }}>{date(request.needed_by)}</div></div>
                <div><span className="stat-label">Buyer type</span><div style={{ marginTop: '0.3rem' }}><RoleBadge role={request.buyer_role} /></div></div>
              </div>

              {request.notes && (
                <>
                  <h3 className="mt-3">Requirements</h3>
                  <p className="small muted mt-1" style={{ whiteSpace: 'pre-line' }}>{request.notes}</p>
                </>
              )}
            </div>

            <div className="card">
              <div className="between">
                <h3>Farmer supply that fits</h3>
                <span className="tiny muted">Ranked by fit</span>
              </div>
              {matches.length === 0 ? (
                <p className="small muted mt-2">No active listings match this request yet.</p>
              ) : (
                <div className="table-wrap mt-2">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Farmer</th>
                        <th>Volume</th>
                        <th>Price</th>
                        <th>Region</th>
                        <th>Fit</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map(({ listing, score }) => (
                        <tr key={listing.id}>
                          <td>
                            <strong>{listing.farmer_organisation || listing.farmer_name}</strong>
                            <div className="tiny muted">Grade {listing.grade}</div>
                          </td>
                          <td>{kg(listing.quantity_kg, { tonnes: true })}</td>
                          <td>{money(listing.price_per_kg)}</td>
                          <td>{listing.town || listing.region}</td>
                          <td><Badge tone={score >= 70 ? 'green' : 'amber'}>{score}</Badge></td>
                          <td><Link to={`/listings/${listing.id}`} className="btn ghost sm">Open</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <aside className="stack">
            <div className="card">
              <h3>Respond to this buyer</h3>
              <p className="small muted mt-1">
                Offer the volume you can deliver and the price you need per kilogram.
              </p>
              <Alert tone="success">{sent && 'Response sent — the buyer can now review it.'}</Alert>
              <Alert tone="error">{formError && !open ? formError : ''}</Alert>

              {!user && (
                <div className="stack mt-2">
                  <Link to="/login" className="btn block">Sign in to respond</Link>
                  <Link to="/register" className="btn ghost block">Register as a farmer</Link>
                </div>
              )}
              {user && isOwner && (
                <p className="small muted mt-2">
                  This is your request. Review responses in your <Link to="/dashboard" style={{ color: 'var(--green-800)' }}>dashboard</Link>.
                </p>
              )}
              {user && !isOwner && user.role !== 'farmer' && (
                <p className="small muted mt-2">Only farmer accounts can respond to sourcing requests.</p>
              )}
              {canRespond && !sent && (
                <button type="button" className="btn block mt-2" onClick={() => setOpen(true)}>Offer my produce</button>
              )}
            </div>

            <div className="card tight">
              <h3 style={{ fontSize: '1rem' }}>Buyer</h3>
              <div className="row mt-2" style={{ gap: '0.8rem' }}>
                <span className="avatar" style={{ width: 42, height: 42 }}>
                  {request.buyer_name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </span>
                <div>
                  <strong>{request.buyer_name}</strong>
                  <p className="small muted">{request.buyer_organisation || 'Independent buyer'}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {open && (
        <Modal title={`Respond: ${cropLabel(request.crop)}`} onClose={() => setOpen(false)}>
          <form className="stack" onSubmit={submit} noValidate>
            <Alert tone="error">{formError}</Alert>
            <div className="grid two" style={{ gap: '0.75rem' }}>
              <Field label="Quantity (kg)" htmlFor="qty" error={errors.quantity_kg}>
                <input
                  id="qty"
                  type="number"
                  min="1"
                  value={form.quantity_kg}
                  onChange={(e) => setForm((f) => ({ ...f, quantity_kg: e.target.value }))}
                  aria-invalid={Boolean(errors.quantity_kg)}
                  required
                />
              </Field>
              <Field label="Your price (GHS/kg)" htmlFor="price" error={errors.offer_price_per_kg}>
                <input
                  id="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.offer_price_per_kg}
                  onChange={(e) => setForm((f) => ({ ...f, offer_price_per_kg: e.target.value }))}
                  aria-invalid={Boolean(errors.offer_price_per_kg)}
                  required
                />
              </Field>
            </div>
            <Field label="Message" htmlFor="message">
              <textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Where the produce is stored, delivery capability, quality reports…"
              />
            </Field>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send response'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
