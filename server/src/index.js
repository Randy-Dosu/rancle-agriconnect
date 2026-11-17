import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { config } from './config.js';
import { openDatabase } from './db.js';
import { seedDatabase } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(__dirname, '../../web/dist');

const db = openDatabase(config.dbPath);

if (config.seedOnBoot) {
  const { seeded, users } = seedDatabase(db);
  if (seeded) console.log(`[seed] demo dataset created (${users} accounts)`);
}

const app = createApp({ db, staticDir: webDist });

const server = app.listen(config.port, config.host, () => {
  console.log(`[api] AgriConnect listening on http://${config.host}:${config.port}`);
});

function shutdown(signal) {
  console.log(`[api] ${signal} received, shutting down`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
