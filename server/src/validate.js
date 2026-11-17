import { badRequest } from './http.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function fail(field, message) {
  throw badRequest('Validation failed', [{ field, message }]);
}

export function requireString(value, field, { min = 1, max = 500, trim = true } = {}) {
  if (typeof value !== 'string') fail(field, 'must be a string');
  const out = trim ? value.trim() : value;
  if (out.length < min) fail(field, `must be at least ${min} character(s)`);
  if (out.length > max) fail(field, `must be at most ${max} characters`);
  return out;
}

export function optionalString(value, field, opts = {}) {
  if (value === undefined || value === null || value === '') return null;
  return requireString(value, field, opts);
}

export function requireEmail(value, field = 'email') {
  const email = requireString(value, field, { max: 254 }).toLowerCase();
  if (!EMAIL_RE.test(email)) fail(field, 'must be a valid email address');
  return email;
}

export function requireEnum(value, field, allowed) {
  if (!allowed.includes(value)) fail(field, `must be one of: ${allowed.join(', ')}`);
  return value;
}

export function requirePositiveNumber(value, field, { max = 1e9 } = {}) {
  const num = typeof value === 'string' ? Number(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num) || num <= 0) {
    fail(field, 'must be a positive number');
  }
  if (num > max) fail(field, `must be at most ${max}`);
  return Math.round(num * 100) / 100;
}

export function optionalDate(value, field) {
  if (value === undefined || value === null || value === '') return null;
  const str = requireString(value, field, { max: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) fail(field, 'must be an ISO date (YYYY-MM-DD)');
  const d = new Date(`${str}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) fail(field, 'must be a real calendar date');
  return str;
}

export function requirePassword(value) {
  const password = requireString(value, 'password', { min: 8, max: 128, trim: false });
  return password;
}

export function requireArrayOfStrings(value, field, allowed, { min = 0 } = {}) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail(field, 'must be an array');
  if (value.length < min) fail(field, `must contain at least ${min} item(s)`);
  for (const item of value) {
    if (!allowed.includes(item)) fail(field, `contains an unsupported value: ${item}`);
  }
  return [...new Set(value)];
}
