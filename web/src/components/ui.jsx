import { STATUS_LABELS } from '../format.js';

const STATUS_STYLES = {
  active: 'green',
  open: 'green',
  accepted: 'green',
  completed: 'blue',
  fulfilled: 'blue',
  reserved: 'amber',
  pending: 'amber',
  in_progress: 'amber',
  declined: 'red',
  cancelled: 'red',
  sold: 'slate',
  archived: 'slate',
};

export function Badge({ children, tone = 'default' }) {
  const cls = tone === 'default' ? 'badge' : `badge ${tone}`;
  return <span className={cls}>{children}</span>;
}

export function StatusBadge({ status }) {
  return <Badge tone={STATUS_STYLES[status] ?? 'slate'}>{STATUS_LABELS[status] ?? status}</Badge>;
}

export function RoleBadge({ role }) {
  const tone = role === 'farmer' ? 'green' : role === 'exporter' ? 'blue' : 'amber';
  const label = role === 'farmer' ? 'Farmer' : role === 'exporter' ? 'Exporter' : 'Processor';
  return <Badge tone={tone}>{label}</Badge>;
}

export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div className="field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? (
        <span className="tiny muted">{hint}</span>
      ) : null}
    </div>
  );
}

export function Alert({ tone = 'info', children }) {
  if (!children) return null;
  return <div className={`alert ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function Empty({ icon = '🌱', title, children, action }) {
  return (
    <div className="empty">
      <div className="icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {children && <p className="mt-1 small">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="empty" role="status" aria-live="polite">
      <div className="skeleton" style={{ height: 14, width: 160, margin: '0 auto 0.6rem' }} />
      <p className="small muted">{label}</p>
    </div>
  );
}

export function StatCard({ label, value, hint }) {
  return (
    <div className="card tight stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint && <span className="tiny muted">{hint}</span>}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
