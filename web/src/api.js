const TOKEN_KEY = 'agriconnect.token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage may be unavailable (private mode) — sessions still work in memory */
  }
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }

  /** Turns a validation payload into a field -> message map for form errors. */
  fieldErrors() {
    if (!Array.isArray(this.details)) return {};
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the AgriConnect API. Is the server running?', 0);
  }

  if (res.status === 204) return null;

  const text = await res.text();
  const payload = text ? safeParse(text) : null;

  if (!res.ok) {
    throw new ApiError(payload?.error || `Request failed (${res.status})`, res.status, payload?.details);
  }
  return payload;
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toQuery(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  meta: () => request('/meta', { auth: false }),

  register: (body) => request('/auth/register', { method: 'POST', body, auth: false }),
  login: (body) => request('/auth/login', { method: 'POST', body, auth: false }),
  me: () => request('/auth/me'),

  listings: (params) => request(`/listings${toQuery(params)}`, { auth: false }),
  listing: (id) => request(`/listings/${id}`, { auth: false }),
  createListing: (body) => request('/listings', { method: 'POST', body }),
  updateListing: (id, body) => request(`/listings/${id}`, { method: 'PATCH', body }),
  deleteListing: (id) => request(`/listings/${id}`, { method: 'DELETE' }),

  requests: (params) => request(`/requests${toQuery(params)}`, { auth: false }),
  demandRequest: (id) => request(`/requests/${id}`, { auth: false }),
  createRequest: (body) => request('/requests', { method: 'POST', body }),
  updateRequest: (id, body) => request(`/requests/${id}`, { method: 'PATCH', body }),
  deleteRequest: (id) => request(`/requests/${id}`, { method: 'DELETE' }),

  inquiries: (params) => request(`/inquiries${toQuery(params)}`),
  createInquiry: (body) => request('/inquiries', { method: 'POST', body }),
  updateInquiry: (id, body) => request(`/inquiries/${id}`, { method: 'PATCH', body }),

  dashboard: () => request('/dashboard'),
};
