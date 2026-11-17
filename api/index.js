/**
 * Vercel serverless entry point. Vercel rewrites every /api/* request here, so
 * the Express app sees the original path and can route it as usual.
 *
 * NOTE: the serverless filesystem is ephemeral. Set DB_PATH to a persistent
 * volume or point server/src/db.js at a hosted database before storing real data.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../server/src/app.js';
import { config } from '../server/src/config.js';
import { openDatabase } from '../server/src/db.js';
import { seedDatabase } from '../server/src/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(__dirname, '../web/dist');

const dbPath = process.env.DB_PATH || '/tmp/agriconnect.db';
const db = openDatabase(dbPath);

if (config.seedOnBoot) {
  try {
    seedDatabase(db);
  } catch (err) {
    console.error('[vercel] seed skipped:', err.message);
  }
}

export default createApp({ db, staticDir: webDist });
