import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createToken, verifyToken } from './auth.js';
import { config } from './config.js';
import { CROPS, CROP_SLUGS, GRADES, REGIONS, REGION_NAMES, USER_ROLES, CURRENCY, QUANTITY_UNITS } from './domain.js';
import { HttpError, forbidden, unauthorized } from './http.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { demandRouter } from './routes/demand.js';
import { inquiriesRouter } from './routes/inquiries.js';
import { listingsRouter } from './routes/listings.js';

/**
 * Builds the Express app. Exported separately from the HTTP server so tests can
 * drive it with in-memory databases and no open port.
 */
export function createApp({ db, staticDir = null }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // --- A tiny bit of hardening without pulling in extra dependencies ------
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  app.use(express.json({ limit: '256kb' }));

  // CORS for the separate Vite dev server origin.
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && /^http:\/\/localhost:(5173|4173|3000)$/.test(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  });

  // Naive in-memory throttle for credential endpoints.
  const attempts = new Map();
  const loginThrottle = (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const entry = attempts.get(key) ?? { count: 0, resetAt: now + 60_000 };
    if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60_000; }
    entry.count += 1;
    attempts.set(key, entry);
    if (entry.count > 30) return next(new HttpError(429, 'Too many attempts, try again shortly'));
    next();
  };

  const requireAuth = (req, _res, next) => {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const payload = verifyToken(token, config.jwtSecret);
    if (!payload) return next(unauthorized('Invalid or expired session'));
    req.user = payload;
    next();
  };

  const requireRole = (...roles) => (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(forbidden(`This action requires a ${roles.join(' or ')} account`));
    }
    next();
  };

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'agriconnect-api', time: new Date().toISOString() });
  });

  app.get('/api/meta', (_req, res) => {
    res.json({
      currency: CURRENCY,
      units: QUANTITY_UNITS,
      crops: CROPS,
      crop_slugs: CROP_SLUGS,
      grades: GRADES,
      regions: REGIONS,
      region_names: REGION_NAMES,
      roles: USER_ROLES,
    });
  });

  app.use('/api/auth', loginThrottle, authRouter({ db, requireAuth }));
  app.use('/api/listings', listingsRouter({ db, requireAuth, requireRole }));
  app.use('/api/requests', demandRouter({ db, requireAuth, requireRole }));
  app.use('/api/inquiries', inquiriesRouter({ db, requireAuth }));
  app.use('/api/dashboard', dashboardRouter({ db, requireAuth }));

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API endpoint' }));

  // --- Serve the built React app in production ---------------------------
  if (staticDir && fs.existsSync(path.join(staticDir, 'index.html'))) {
    app.use(express.static(staticDir, { maxAge: '1h', index: false }));
    app.get('*', (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }

  // --- Error handling ----------------------------------------------------
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message, details: err.details });
    }
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON body' });
    }
    console.error('[api] unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

export { createToken };
