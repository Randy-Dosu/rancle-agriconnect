import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Badge, Empty, Spinner } from '../components/ui.jsx';
import { cropLabel, date, kg, money, timeAgo } from '../format.js';

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'quantity_desc', label: 'Largest volume' },
];

export function ListingCard({ listing }) {
  return (
    <article className="card hoverable listing-card">
      <div className="listing-head">
        <div>
          <div className="row" style={{ gap: '0.45rem' }}>
            <h3 className="listing-title">{cropLabel(listing.crop)}</h3>
            <Badge tone="green">Grade {listing.grade}</Badge>
          </div>
          <p className="tiny muted mt-1">
            {listing.farmer_organisation || listing.farmer_name} · {listing.region}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="listing-price">{money(listing.price_per_kg)}</div>
          <span className="tiny muted">per kg</span>
        </div>
      </div>

      <div className="meta-list">
        <span>📦 {kg(listing.quantity_kg, { tonnes: true })}</span>
        <span>📍 {listing.town || listing.region}</span>
        <span>🗓️ Ready {date(listing.available_from ?? listing.harvest_date)}</span>
      </div>

      {listing.description && (
        <p className="small muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {listing.description}
        </p>
      )}

      <div className="card-foot">
        <span className="tiny muted">
          Listed {timeAgo(listing.created_at)} · {money(listing.price_per_kg * listing.quantity_kg, { compact: true })} total
        </span>
        <Link to={`/listings/${listing.id}`} className="btn soft sm">View lot</Link>
      </div>
    </article>
  );
}

export default function Marketplace() {
  const { meta, user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState({ loading: true, data: [], meta: null, error: '' });

  const filters = useMemo(() => ({
    crop: params.get('crop') ?? '',
    region: params.get('region') ?? '',
    grade: params.get('grade') ?? '',
    search: params.get('search') ?? '',
    sort: params.get('sort') ?? 'newest',
    max_price: params.get('max_price') ?? '',
    page: params.get('page') ?? '1',
  }), [params]);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    api
      .listings(filters)
      .then((res) => {
        if (!cancelled) setState({ loading: false, data: res.data, meta: res.meta, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, data: [], meta: null, error: err.message });
      });
    return () => { cancelled = true; };
  }, [filters]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const crops = meta?.crops ?? [];
  const regions = meta?.region_names ?? [];

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">Marketplace</span>
            <h1 style={{ fontSize: '2rem' }} className="mt-1">Available produce</h1>
            <p>Farm-gate lots from across Ghana, priced in cedis per kilogram.</p>
          </div>
          {user?.role === 'farmer' && (
            <Link to="/dashboard?tab=listings" className="btn">+ List a harvest</Link>
          )}
        </div>

        <div className="card tight" style={{ marginBottom: '1.5rem' }}>
          <div className="filters">
            <div className="field search-field">
              <label htmlFor="search">Search</label>
              <input
                id="search"
                type="search"
                placeholder="Town, cooperative, description…"
                defaultValue={filters.search}
                onKeyDown={(e) => { if (e.key === 'Enter') setFilter('search', e.currentTarget.value); }}
                onBlur={(e) => setFilter('search', e.currentTarget.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="crop">Crop</label>
              <select id="crop" value={filters.crop} onChange={(e) => setFilter('crop', e.target.value)}>
                <option value="">All crops</option>
                {crops.map((crop) => (
                  <option key={crop.slug} value={crop.slug}>{crop.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="region">Region</label>
              <select id="region" value={filters.region} onChange={(e) => setFilter('region', e.target.value)}>
                <option value="">All regions</option>
                {regions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="sort">Sort by</label>
              <select id="sort" value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}>
                {SORTS.map((sort) => (
                  <option key={sort.value} value={sort.value}>{sort.label}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
            >
              Reset
            </button>
          </div>
        </div>

        <Alert tone="error">{state.error}</Alert>

        {state.loading ? (
          <Spinner label="Loading listings…" />
        ) : state.data.length === 0 ? (
          <Empty
            title="No lots match those filters"
            action={<button className="btn soft" onClick={() => setParams(new URLSearchParams())}>Clear filters</button>}
          >
            Try widening the region or crop — new harvests are listed every week.
          </Empty>
        ) : (
          <>
            <div className="between" style={{ marginBottom: '0.85rem' }}>
              <span className="small muted">
                {state.meta?.total} lot{state.meta?.total === 1 ? '' : 's'} found
              </span>
              <span className="small muted">Page {state.meta?.page} of {state.meta?.pages}</span>
            </div>
            <div className="grid three">
              {state.data.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            {state.meta && state.meta.pages > 1 && (
              <div className="pagination">
                <button
                  className="btn ghost sm"
                  disabled={state.meta.page <= 1}
                  onClick={() => setFilter('page', String(state.meta.page - 1))}
                >
                  ← Previous
                </button>
                <span>{state.meta.page} / {state.meta.pages}</span>
                <button
                  className="btn ghost sm"
                  disabled={state.meta.page >= state.meta.pages}
                  onClick={() => setFilter('page', String(state.meta.page + 1))}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
