import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  full_name     TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK (role IN ('farmer','processor','exporter')),
  phone         TEXT,
  region        TEXT,
  organisation  TEXT,
  bio           TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS listings (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop           TEXT    NOT NULL,
  grade          TEXT    NOT NULL DEFAULT 'A' CHECK (grade IN ('A','B','C')),
  quantity_kg    REAL    NOT NULL CHECK (quantity_kg > 0),
  available_from TEXT,
  price_per_kg   REAL    NOT NULL CHECK (price_per_kg > 0),
  region         TEXT    NOT NULL,
  town           TEXT,
  harvest_date   TEXT,
  description    TEXT,
  status         TEXT    NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','reserved','sold','archived')),
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS demand_requests (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop           TEXT    NOT NULL,
  grade          TEXT    NOT NULL DEFAULT 'A' CHECK (grade IN ('A','B','C')),
  quantity_kg    REAL    NOT NULL CHECK (quantity_kg > 0),
  max_price_per_kg REAL  NOT NULL CHECK (max_price_per_kg > 0),
  needed_by      TEXT,
  region         TEXT,
  notes          TEXT,
  status         TEXT    NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','in_progress','fulfilled','cancelled')),
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inquiries (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id     INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  request_id     INTEGER REFERENCES demand_requests(id) ON DELETE SET NULL,
  buyer_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farmer_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity_kg    REAL    NOT NULL CHECK (quantity_kg > 0),
  offer_price_per_kg REAL NOT NULL CHECK (offer_price_per_kg > 0),
  message        TEXT,
  status         TEXT    NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','declined','completed')),
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_listings_crop     ON listings(crop, status);
CREATE INDEX IF NOT EXISTS idx_listings_farmer   ON listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_listings_region   ON listings(region);
CREATE INDEX IF NOT EXISTS idx_requests_buyer    ON demand_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_buyer   ON inquiries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_farmer  ON inquiries(farmer_id);
`;

/**
 * Opens (and migrates) the SQLite database.
 * @param {string} dbPath
 * @returns {DatabaseSync}
 */
export function openDatabase(dbPath) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec(SCHEMA);
  return db;
}
