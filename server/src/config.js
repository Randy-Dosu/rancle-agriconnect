import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');

export const config = {
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || '0.0.0.0',
  dbPath: process.env.DB_PATH || path.join(serverRoot, 'data', 'agriconnect.db'),
  // In production this must be supplied through the environment (e.g. Vercel project env vars).
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  tokenTtlSeconds: Number(process.env.TOKEN_TTL_SECONDS || 60 * 60 * 24 * 7),
  seedOnBoot: process.env.SEED_ON_BOOT !== 'false',
};
