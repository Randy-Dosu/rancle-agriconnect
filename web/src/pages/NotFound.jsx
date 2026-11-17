import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <div className="container center" style={{ padding: '4rem 0' }}>
        <div style={{ fontSize: '2.5rem' }} aria-hidden="true">🌾</div>
        <h1 className="mt-2">This field is empty</h1>
        <p className="muted mt-1">The page you were looking for does not exist.</p>
        <div className="row mt-3" style={{ justifyContent: 'center' }}>
          <Link to="/" className="btn">Back home</Link>
          <Link to="/marketplace" className="btn ghost">Browse marketplace</Link>
        </div>
      </div>
    </div>
  );
}
