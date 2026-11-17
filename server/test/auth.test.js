import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { startTestServer } from './helpers.js';

describe('authentication', () => {
  let server;
  before(async () => { server = await startTestServer({ seed: false }); });
  after(async () => { await server.close(); });

  const validSignup = {
    email: 'new.farmer@example.gh',
    password: 'StrongPass123',
    full_name: 'Kofi Test',
    role: 'farmer',
    region: 'Ashanti',
  };

  it('registers a farmer and returns a usable token', async () => {
    const res = await server.api('/api/auth/register', { method: 'POST', body: validSignup });
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'farmer');
    assert.equal(res.body.user.password_hash, undefined, 'never leaks the password hash');

    const me = await server.api('/api/auth/me', { token: res.body.token });
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, validSignup.email);
  });

  it('rejects duplicate emails', async () => {
    const res = await server.api('/api/auth/register', { method: 'POST', body: validSignup });
    assert.equal(res.status, 400);
    assert.equal(res.body.details[0].field, 'email');
  });

  it('rejects short passwords and invalid roles', async () => {
    const short = await server.api('/api/auth/register', {
      method: 'POST',
      body: { ...validSignup, email: 'a@b.gh', password: 'short' },
    });
    assert.equal(short.status, 400);

    const badRole = await server.api('/api/auth/register', {
      method: 'POST',
      body: { ...validSignup, email: 'c@d.gh', role: 'admin' },
    });
    assert.equal(badRole.status, 400);
  });

  it('rejects invalid credentials', async () => {
    const res = await server.api('/api/auth/login', {
      method: 'POST',
      body: { email: validSignup.email, password: 'WrongPassword1' },
    });
    assert.equal(res.status, 401);
  });

  it('rejects requests without a token', async () => {
    const res = await server.api('/api/auth/me');
    assert.equal(res.status, 401);
  });

  it('rejects a tampered token', async () => {
    const login = await server.api('/api/auth/login', {
      method: 'POST',
      body: { email: validSignup.email, password: validSignup.password },
    });
    const tampered = `${login.body.token.slice(0, -2)}xy`;
    const res = await server.api('/api/auth/me', { token: tampered });
    assert.equal(res.status, 401);
  });
});
