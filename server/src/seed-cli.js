import { config } from './config.js';
import { openDatabase } from './db.js';
import { DEMO_PASSWORD, seedDatabase } from './seed.js';

const force = process.argv.includes('--force');

if (force) {
  const db = openDatabase(config.dbPath);
  db.exec('DELETE FROM inquiries; DELETE FROM demand_requests; DELETE FROM listings; DELETE FROM users;');
  const result = seedDatabase(db, { force: true });
  console.log(`[seed] database reset — ${result.users} accounts created`);
  db.close();
} else {
  const db = openDatabase(config.dbPath);
  const result = seedDatabase(db);
  console.log(
    result.seeded
      ? `[seed] demo dataset created — ${result.users} accounts`
      : `[seed] database already has ${result.users} accounts (use --force to reset)`,
  );
  db.close();
}

console.log(`[seed] demo password for every account: ${DEMO_PASSWORD}`);
