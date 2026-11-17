import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { startTestServer } from './helpers.js';

describe('demand requests and inquiries', () => {
  let server;
  let farmerToken;
  let buyerToken;
  let exporterToken;

  before(async () => {
    server = await startTestServer();
    farmerToken = await server.login('ama.mensah@agriconnect.gh');
    buyerToken = await server.login('purchasing@goldenharvest.gh');
    exporterToken = await server.login('sourcing@atlanticcocoa.gh');
  });
  after(async () => { await server.close(); });

  it('exposes open demand requests to farmers', async () => {
    const res = await server.api('/api/requests');
    assert.equal(res.status, 200);
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data.every((r) => r.status === 'open'));
  });

  it('only processors and exporters can publish demand', async () => {
    const blocked = await server.api('/api/requests', {
      method: 'POST',
      token: farmerToken,
      body: { crop: 'maize', quantity_kg: 1000, max_price_per_kg: 3 },
    });
    assert.equal(blocked.status, 403);

    const ok = await server.api('/api/requests', {
      method: 'POST',
      token: exporterToken,
      body: {
        crop: 'cocoa', grade: 'A', quantity_kg: 12000, max_price_per_kg: 44,
        region: 'Western North', needed_by: '2027-01-30', notes: 'Test order',
      },
    });
    assert.equal(ok.status, 201);
    assert.equal(ok.body.data.status, 'open');
    assert.equal(ok.body.data.buyer_id !== undefined, true);
  });

  it('returns ranked farmer matches for a demand request', async () => {
    const list = await server.api('/api/requests?crop=cocoa&limit=1');
    const id = list.body.data[0].id;
    const res = await server.api(`/api/requests/${id}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.matches));
    assert.ok(res.body.matches.length >= 1);
    const scores = res.body.matches.map((m) => m.score);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
    assert.ok(res.body.matches.every((m) => m.listing.price_per_kg <= 45));
  });

  it('runs the full inquiry lifecycle with correct permissions', async () => {
    const listings = await server.api('/api/listings?crop=maize&limit=1');
    const listingId = listings.body.data[0].id;

    const created = await server.api('/api/inquiries', {
      method: 'POST',
      token: buyerToken,
      body: { listing_id: listingId, quantity_kg: 1000, offer_price_per_kg: 2.5, message: 'Test inquiry' },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.status, 'pending');
    const inquiryId = created.body.data.id;

    // The buyer cannot self-approve.
    const selfApprove = await server.api(`/api/inquiries/${inquiryId}`, {
      method: 'PATCH', token: buyerToken, body: { status: 'accepted' },
    });
    assert.equal(selfApprove.status, 403);

    const accepted = await server.api(`/api/inquiries/${inquiryId}`, {
      method: 'PATCH', token: farmerToken, body: { status: 'accepted' },
    });
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.data.status, 'accepted');

    // Illegal jump accepted -> declined.
    const illegal = await server.api(`/api/inquiries/${inquiryId}`, {
      method: 'PATCH', token: farmerToken, body: { status: 'declined' },
    });
    assert.equal(illegal.status, 400);

    const completed = await server.api(`/api/inquiries/${inquiryId}`, {
      method: 'PATCH', token: buyerToken, body: { status: 'completed' },
    });
    assert.equal(completed.status, 200);
    assert.equal(completed.body.data.status, 'completed');
  });

  it('stops a user from inquiring on their own listing', async () => {
    const listings = await server.api('/api/listings?farmer_id=1&limit=1');
    const mine = listings.body.data[0];
    const res = await server.api('/api/inquiries', {
      method: 'POST',
      token: farmerToken,
      body: { listing_id: mine.id, quantity_kg: 100, offer_price_per_kg: 1 },
    });
    assert.equal(res.status, 400);
  });

  it('scopes inquiry lists to the signed-in user', async () => {
    const buyerView = await server.api('/api/inquiries', { token: buyerToken });
    assert.equal(buyerView.status, 200);
    const farmerView = await server.api('/api/inquiries', { token: farmerToken });
    assert.equal(farmerView.status, 200);
    const overlap = buyerView.body.data.filter((b) =>
      farmerView.body.data.some((f) => f.id === b.id && f.buyer_id === b.buyer_id));
    assert.ok(Array.isArray(overlap));
    assert.ok(farmerView.body.data.every((i) => i.farmer_id === 1));
  });

  it('builds a farmer dashboard with matches and stats', async () => {
    const res = await server.api('/api/dashboard', { token: farmerToken });
    assert.equal(res.status, 200);
    assert.equal(res.body.role, 'farmer');
    assert.ok(res.body.stats.total_listings >= 1);
    assert.ok(Array.isArray(res.body.matches));
    assert.ok(Array.isArray(res.body.recent_listings));
  });

  it('builds a buyer dashboard with committed value', async () => {
    const res = await server.api('/api/dashboard', { token: buyerToken });
    assert.equal(res.status, 200);
    assert.equal(res.body.role, 'processor');
    assert.ok(res.body.stats.total_requests >= 1);
    assert.ok(res.body.stats.committed_value_ghs >= 0);
    assert.ok(Array.isArray(res.body.recent_requests));
  });
});
