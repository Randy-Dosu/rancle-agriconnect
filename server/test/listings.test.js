import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { startTestServer } from './helpers.js';

describe('listings', () => {
  let server;
  let farmerToken;
  let buyerToken;

  before(async () => {
    server = await startTestServer();
    farmerToken = await server.login('ama.mensah@agriconnect.gh');
    buyerToken = await server.login('purchasing@goldenharvest.gh');
  });
  after(async () => { await server.close(); });

  it('serves public meta reference data', async () => {
    const res = await server.api('/api/meta');
    assert.equal(res.status, 200);
    assert.equal(res.body.currency, 'GHS');
    assert.ok(res.body.crops.some((c) => c.slug === 'cocoa'));
    assert.ok(res.body.region_names.includes('Ashanti'));
  });

  it('lists only active listings by default', async () => {
    const res = await server.api('/api/listings');
    assert.equal(res.status, 200);
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data.every((l) => l.status === 'active'));
    assert.ok(res.body.meta.total >= res.body.data.length);
  });

  it('filters by crop and region', async () => {
    const res = await server.api('/api/listings?crop=cocoa&region=Western%20North');
    assert.equal(res.status, 200);
    assert.ok(res.body.data.length >= 1);
    for (const listing of res.body.data) {
      assert.equal(listing.crop, 'cocoa');
      assert.equal(listing.region, 'Western North');
    }
  });

  it('supports full-text search and sorting', async () => {
    const search = await server.api('/api/listings?search=Ejisu');
    assert.equal(search.status, 200);
    assert.ok(search.body.data.length >= 1);

    const sorted = await server.api('/api/listings?sort=price_asc&limit=5');
    const prices = sorted.body.data.map((l) => l.price_per_kg);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  });

  it('rejects an unknown crop filter', async () => {
    const res = await server.api('/api/listings?crop=dragonfruit');
    assert.equal(res.status, 400);
  });

  it('lets a farmer create, edit and delete a listing', async () => {
    const create = await server.api('/api/listings', {
      method: 'POST',
      token: farmerToken,
      body: {
        crop: 'maize',
        grade: 'A',
        quantity_kg: 5000,
        price_per_kg: 2.5,
        region: 'Ashanti',
        town: 'Konongo',
        description: 'Test lot',
      },
    });
    assert.equal(create.status, 201);
    const id = create.body.data.id;
    assert.equal(create.body.data.status, 'active');

    const patch = await server.api(`/api/listings/${id}`, {
      method: 'PATCH',
      token: farmerToken,
      body: { price_per_kg: 2.75, status: 'reserved' },
    });
    assert.equal(patch.status, 200);
    assert.equal(patch.body.data.price_per_kg, 2.75);
    assert.equal(patch.body.data.status, 'reserved');

    const del = await server.api(`/api/listings/${id}`, { method: 'DELETE', token: farmerToken });
    assert.equal(del.status, 204);

    const gone = await server.api(`/api/listings/${id}`);
    assert.equal(gone.status, 404);
  });

  it('blocks buyers from creating listings', async () => {
    const res = await server.api('/api/listings', {
      method: 'POST',
      token: buyerToken,
      body: { crop: 'maize', quantity_kg: 10, price_per_kg: 1, region: 'Ashanti' },
    });
    assert.equal(res.status, 403);
  });

  it('prevents a farmer from editing another farmer\'s listing', async () => {
    const otherToken = await server.login('kwame.owusu@agriconnect.gh');
    const listing = await server.api('/api/listings?crop=maize&limit=1');
    const id = listing.body.data[0].id;
    const res = await server.api(`/api/listings/${id}`, {
      method: 'PATCH',
      token: otherToken,
      body: { price_per_kg: 99 },
    });
    assert.equal(res.status, 403);
  });

  it('validates numeric fields', async () => {
    const res = await server.api('/api/listings', {
      method: 'POST',
      token: farmerToken,
      body: { crop: 'maize', quantity_kg: -5, price_per_kg: 'abc', region: 'Ashanti' },
    });
    assert.equal(res.status, 400);
    assert.ok(res.body.details.length >= 1);
  });
});
