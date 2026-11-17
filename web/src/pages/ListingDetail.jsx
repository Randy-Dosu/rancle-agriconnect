import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Badge, Field, Modal, Spinner, StatusBadge } from '../components/ui.jsx';
import { cropLabel, date, kg, money, timeAgo } from '../format.js';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState({ loading: true, listing: null, error: '' });
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [form, setForm] = useState({ quantity_kg: '', offer_price_per_kg: '', message: '' });
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, listing: null, error: '' });
    api
      .listing(id)
      .then((res) => {
        if (cancelled) return;
        setState({ loading: false, listing: res.data, error: '' });
        setForm((f) => ({
          ...f,
          quantity_kg: String(Math.round(res.data.quantity_kg)),
          offer_price_per_kg: String(res.data.price_per_kg),
        }));
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, listing: null, error: err.message });
      });
    return () => { cancelled = true; };
  }, [id]);

  const { listing } = state;
  const isOwner = listing && user?.id === listing.farmer_id;
  const canInquire = user && listing && !isOwner && listing.status === 'active';

  const submitInquiry = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFormError('');
    setFormErrors({});
    try {
      await api.createInquiry({
        listing_id: Number(id),
        quantity_kg: Number(form.quantity_kg),
        offer_price_per_kg: Number(form.offer_price_per_kg),
        message: form.message || null,
      });
      setSent(true);
      setInquiryOpen(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.details ? 'Please check the highlighted fields.' : err.message);
        setFormErrors(err.fieldErrors());
      } else {
        setFormError('Could not send the inquiry. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (state.loading) {
    return <div className="page"><div className="container"><Spinner label="Loading lot…" /></div></div>;
  }

  if (state.error || !listing) {
    return (
      <div className="page">
        <div className="container">
          <Alert tone="error">{state.error || 'Listing not found'}</Alert>
          <Link to="/marketplace" className="btn ghost mt-2">← Back to marketplace</Link>
        </div>
      </div>
    );
  }

  const totalValue = listing.price_per_kg * listing.quantity_kg;

  return (
    <div className="page">
      <div className="container">
        <Link to="/marketplace" className="small muted">← Back to marketplace</Link>

        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '1.5rem', marginTop: '1rem' }}>
          <div className="stack">
            <div className="card">
              <div className="between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className="row" style={{ gap: '0.5rem' }}>
                    <h1 style={{ fontSize: '1.85rem' }}>{cropLabel(listing.crop)}</h1>
                    <Badge tone="green">Grade {listing.grade}</Badge>
                    <StatusBadge status={listing.status} />
                  </div>
                  <p className="muted small mt-1">
                    📍 {listing.town ? `${listing.town}, ` : ''}{listing.region} · listed {timeAgo(listing.created_at)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="listing-price" style={{ fontSize: '1.4rem' }}>{money(listing.price_per_kg)}</div>
                  <span className="tiny muted">per kg</span>
                </div>
              </div>

              <div className="grid four mt-3">
                <div><span className="stat-label">Volume</span><div className="stat-value" style={{ fontSize: '1.15rem' }}>{kg(listing.quantity_kg, { tonnes: true })}</div></div>
                <div><span className="stat-label">Lot value</span><div className="stat-value" style={{ fontSize: '1.15rem' }}>{money(totalValue, { compact: true })}</div></div>
                <div><span className="stat-label">Harvested</span><div className="stat-value" style={{ fontSize: '1.15rem' }}>{date(listing.harvest_date)}</div></div>
                <div><span className="stat-label">Available from</span><div className="stat-value" style={{ fontSize: '1.15rem' }}>{date(listing.available_from)}</div></div>
              </div>

              {listing.description && (
                <>
                  <h3 className="mt-3">About this lot</h3>
                  <p className="small muted mt-1" style={{ whiteSpace: 'pre-line' }}>{listing.description}</p>
                </>
              )}
            </div>

            <div className="card">
              <h3>Seller</h3>
              <div className="row mt-2" style={{ gap: '0.85rem' }}>
                <span className="avatar" style={{ width: 46, height: 46, fontSize: '1rem' }}>
                  {listing.farmer_name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </span>
                <div>
                  <strong>{listing.farmer_name}</strong>
                  <p className="small muted">
                    {listing.farmer_organisation || 'Independent farmer'} · {listing.region}
                  </p>
                </div>
              </div>
              <p className="small muted mt-2">
                Contact details are shared once an inquiry is accepted — that keeps both sides on record.
              </p>
            </div>
          </div>

          <aside className="stack">
            <div className="card">
              <h3>Interested in this lot?</h3>
              <p className="small muted mt-1">
                Send an offer with the volume you can take and your target price per kilogram.
              </p>

              <Alert tone="success">{sent && 'Inquiry sent — track it from your dashboard.'}</Alert>
              <Alert tone="error">{formError && !inquiryOpen ? formError : ''}</Alert>

              {!user && (
                <div className="stack mt-2">
                  <Link to="/login" className="btn block">Sign in to make an offer</Link>
                  <Link to="/register" className="btn ghost block">Create an account</Link>
                </div>
              )}

              {user && isOwner && (
                <p className="small muted mt-2">
                  This is your listing. Manage it from your <Link to="/dashboard" style={{ color: 'var(--green-800)' }}>dashboard</Link>.
                </p>
              )}

              {canInquire && !sent && (
                <button type="button" className="btn block mt-2" onClick={() => setInquiryOpen(true)}>
                  Make an offer
                </button>
              )}

              {user && listing.status !== 'active' && !isOwner && (
                <p className="small muted mt-2">This lot is no longer available for new offers.</p>
              )}
            </div>

            <div className="card tight">
              <h3 style={{ fontSize: '1rem' }}>Deal checklist</h3>
              <ul className="small muted" style={{ paddingLeft: '1.1rem', lineHeight: 1.9, marginTop: '0.4rem' }}>
                <li>Agree volume and price in GHS per kg</li>
                <li>Confirm quality grade and moisture</li>
                <li>Arrange haulage from the farm gate</li>
                <li>Mark the deal completed once delivered</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {inquiryOpen && (
        <Modal title={`Offer on ${cropLabel(listing.crop)}`} onClose={() => setInquiryOpen(false)}>
          <form className="stack" onSubmit={submitInquiry} noValidate>
            <Alert tone="error">{formError}</Alert>

            <div className="grid two" style={{ gap: '0.75rem' }}>
              <Field label="Quantity (kg)" htmlFor="qty" error={formErrors.quantity_kg}>
                <input
                  id="qty"
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity_kg}
                  onChange={(e) => setForm((f) => ({ ...f, quantity_kg: e.target.value }))}
                  aria-invalid={Boolean(formErrors.quantity_kg)}
                  required
                />
              </Field>
              <Field label="Offer price (GHS/kg)" htmlFor="price" error={formErrors.offer_price_per_kg}>
                <input
                  id="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.offer_price_per_kg}
                  onChange={(e) => setForm((f) => ({ ...f, offer_price_per_kg: e.target.value }))}
                  aria-invalid={Boolean(formErrors.offer_price_per_kg)}
                  required
                />
              </Field>
            </div>

            <Field label="Message to the farmer" htmlFor="message" error={formErrors.message}>
              <textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Delivery window, inspection needs, haulage arrangements…"
              />
            </Field>

            <p className="tiny muted">
              Offer total: {money((Number(form.quantity_kg) || 0) * (Number(form.offer_price_per_kg) || 0), { compact: true })}
            </p>

            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn ghost" onClick={() => setInquiryOpen(false)}>Cancel</button>
              <button type="submit" className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send inquiry'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
