export const CROP_LABELS = {
  cocoa: 'Cocoa',
  cashew: 'Cashew',
  'shea-nut': 'Shea nut',
  maize: 'Maize',
  'rice-paddy': 'Rice paddy',
  'soya-bean': 'Soya bean',
  cassava: 'Cassava',
  yam: 'Yam',
  tomato: 'Tomato',
  onion: 'Onion',
  'palm-fruit': 'Oil palm fruit',
  groundnut: 'Groundnut',
};

export const ROLE_LABELS = {
  farmer: 'Farmer',
  processor: 'Processor',
  exporter: 'Exporter',
};

export function cropLabel(slug) {
  return CROP_LABELS[slug] ?? slug;
}

export function money(value, { compact = false } = {}) {
  const num = Number(value) || 0;
  if (compact && num >= 1000) {
    return `GHS ${new Intl.NumberFormat('en-GH', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num)}`;
  }
  return `GHS ${new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)}`;
}

export function kg(value, { tonnes = false } = {}) {
  const num = Number(value) || 0;
  if (tonnes && num >= 1000) {
    return `${new Intl.NumberFormat('en-GH', { maximumFractionDigits: 1 }).format(num / 1000)} t`;
  }
  return `${new Intl.NumberFormat('en-GH', { maximumFractionDigits: 0 }).format(num)} kg`;
}

export function date(value, { withTime = false } = {}) {
  if (!value) return '—';
  const normalised = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const d = new Date(normalised);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function timeAgo(value) {
  if (!value) return '';
  const then = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return date(value);
}

export const STATUS_LABELS = {
  active: 'Active',
  reserved: 'Reserved',
  sold: 'Sold',
  archived: 'Archived',
  open: 'Open',
  in_progress: 'In progress',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  completed: 'Completed',
};
