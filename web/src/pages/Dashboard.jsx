import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError, api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Badge, Empty, Field, Modal, RoleBadge, Spinner, StatCard, StatusBadge } from '../components/ui.jsx';
import { cropLabel, date, kg, money, timeAgo } from '../format.js';

/* ------------------------------------------------------------------ */
/* Forms                                                              */
/* ------------------------------------------------------------------ */

function ListingForm({ initial, onDone, onCancel }) {
  const { meta } = useAuth();
  const [form, setForm] = useState({
    crop: initial?.crop ?? 'maize',
    grade: initial?.grade ?? 'A',
    quantity_kg: initial?.quantity_kg ?? '',
    price_per_kg: initial?.price_per_kg ?? '',
    region: initial?.region ?? 'Ashanti',
    town: initial?.town ?? '',
    harvest_date: initial?.harvest_date ?? '',
    available_from: initial?.available_from ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'active',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    const payload = {
      ...form,
      quantity_kg: Number(form.quantity_kg),
      price_per_kg: Number(form.price_per_kg),
      town: form.town || null,
      harvest_date: form.harvest_date || null,
      available_from: form.available_from || null,
      description: form.description || null,
    };
    try {
      if (initial?.id) await api.updateListing(initial.id, payload);
      else await api.createListing(payload);
      onDone();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.details ? 'Please check the highlighted fields.' : err.message);
        setErrors(err.fieldErrors());
      } else setError('Could not save the listing.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <Alert tone="error">{error}</Alert>
      <div className="grid two" style={{ gap: '0.75rem' }}>
        <Field label="Crop" htmlFor="f-crop" error={errors.crop}>
          <select id="f-crop" value={form.crop} onChange={set('crop')}>
            {(meta?.crops ?? []).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Grade" htmlFor="f-grade" error={errors.grade}>
          <select id="f-grade" value={form.grade} onChange={set('grade')}>
            {(meta?.grades ?? ['A', 'B', 'C']).map((g) => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </Field>
        <Field label="Quantity (kg)" htmlFor="f-qty" error={errors.quantity_kg}>
          <input id="f-qty" type="number" min="1" value={form.quantity_kg} onChange={set('quantity_kg')} required />
        </Field>
        <Field label="Price (GHS/kg)" htmlFor="f-price" error={errors.price_per_kg}>
          <input id="f-price" type="number" min="0.01" step="0.01" value={form.price_per_kg} onChange={set('price_per_kg')} required />
        </Field>
        <Field label="Region" htmlFor="f-region" error={errors.region}>
          <select id="f-region" value={form.region} onChange={set('region')}>
            {(meta?.region_names ?? []).map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Town" htmlFor="f-town" error={errors.town}>
          <input id="f-town" value={form.town} onChange={set('town')} placeholder="e.g. Ejisu" />
        </Field>
        <Field label="Harvest date" htmlFor="f-harvest" error={errors.harvest_date}>
          <input id="f-harvest" type="date" value={form.harvest_date} onChange={set('harvest_date')} />
        </Field>
        <Field label="Available from" htmlFor="f-avail" error={errors.available_from}>
          <input id="f-avail" type="date" value={form.available_from} onChange={set('available_from')} />
        </Field>
      </div>
      {initial?.id && (
        <Field label="Status" htmlFor="f-status" error={errors.status}>
          <select id="f-status" value={form.status} onChange={set('status')}>
            <option value="active">Active</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
      )}
      <Field label="Description" htmlFor="f-desc" error={errors.description}>
        <textarea id="f-desc" value={form.description} onChange={set('description')} placeholder="Moisture, storage, bagging, certifications…" />
      </Field>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn" disabled={busy}>{busy ? 'Saving…' : initial?.id ? 'Save changes' : 'Publish listing'}</button>
      </div>
    </form>
  );
}

function RequestForm({ initial, onDone, onCancel }) {
  const { meta } = useAuth();
  const [form, setForm] = useState({
    crop: initial?.crop ?? 'maize',
    grade: initial?.grade ?? 'A',
    quantity_kg: initial?.quantity_kg ?? '',
    max_price_per_kg: initial?.max_price_per_kg ?? '',
    region: initial?.region ?? '',
    needed_by: initial?.needed_by ?? '',
    notes: initial?.notes ?? '',
    status: initial?.status ?? 'open',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    const payload = {
      ...form,
      quantity_kg: Number(form.quantity_kg),
      max_price_per_kg: Number(form.max_price_per_kg),
      region: form.region || null,
      needed_by: form.needed_by || null,
      notes: form.notes || null,
    };
    try {
      if (initial?.id) await api.updateRequest(initial.id, payload);
      else await api.createRequest(payload);
      onDone();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.details ? 'Please check the highlighted fields.' : err.message);
        setErrors(err.fieldErrors());
      } else setError('Could not save the request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <Alert tone="error">{error}</Alert>
      <div className="grid two" style={{ gap: '0.75rem' }}>
        <Field label="Crop" htmlFor="r-crop" error={errors.crop}>
          <select id="r-crop" value={form.crop} onChange={set('crop')}>
            {(meta?.crops ?? []).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Grade required" htmlFor="r-grade" error={errors.grade}>
          <select id="r-grade" value={form.grade} onChange={set('grade')}>
            {(meta?.grades ?? ['A', 'B', 'C']).map((g) => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </Field>
        <Field label="Volume needed (kg)" htmlFor="r-qty" error={errors.quantity_kg}>
          <input id="r-qty" type="number" min="1" value={form.quantity_kg} onChange={set('quantity_kg')} required />
        </Field>
        <Field label="Max price (GHS/kg)" htmlFor="r-price" error={errors.max_price_per_kg}>
          <input id="r-price" type="number" min="0.01" step="0.01" value={form.max_price_per_kg} onChange={set('max_price_per_kg')} required />
        </Field>
        <Field label="Preferred region" htmlFor="r-region" error={errors.region} hint="Leave blank to accept any region.">
          <select id="r-region" value={form.region} onChange={set('region')}>
            <option value="">Any region</option>
            {(meta?.region_names ?? []).map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Needed by" htmlFor="r-needed" error={errors.needed_by}>
          <input id="r-needed" type="date" value={form.needed_by} onChange={set('needed_by')} />
        </Field>
      </div>
      {initial?.id && (
        <Field label="Status" htmlFor="r-status">
          <select id="r-status" value={form.status} onChange={set('status')}>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
      )}
      <Field label="Requirements & notes" htmlFor="r-notes" error={errors.notes}>
        <textarea id="r-notes" value={form.notes} onChange={set('notes')} placeholder="Quality tests, delivery terms, packaging…" />
      </Field>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn" disabled={busy}>{busy ? 'Saving…' : initial?.id ? 'Save changes' : 'Publish request'}</button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Inquiry list                                                       */
/* ------------------------------------------------------------------ */

function InquiryList({ inquiries, role, onUpdate, busyId }) {
  if (inquiries.length === 0) {
    return (
      <Empty icon="💬" title="No inquiries yet">
        {role === 'farmer'
          ? 'When a processor or exporter makes an offer on your produce, it will appear here.'
          : 'Browse the marketplace and make an offer — your inquiries will appear here.'}
      </Empty>
    );
  }

  return (
    <div className="grid two">
      {inquiries.map((inquiry) => {
        const counterpart = role === 'farmer'
          ? { name: inquiry.buyer_name, org: inquiry.buyer_organisation, role: inquiry.buyer_role }
          : { name: inquiry.farmer_name, org: inquiry.farmer_organisation, role: 'farmer' };
        const crop = inquiry.listing_crop || inquiry.request_crop;
        const value = inquiry.quantity_kg * inquiry.offer_price_per_kg;

        return (
          <article className="card inquiry-card" key={inquiry.id}>
            <div className="between" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="row" style={{ gap: '0.4rem' }}>
                  <strong>{crop ? cropLabel(crop) : 'Produce'}</strong>
                  <StatusBadge status={inquiry.status} />
                </div>
                <p className="tiny muted mt-1">
                  with {counterpart.org || counterpart.name} · {timeAgo(inquiry.created_at)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="listing-price">{money(value, { compact: true })}</div>
                <span className="tiny muted">{kg(inquiry.quantity_kg, { tonnes: true })}</span>
              </div>
            </div>

            {inquiry.message && <p className="inquiry-quote">“{inquiry.message}”</p>}

            <div className="meta-list">
              <span>💵 {money(inquiry.offer_price_per_kg)}/kg</span>
              <span>📦 {kg(inquiry.quantity_kg, { tonnes: true })}</span>
              {inquiry.listing_region && <span>📍 {inquiry.listing_region}</span>}
            </div>

            <div className="card-foot">
              <RoleBadge role={counterpart.role} />
              <div className="row" style={{ gap: '0.4rem' }}>
                {role === 'farmer' && inquiry.status === 'pending' && (
                  <>
                    <button
                      className="btn sm"
                      disabled={busyId === inquiry.id}
                      onClick={() => onUpdate(inquiry.id, 'accepted')}
                    >
                      Accept
                    </button>
                    <button
                      className="btn ghost sm"
                      disabled={busyId === inquiry.id}
                      onClick={() => onUpdate(inquiry.id, 'declined')}
                    >
                      Decline
                    </button>
                  </>
                )}
                {role !== 'farmer' && inquiry.status === 'accepted' && (
                  <button
                    className="btn sm"
                    disabled={busyId === inquiry.id}
                    onClick={() => onUpdate(inquiry.id, 'completed')}
                  >
                    Mark completed
                  </button>
                )}
                {inquiry.listing_id && (
                  <Link to={`/listings/${inquiry.listing_id}`} className="btn ghost sm">View lot</Link>
                )}
                {inquiry.request_id && (
                  <Link to={`/demand/${inquiry.request_id}`} className="btn ghost sm">View request</Link>
                )}
              </div>
            </div>

            {(inquiry.buyer_phone || inquiry.farmer_phone) && ['accepted', 'completed'].includes(inquiry.status) && (
              <p className="tiny muted">
                Contact: {role === 'farmer' ? inquiry.buyer_phone || inquiry.buyer_email : inquiry.farmer_phone || inquiry.farmer_email}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                          */
/* ------------------------------------------------------------------ */

const FARMER_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'listings', label: 'My listings' },
  { id: 'matches', label: 'Matched demand' },
  { id: 'inquiries', label: 'Inquiries' },
];

const BUYER_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'requests', label: 'Sourcing requests' },
  { id: 'inquiries', label: 'Inquiries' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'overview';

  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [modal, setModal] = useState(null); // {type, initial}
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');

  const isFarmer = user?.role === 'farmer';

  const loadAll = useCallback(async () => {
    if (!user) return;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const [dash, inq] = await Promise.all([api.dashboard(), api.inquiries()]);
      const secondary = isFarmer
        ? await api.listings({ farmer_id: user.id, status: '*', limit: 50 })
        : await api.requests({ buyer_id: user.id, status: '*', limit: 50 });

      setState({ loading: false, data: dash, error: '' });
      setInquiries(inq.data);
      if (isFarmer) setListings(secondary.data);
      else setRequests(secondary.data);
    } catch (err) {
      setState({ loading: false, data: null, error: err.message });
    }
  }, [user, isFarmer]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const setTab = (id) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const updateInquiry = async (id, status) => {
    setBusyId(id);
    try {
      await api.updateInquiry(id, { status });
      flash(status === 'completed' ? 'Deal marked completed.' : `Inquiry ${status}.`);
      await loadAll();
    } catch (err) {
      flash(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const deleteListing = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await api.deleteListing(id);
      flash('Listing deleted.');
      await loadAll();
    } catch (err) {
      flash(err.message);
    }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm('Delete this sourcing request?')) return;
    try {
      await api.deleteRequest(id);
      flash('Request deleted.');
      await loadAll();
    } catch (err) {
      flash(err.message);
    }
  };

  if (state.loading && !state.data) {
    return <div className="page"><div className="container"><Spinner label="Building your dashboard…" /></div></div>;
  }

  if (state.error) {
    return (
      <div className="page"><div className="container">
        <Alert tone="error">{state.error}</Alert>
        <button className="btn ghost mt-2" onClick={loadAll}>Retry</button>
      </div></div>
    );
  }

  const data = state.data;
  const stats = data.stats ?? {};
  const tabs = isFarmer ? FARMER_TABS : BUYER_TABS;
  const pendingInquiries = inquiries.filter((i) => i.status === 'pending');

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">{isFarmer ? 'Farmer workspace' : 'Buyer workspace'}</span>
            <h1 style={{ fontSize: '2rem' }} className="mt-1">Hello, {user.full_name.split(' ')[0]}</h1>
            <p>
              {user.organisation ? `${user.organisation} · ` : ''}{user.region ?? 'Ghana'} ·{' '}
              <RoleBadge role={user.role} />
            </p>
          </div>
          <div className="row wrap">
            {isFarmer ? (
              <button className="btn" onClick={() => setModal({ type: 'listing', initial: null })}>
                + New listing
              </button>
            ) : (
              <button className="btn" onClick={() => setModal({ type: 'request', initial: null })}>
                + New sourcing request
              </button>
            )}
            <Link to={isFarmer ? '/demand' : '/marketplace'} className="btn ghost">
              {isFarmer ? 'Browse buyer demand' : 'Browse marketplace'}
            </Link>
          </div>
        </div>

        <Alert tone="success">{notice}</Alert>

        <div className="tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              className="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === 'inquiries' && pendingInquiries.length > 0 && (
                <span className="badge amber" style={{ marginLeft: '0.4rem' }}>{pendingInquiries.length}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="stack" style={{ gap: '1.5rem' }}>
            <div className="grid four">
              {isFarmer ? (
                <>
                  <StatCard label="Active listings" value={stats.active_listings ?? 0} hint={`${stats.total_listings ?? 0} total`} />
                  <StatCard label="Stock listed" value={kg(stats.total_quantity_kg ?? 0, { tonnes: true })} hint="across all listings" />
                  <StatCard label="Matched demand" value={stats.open_matches ?? 0} hint="buyer requests that fit" />
                  <StatCard label="Pending inquiries" value={stats.pending_inquiries ?? 0} hint={`${stats.total_inquiries ?? 0} total`} />
                </>
              ) : (
                <>
                  <StatCard label="Open requests" value={stats.open_requests ?? 0} hint={`${stats.total_requests ?? 0} total`} />
                  <StatCard label="Outstanding volume" value={kg(stats.outstanding_quantity_kg ?? 0, { tonnes: true })} hint="still to source" />
                  <StatCard label="Committed volume" value={kg(stats.committed_quantity_kg ?? 0, { tonnes: true })} hint="accepted + completed" />
                  <StatCard label="Committed value" value={money(stats.committed_value_ghs ?? 0, { compact: true })} hint={`${stats.pending_inquiries ?? 0} pending offers`} />
                </>
              )}
            </div>

            {isFarmer ? (
              <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '1.25rem' }}>
                <div className="card">
                  <div className="between">
                    <h3>Top matched demand</h3>
                    <button className="btn ghost sm" onClick={() => setTab('matches')}>See all</button>
                  </div>
                  {(data.matches ?? []).length === 0 ? (
                    <p className="small muted mt-2">
                      No matching buyer demand yet. Keep your listings active and check back.
                    </p>
                  ) : (
                    <div className="stack mt-2" style={{ gap: '0.6rem' }}>
                      {data.matches.slice(0, 4).map((match) => (
                        <Link
                          key={`${match.listing_id}-${match.request.id}`}
                          to={`/demand/${match.request.id}`}
                          className="match-row"
                          style={{ background: '#f7faf8', border: '1px solid var(--line)' }}
                        >
                          <span aria-hidden="true">🌿</span>
                          <span>
                            <strong style={{ display: 'block', fontSize: '0.88rem' }}>
                              {cropLabel(match.request.crop)} · {match.request.buyer_organisation || match.request.buyer_name}
                            </strong>
                            <span className="tiny muted">
                              needs {kg(match.request.quantity_kg, { tonnes: true })} at up to {money(match.request.max_price_per_kg)}/kg
                            </span>
                          </span>
                          <span className="match-score">{match.score}%</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="between">
                    <h3>Recent listings</h3>
                    <button className="btn ghost sm" onClick={() => setTab('listings')}>Manage</button>
                  </div>
                  {(data.recent_listings ?? []).length === 0 ? (
                    <p className="small muted mt-2">You have not listed any produce yet.</p>
                  ) : (
                    <div className="stack mt-2" style={{ gap: '0.55rem' }}>
                      {data.recent_listings.map((listing) => (
                        <Link key={listing.id} to={`/listings/${listing.id}`} className="between" style={{ padding: '0.45rem 0', borderBottom: '1px solid #f0f3f1' }}>
                          <span>
                            <strong style={{ display: 'block', fontSize: '0.88rem' }}>{cropLabel(listing.crop)} · {kg(listing.quantity_kg, { tonnes: true })}</strong>
                            <span className="tiny muted">{money(listing.price_per_kg)}/kg · {listing.region}</span>
                          </span>
                          <StatusBadge status={listing.status} />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="between">
                  <h3>Recent sourcing requests</h3>
                  <button className="btn ghost sm" onClick={() => setTab('requests')}>Manage</button>
                </div>
                {(data.recent_requests ?? []).length === 0 ? (
                  <p className="small muted mt-2">No sourcing requests yet — publish one to start receiving offers.</p>
                ) : (
                  <div className="table-wrap mt-2">
                    <table className="data">
                      <thead>
                        <tr><th>Crop</th><th>Volume</th><th>Max price</th><th>Needed by</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {data.recent_requests.map((request) => (
                          <tr key={request.id}>
                            <td><strong>{cropLabel(request.crop)}</strong> <span className="tiny muted">Grade {request.grade}</span></td>
                            <td>{kg(request.quantity_kg, { tonnes: true })}</td>
                            <td>{money(request.max_price_per_kg)}/kg</td>
                            <td>{date(request.needed_by)}</td>
                            <td><StatusBadge status={request.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="card">
              <div className="between">
                <h3>Latest inquiries</h3>
                <button className="btn ghost sm" onClick={() => setTab('inquiries')}>View all</button>
              </div>
              <div className="mt-2">
                <InquiryList inquiries={(data.inquiries ?? []).slice(0, 2)} role={user.role} onUpdate={updateInquiry} busyId={busyId} />
              </div>
            </div>
          </div>
        )}

        {tab === 'listings' && isFarmer && (
          <div className="stack">
            <div className="between">
              <p className="small muted">{listings.length} listing{listings.length === 1 ? '' : 's'} on your farm</p>
              <button className="btn sm" onClick={() => setModal({ type: 'listing', initial: null })}>+ New listing</button>
            </div>
            {listings.length === 0 ? (
              <Empty title="No listings yet" action={<button className="btn" onClick={() => setModal({ type: 'listing', initial: null })}>Create your first listing</button>}>
                Publish a harvest so processors and exporters can find you.
              </Empty>
            ) : (
              <div className="card tight table-wrap">
                <table className="data">
                  <thead>
                    <tr><th>Crop</th><th>Volume</th><th>Price</th><th>Region</th><th>Status</th><th>Listed</th><th /></tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => (
                      <tr key={listing.id}>
                        <td><strong>{cropLabel(listing.crop)}</strong> <span className="tiny muted">Grade {listing.grade}</span></td>
                        <td>{kg(listing.quantity_kg, { tonnes: true })}</td>
                        <td>{money(listing.price_per_kg)}/kg</td>
                        <td>{listing.town || listing.region}</td>
                        <td><StatusBadge status={listing.status} /></td>
                        <td className="tiny muted">{timeAgo(listing.created_at)}</td>
                        <td>
                          <div className="row" style={{ gap: '0.35rem', justifyContent: 'flex-end' }}>
                            <Link to={`/listings/${listing.id}`} className="btn ghost sm">View</Link>
                            <button className="btn soft sm" onClick={() => setModal({ type: 'listing', initial: listing })}>Edit</button>
                            <button className="btn ghost sm" onClick={() => deleteListing(listing.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'requests' && !isFarmer && (
          <div className="stack">
            <div className="between">
              <p className="small muted">{requests.length} sourcing request{requests.length === 1 ? '' : 's'}</p>
              <button className="btn sm" onClick={() => setModal({ type: 'request', initial: null })}>+ New request</button>
            </div>
            {requests.length === 0 ? (
              <Empty icon="📋" title="No sourcing requests yet" action={<button className="btn" onClick={() => setModal({ type: 'request', initial: null })}>Publish your first request</button>}>
                Tell farmers what you need and at what price.
              </Empty>
            ) : (
              <div className="card tight table-wrap">
                <table className="data">
                  <thead>
                    <tr><th>Crop</th><th>Volume</th><th>Max price</th><th>Region</th><th>Needed by</th><th>Status</th><th /></tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id}>
                        <td><strong>{cropLabel(request.crop)}</strong> <span className="tiny muted">Grade {request.grade}</span></td>
                        <td>{kg(request.quantity_kg, { tonnes: true })}</td>
                        <td>{money(request.max_price_per_kg)}/kg</td>
                        <td>{request.region || 'Any'}</td>
                        <td>{date(request.needed_by)}</td>
                        <td><StatusBadge status={request.status} /></td>
                        <td>
                          <div className="row" style={{ gap: '0.35rem', justifyContent: 'flex-end' }}>
                            <Link to={`/demand/${request.id}`} className="btn ghost sm">View</Link>
                            <button className="btn soft sm" onClick={() => setModal({ type: 'request', initial: request })}>Edit</button>
                            <button className="btn ghost sm" onClick={() => deleteRequest(request.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'matches' && isFarmer && (
          <div className="stack">
            <div className="card tight">
              <p className="small muted">
                Ranked by crop match, price headroom, volume fit, region and grade. Scores refresh every time you load the page.
              </p>
            </div>
            {(data.matches ?? []).length === 0 ? (
              <Empty icon="🎯" title="No matches yet">
                Publish more listings or broaden your crops — matches appear as buyers post demand.
              </Empty>
            ) : (
              <div className="grid two">
                {data.matches.map((match) => (
                  <article className="card inquiry-card" key={`${match.listing_id}-${match.request.id}`}>
                    <div className="between" style={{ alignItems: 'flex-start' }}>
                      <div>
                        <div className="row" style={{ gap: '0.4rem' }}>
                          <strong>{cropLabel(match.request.crop)}</strong>
                          <Badge tone="green">Grade {match.request.grade}</Badge>
                        </div>
                        <p className="tiny muted mt-1">
                          {match.request.buyer_organisation || match.request.buyer_name} · {match.request.region || 'Any region'}
                        </p>
                      </div>
                      <Badge tone={match.score >= 70 ? 'green' : 'amber'}>{match.score}% fit</Badge>
                    </div>
                    <div className="meta-list">
                      <span>📦 Needs {kg(match.request.quantity_kg, { tonnes: true })}</span>
                      <span>💵 Up to {money(match.request.max_price_per_kg)}/kg</span>
                      <span>🗓️ By {date(match.request.needed_by)}</span>
                    </div>
                    <p className="tiny muted">
                      From your lot: {kg(match.listing_quantity_kg, { tonnes: true })} at {money(match.listing_price_per_kg)}/kg
                      {match.quantity_fits ? ' · volume fits' : ' · split delivery needed'}
                      {match.region_fits ? ' · same region' : ''}
                    </p>
                    <div className="card-foot">
                      <Link to={`/listings/${match.listing_id}`} className="btn ghost sm">Your lot</Link>
                      <Link to={`/demand/${match.request.id}`} className="btn sm">Offer produce</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'inquiries' && (
          <InquiryList inquiries={inquiries} role={user.role} onUpdate={updateInquiry} busyId={busyId} />
        )}
      </div>

      {modal?.type === 'listing' && (
        <Modal
          title={modal.initial ? 'Edit listing' : 'List a harvest'}
          onClose={() => setModal(null)}
        >
          <ListingForm
            initial={modal.initial}
            onDone={async () => { setModal(null); flash(modal.initial ? 'Listing updated.' : 'Listing published.'); await loadAll(); }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === 'request' && (
        <Modal
          title={modal.initial ? 'Edit sourcing request' : 'New sourcing request'}
          onClose={() => setModal(null)}
        >
          <RequestForm
            initial={modal.initial}
            onDone={async () => { setModal(null); flash(modal.initial ? 'Request updated.' : 'Request published.'); await loadAll(); }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
