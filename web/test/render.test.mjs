/**
 * Render smoke tests for the React app.
 *
 * Node cannot evaluate JSX on its own, so the app is loaded through Vite's SSR
 * module loader — the same transform the real dev server uses. That means a
 * broken component, bad import or hook misuse fails here instead of in the
 * browser.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const META = {
  currency: 'GHS',
  units: ['kg'],
  crops: [
    { slug: 'maize', name: 'Maize' },
    { slug: 'cocoa', name: 'Cocoa' },
  ],
  crop_slugs: ['maize', 'cocoa'],
  grades: ['A', 'B', 'C'],
  regions: [{ code: 'AH', name: 'Ashanti' }],
  region_names: ['Ashanti', 'Northern'],
  roles: ['farmer', 'processor', 'exporter'],
};

/** Stubs fetch so page-level data loading resolves deterministically. */
function stubFetch() {
  globalThis.fetch = async (input) => {
    const path = String(input).replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    const body = path === '/api/meta'
      ? META
      : { data: [], meta: { page: 1, pages: 1, total: 0 }, matches: [] };
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(body),
    };
  };
}

// React Router warns about useLayoutEffect during SSR; that is expected here.
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('useLayoutEffect does nothing on the server')) return;
  originalError(...args);
};

describe('web app render smoke tests', () => {
  let vite;
  let modules;

  before(async () => {
    stubFetch();
    // localStorage is browser-only; the auth store guards it but be explicit.
    globalThis.localStorage = {
      store: new Map(),
      getItem(key) { return this.store.get(key) ?? null; },
      setItem(key, value) { this.store.set(key, String(value)); },
      removeItem(key) { this.store.delete(key); },
    };

    vite = await createServer({
      configFile: new URL('../vite.config.js', import.meta.url).pathname,
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'silent',
    });

    const [auth, router, app] = await Promise.all([
      vite.ssrLoadModule('/src/auth.jsx'),
      import('react-router-dom'),
      vite.ssrLoadModule('/src/App.jsx'),
    ]);
    modules = { AuthProvider: auth.AuthProvider, MemoryRouter: router.MemoryRouter, App: app.default };
  });

  after(async () => {
    await vite?.close();
  });

  const render = (path) => renderToString(
    createElement(
      modules.MemoryRouter,
      { initialEntries: [path] },
      createElement(modules.AuthProvider, null, createElement(modules.App)),
    ),
  );

  const PAGES = [
    ['/', 'From farm gate to export contract.'],
    ['/marketplace', 'Available produce'],
    ['/demand', 'What processors and exporters want'],
    ['/login', 'Sign in to AgriConnect'],
    ['/register', 'Create your account'],
    ['/some/missing/page', 'This field is empty'],
  ];

  for (const [path, expected] of PAGES) {
    it(`renders ${path}`, () => {
      const html = render(path);
      assert.ok(html.length > 500, 'produced markup');
      assert.ok(html.includes(expected), `expected "${expected}" on ${path}`);
    });
  }

  it('lands the Ghana-specific pitch on the home page', () => {
    const html = render('/');
    assert.ok(html.includes('Ghana agri-trade network'));
    assert.ok(html.includes('GHS'));
    assert.ok(html.includes('Live match preview'));
  });

  it('never renders the dashboard to an anonymous visitor', () => {
    // <Navigate> only redirects on the client, so assert the guard withheld
    // all dashboard content; the redirect itself is covered by API auth tests.
    const html = render('/dashboard');
    assert.ok(!html.includes('Farmer workspace'));
    assert.ok(!html.includes('Buyer workspace'));
    assert.ok(!html.includes('New sourcing request'));
  });

  it('offers all three account types at registration', () => {
    const html = render('/register');
    for (const role of ['Farmer', 'Processor', 'Exporter']) {
      assert.ok(html.includes(role), `missing ${role} role option`);
    }
    assert.ok(html.includes('Ashanti'), 'region options come from the API');
  });
});
