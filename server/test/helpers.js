import { createApp } from '../src/app.js';
import { openDatabase } from '../src/db.js';
import { seedDatabase } from '../src/seed.js';

/** Boots an app on an ephemeral port against a throwaway database. */
export async function startTestServer({ seed = true } = {}) {
  const db = openDatabase(':memory:');
  if (seed) seedDatabase(db);

  const app = createApp({ db });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const api = async (path, { method = 'GET', body, token } = {}) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    return {
      status: res.status,
      body: text ? JSON.parse(text) : null,
    };
  };

  const login = async (email, password = 'AgriConnect123') => {
    const res = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    if (res.status !== 200) throw new Error(`login failed for ${email}: ${JSON.stringify(res.body)}`);
    return res.body.token;
  };

  const close = () => new Promise((resolve) => server.close(() => { db.close(); resolve(); }));

  return { db, api, login, close, baseUrl };
}
