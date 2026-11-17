import { Router } from 'express';
import { config } from '../config.js';
import { createToken, hashPassword, verifyPassword } from '../auth.js';
import { USER_ROLES, REGION_NAMES } from '../domain.js';
import { asyncHandler, badRequest, unauthorized, notFound } from '../http.js';
import * as store from '../store.js';
import {
  requireEmail, requireEnum, requirePassword, requireString, optionalString,
} from '../validate.js';

export function authRouter({ db, requireAuth }) {
  const router = Router();

  router.post('/register', asyncHandler((req, res) => {
    const body = req.body ?? {};
    const email = requireEmail(body.email);
    const password = requirePassword(body.password);
    const fullName = requireString(body.full_name, 'full_name', { min: 2, max: 120 });
    const role = requireEnum(body.role, 'role', USER_ROLES);
    const region = body.region ? requireEnum(body.region, 'region', REGION_NAMES) : null;
    const phone = optionalString(body.phone, 'phone', { max: 30 });
    const organisation = optionalString(body.organisation, 'organisation', { max: 160 });
    const bio = optionalString(body.bio, 'bio', { max: 1000 });

    if (store.findUserByEmail(db, email)) {
      throw badRequest('Validation failed', [{ field: 'email', message: 'is already registered' }]);
    }

    const user = store.createUser(db, {
      email,
      password_hash: hashPassword(password),
      full_name: fullName,
      role,
      phone,
      region,
      organisation,
      bio,
    });

    const token = createToken({ sub: user.id, role: user.role }, config.jwtSecret, config.tokenTtlSeconds);
    res.status(201).json({ token, user });
  }));

  router.post('/login', asyncHandler((req, res) => {
    const email = requireEmail(req.body?.email);
    const password = requirePassword(req.body?.password);
    const record = store.findUserByEmail(db, email);
    if (!record || !verifyPassword(password, record.password_hash)) {
      throw unauthorized('Invalid email or password');
    }
    const user = store.findUserById(db, record.id);
    const token = createToken({ sub: user.id, role: user.role }, config.jwtSecret, config.tokenTtlSeconds);
    res.json({ token, user });
  }));

  router.get('/me', requireAuth, asyncHandler((req, res) => {
    const user = store.findUserById(db, req.user.sub);
    if (!user) throw notFound('User not found');
    res.json({ user });
  }));

  return router;
}
